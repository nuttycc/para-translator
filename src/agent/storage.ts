import { storage } from '#imports';

import { AGENT_SEEDS } from '@/agent/seeds';
import { type AgentExecutionResults, type AIConfigs, type HistoryData, type TaskRuntimeConfigs } from '@/agent/types';

/**
 * AI configurations storage item
 * Stores the list of AI service configurations
 */
const aiConfigsStorage = storage.defineItem<AIConfigs>('local:aiConfigs', {
  init: () => AGENT_SEEDS.AI_CONFIGS,
  version: 1,
});

/**
 * Task runtime configurations storage item
 * Stores runtime configurations for different task types (translate, explain, etc.)
 */
const taskConfigsStorage = storage.defineItem<TaskRuntimeConfigs>('local:taskConfigs', {
  init: () => AGENT_SEEDS.TASK_RUNTIME_CONFIGS,
  version: 1,
});

/**
 * Agent execution results storage item
 * Stores the list of agent execution results
 */
const agentExecutionResultsStorage = storage.defineItem<AgentExecutionResults>(
  'local:agentExecutionResults',
  {
    init: () => [],
    version: 1,
  }
);

const historyDataStorage = storage.defineItem<HistoryData []>('local:historyData', {
  init: () => [],
  fallback: [],
  version: 1,
});

// export all storage items
export const agentStorage = {
  aiConfigs: aiConfigsStorage,
  taskConfigs: taskConfigsStorage,
  agentExecutionResults: agentExecutionResultsStorage,
  historyData: historyDataStorage,
};
