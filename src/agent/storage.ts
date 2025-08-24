import { storage } from '#imports';
import { type AIConfigs, type TaskRuntimeConfigs } from '@/agent/types';
import { AGENT_SEEDS } from '@/agent/seeds';

/**
 * AI configurations storage item
 * Stores the list of AI service configurations
 */
const aiConfigsStorage = storage.defineItem<AIConfigs>('local:aiConfigs', {
  fallback: AGENT_SEEDS.AI_CONFIGS,
  version: 1,
});

/**
 * Task runtime configurations storage item
 * Stores runtime configurations for different task types (translate, explain, etc.)
 */
const taskConfigsStorage = storage.defineItem<TaskRuntimeConfigs>('local:taskConfigs', {
  fallback: AGENT_SEEDS.TASK_RUNTIME_CONFIGS,
  version: 1,
});

// export all storage items
export const agentStorage = {
  aiConfigs: aiConfigsStorage,
  taskConfigs: taskConfigsStorage,
};


