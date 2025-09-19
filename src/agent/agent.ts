import { ExplainExecutor } from '@/agent/executor/explain';
import { TranslateExecutor } from '@/agent/executor/translate';
import { agentStorage } from '@/agent/storage';
import { TASK_TYPES } from '@/agent/types';
import { createLogger } from '@/utils/logger';

import type { AgentContext, AgentResponse, LangAgentSpec, TaskType } from '@/agent/types';

export class LangAgent implements LangAgentSpec {
  private readonly log = createLogger('agent');
  readonly taskTypes = TASK_TYPES;
  private taskExecutors = new Map<TaskType, ExplainExecutor | TranslateExecutor>();

  async init() {
    await this.initExecutor('explain', new ExplainExecutor());
    await this.initExecutor('translate', new TranslateExecutor());
  }

  private async initExecutor(taskType: TaskType, executor: ExplainExecutor | TranslateExecutor) {
    this.taskExecutors.set(taskType, executor);
    await executor.init();
  }

  async perform(taskType: TaskType, context: AgentContext): Promise<AgentResponse> {
    const executor = this.taskExecutors.get(taskType);
    if (!executor) {
      return { ok: false, error: `Executor for task type ${taskType} not found` };
    }

    try {
      const result = await executor.execute(context);
      await this.recordExecution(taskType, context, result, executor.runtimeConfig.aiConfigId);
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
