import { ExplainExecutor } from '@/agent/executor/explain';
import { TranslateExecutor } from '@/agent/executor/translate';
import { agentStorage } from '@/agent/storage';
import {
  TASK_TYPES,
  type AgentContext,
  type AgentResponse,
  type LangAgentSpec,
  type TaskExecutor,
  type TaskType,
} from '@/agent/types';
import { createLogger } from '@/utils/logger';

/**
 * The LangAgent class is a singleton that manages the task executors for the LangAgent.
 * It is responsible for initializing the task executors and performing tasks.
 */
export class LangAgent implements LangAgentSpec {
  private readonly log = createLogger('agent');
  readonly taskTypes = TASK_TYPES;
  private taskExecutors = new Map<TaskType, ExplainExecutor | TranslateExecutor>();

  async init() {
    const explainExecutor = new ExplainExecutor();
    this.taskExecutors.set('explain', explainExecutor);
    const translateExecutor = new TranslateExecutor();
    this.taskExecutors.set('translate', translateExecutor);
  }

  async perform(taskType: TaskType, context: AgentContext): Promise<AgentResponse> {
    this.log.info`Start perform, ${taskType}`;
    const executor = this.taskExecutors.get(taskType);
    if (!executor) {
      return { ok: false, error: `Executor for task type ${taskType} not found` };
    }
    await executor.init();
    try {
      const result = await executor.execute(context);
      const history = await agentStorage.agentExecutionResults.getValue() || [];
      history.unshift({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        taskType,
        context,
        result,
        aiConfigId: executor.runtimeConfig.aiConfigId,
      });
      await agentStorage.agentExecutionResults.setValue(history);
      this.log.info`perform success, ${taskType}, ${result} New History: ${history}`;
      return { ok: true, data: result };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.error`perform failed, ${taskType}, ${message}`;
      return { ok: false, error: message };
    }
  }
}

let langAgentPromise: Promise<LangAgent> | null = null;

/**
 * Returns the singleton LangAgent, initializing it on first invocation.
 *
 * If no instance exists, a new LangAgent is created and its async init() is awaited before returning.
 * Note: concurrent callers that run after the instance is created but before init() completes may receive
 * the same LangAgent reference while initialization is still in progress.
 *
 * @returns The initialized (or initializing) singleton LangAgent instance.
 */
export async function getLangAgent(): Promise<LangAgent> {
  if (!langAgentPromise) {
    langAgentPromise = (async () => {
      const agent = new LangAgent();
      await agent.init();
      return agent;
    })();
  }
  return await langAgentPromise;
}
