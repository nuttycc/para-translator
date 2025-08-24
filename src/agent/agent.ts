import {
  TASK_TYPES,
  type AgentContext,
  type AgentResult,
  type LangAgentSpec,
  type TaskExecutor,
  type TaskType,
} from '@/agent/types';
import { createLogger } from '@/utils/logger';
import { TranslateExecutor } from './executor';

export class LangAgent implements LangAgentSpec {
  private readonly log = createLogger('agent');
  readonly taskTypes = TASK_TYPES;
  private taskExecutors: Map<TaskType, TaskExecutor> = new Map();

  async init() {
    const translateExecutor = new TranslateExecutor();
    await translateExecutor.init();
    this.taskExecutors.set('translate', translateExecutor);
  }

  async perform(taskType: TaskType, context: AgentContext): Promise<AgentResult> {
    this.log.info('perform', { taskType });
    const executor = this.taskExecutors.get(taskType);
    if (!executor) {
      return { ok: false, error: `Executor for task type ${taskType} not found` };
    }

    return await executor.execute(context);
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
