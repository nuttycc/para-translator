import { explainRunner } from '@/agent/tasks/explain';
import { translateRunner } from '@/agent/tasks/translate';
import { OpenAIClientPool } from '@/agent/services/openai-client-pool';
import { TaskConfigService } from '@/agent/services/task-config-service';
import { agentStorage } from '@/agent/storage';
import { TASK_TYPES } from '@/agent/types';
import { createLogger } from '@/utils/logger';

import type { AgentContext, AgentResponse, LangAgentSpec, TaskType } from '@/agent/types';
import type { TaskRunner } from '@/agent/tasks/types';

const RUNNERS: Record<TaskType, TaskRunner> = {
  translate: translateRunner,
  explain: explainRunner,
};

export class LangAgent implements LangAgentSpec {
  private readonly log = createLogger('agent');
  readonly taskTypes = TASK_TYPES;
  private configService = new TaskConfigService();
  private clientPool = new OpenAIClientPool();

  async init() {
    this.log.info`Initializing LangAgent`;
    await this.configService.init();
  }

  dispose() {
    this.log.info`Disposing LangAgent`;
    this.configService.dispose();
    this.clientPool.clear();
  }

  async perform(taskType: TaskType, context: AgentContext): Promise<AgentResponse> {
    try {
      this.log.info`Performing task: ${taskType}`;

      const config = this.configService.get(taskType);
      const client = await this.clientPool.get(config.aiConfigId);
      const runner = RUNNERS[taskType];

      const result = await runner.run(context, config, client);
      await this.recordExecution(taskType, context, result, config.aiConfigId);

      return { ok: true, data: result };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.error`Task failed: ${taskType}, ${message}`;
      return { ok: false, error: message };
    }
  }

  private async recordExecution(
    taskType: TaskType,
    context: AgentContext,
    result: string,
    aiConfigId: string
  ) {
    const history = (await agentStorage.agentExecutionResults.getValue()) || [];
    history.unshift({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      taskType,
      context,
      result,
      aiConfigId,
    });
    await agentStorage.agentExecutionResults.setValue(history);
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
