import { Mutex } from 'es-toolkit/promise';

import { OpenAIClientPool } from '@/agent/services/openai-client-pool';
import { TaskConfigService } from '@/agent/services/task-config-service';
import { agentStorage } from '@/agent/storage';
import { explainRunner } from '@/agent/tasks/explain';
import { translateRunner } from '@/agent/tasks/translate';
import { TASK_TYPES } from '@/agent/types';
import { createLogger } from '@/utils/logger';

import type { TaskRunner } from '@/agent/tasks/types';
import type { AgentContext, AgentResponse, LangAgentSpec, TaskType } from '@/agent/types';
import type { ChatCompletion } from 'openai/resources/index.mjs';

const RUNNERS: Record<TaskType, TaskRunner> = {
  translate: translateRunner,
  explain: explainRunner,
};

export class LangAgent implements LangAgentSpec {
  private readonly log = createLogger('agent');
  readonly taskTypes = TASK_TYPES;
  private configService = new TaskConfigService();
  private clientPool: OpenAIClientPool | null = null;
  private readonly runsMutex = new Mutex();

  async init() {
    this.log.info`Initializing LangAgent`;
    await this.configService.init();
  }

  dispose() {
    this.log.info`Disposing LangAgent`;
    this.configService.dispose();
    if (this.clientPool) {
      this.clientPool.clear();
    }
  }

  async perform(taskType: TaskType, context: AgentContext): Promise<AgentResponse> {
    try {
      this.log.info`Performing task: ${taskType}...`;

      const config = this.configService.get(taskType);

      // Lazy load OpenAI client pool
      if (!this.clientPool) {
        const { OpenAIClientPool } = await import('@/agent/services/openai-client-pool');
        this.clientPool = new OpenAIClientPool();
      }

      const client = await this.clientPool.get(config.aiConfigId);
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
    response: ChatCompletion,
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
