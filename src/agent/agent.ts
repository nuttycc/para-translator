import { Mutex } from 'es-toolkit/promise';

import { TaskConfigService } from '@/agent/services/task-config-service';
import { agentStorage } from '@/agent/storage';
import { explainRunner } from '@/agent/tasks/explain';
import { translateRunner } from '@/agent/tasks/translate';
import { TASK_TYPES } from '@/agent/types';
import { createLogger } from '@/utils/logger';

import type { OpenAIClientPool } from '@/agent/services/openai-client-pool';
import type { TaskRunner } from '@/agent/tasks/types';
import type { AgentContext, AgentResponse, LangAgentSpec, TaskType } from '@/agent/types';
import type { OpenAI } from 'openai';

const RUNNERS: Record<TaskType, TaskRunner> = {
  translate: translateRunner,
  explain: explainRunner,
};

export class LangAgent implements LangAgentSpec {
  private readonly log = createLogger('agent');
  readonly taskTypes = TASK_TYPES;
  private configService = new TaskConfigService();
  private readonly runsMutex = new Mutex();

  async init() {
    this.log.info`Initializing LangAgent`;
    await this.configService.init();
  }

  async dispose() {
    this.log.info`Disposing LangAgent`;
    this.configService.dispose();

    // Clear the client pool if it was initialized
    if (clientPoolPromise) {
      try {
        const clientPool = await clientPoolPromise;
        clientPool.clear();
      } catch (err) {
        // Ignore errors during cleanup
        this.log.warn`Failed to clear client pool during dispose: ${err}`;
      }
      // Reset the promise so a new pool can be created if needed
      clientPoolPromise = null;
    }
  }

  async perform(taskType: TaskType, context: AgentContext): Promise<AgentResponse> {
    try {
      this.log.info`Performing task: ${taskType}...`;

      const config = this.configService.get(taskType);

      // Get OpenAI client pool using single-flight initialization
      const clientPool = await getClientPool();
      const client = await clientPool.get(config.aiConfigId);
      const runner = RUNNERS[taskType];

      const response = await runner.run(context, config, client);

      await this.recordExecution(taskType, context, response, config.aiConfigId);

      return { ok: true, data: response.choices?.[0]?.message?.content ?? 'no content' };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.error`Task failed: ${taskType}, ${message}`;
      return { ok: false, error: message };
    }
  }

  private async recordExecution(
    taskType: TaskType,
    context: AgentContext,
    response: OpenAI.Chat.ChatCompletion,
    aiConfigId: string
  ) {
    await this.runsMutex.acquire();
    try {
      const history = (await agentStorage.runs.getValue()) || [];
      history.unshift({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        taskType,
        context,
        response,
        aiConfigId,
      });
      if (history.length > 100) {
        history.pop();
      }
      await agentStorage.runs.setValue(history);
    } finally {
      this.runsMutex.release();
    }
  }
}

let langAgentPromise: Promise<LangAgent> | null = null;
let clientPoolPromise: Promise<OpenAIClientPool> | null = null;

export async function getLangAgent(): Promise<LangAgent> {
  if (!langAgentPromise) {
    langAgentPromise = (async () => {
      try {
        const agent = new LangAgent();
        await agent.init();
        return agent;
      } catch (err) {
        langAgentPromise = null;
        throw err;
      }
    })();
  }
  return langAgentPromise;
}

async function getClientPool(): Promise<OpenAIClientPool> {
  if (!clientPoolPromise) {
    clientPoolPromise = (async () => {
      const { OpenAIClientPool } = await import('@/agent/services/openai-client-pool');
      return new OpenAIClientPool();
    })();
  }
  return clientPoolPromise;
}
