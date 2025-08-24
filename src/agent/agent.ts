import {
  TASK_TYPES,
  type AgentContext,
  type AgentResult,
  type LangAgentSpec,
  type TaskExecutor,
  type TaskType
} from '@/agent/types';
import { createLogger } from '@/utils/logger';
import { TranslateExecutor } from './executor';

export class LangAgent implements LangAgentSpec {
  private readonly log = createLogger('agent');
  readonly taskTypes = TASK_TYPES;
  private taskExecutors: Map<TaskType, TaskExecutor> = new Map();


  async init(){
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
