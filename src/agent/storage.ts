import { storage } from '#imports';

import { AGENT_SEEDS } from '@/agent/seeds';
import { type AgentExecutionResults, type AIConfigs, type TaskRuntimeConfigs } from '@/agent/types';

const aiConfigsStorage = storage.defineItem<AIConfigs>('local:settings-ai', {
  init: () => AGENT_SEEDS.AI_CONFIGS,
  version: 1,
});

const taskConfigsStorage = storage.defineItem<TaskRuntimeConfigs>('local:settings-task', {
  init: () => AGENT_SEEDS.TASK_RUNTIME_CONFIGS,
  version: 1,
});

const agentExecutionResultsStorage = storage.defineItem<AgentExecutionResults>(
  'local:history-task',
  {
    init: () => [],
    version: 1,
  }
);

// export all storage items
export const agentStorage = {
  ai: aiConfigsStorage,
  task: taskConfigsStorage,
  runs: agentExecutionResultsStorage,
};
