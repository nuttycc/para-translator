import { storage } from '#imports';
import { type IConfigList, type TaskRuntimeConfig } from '@/agent/types';
import { DEFAULT_AI_CONFIG_LIST, DefaultTaskConfig } from '@/agent/constants';

/**
 * AI configurations storage item
 * Stores the list of AI service configurations
 */
export const aiConfigsStorage = storage.defineItem<IConfigList>('local:aiConfigs', {
  fallback: DEFAULT_AI_CONFIG_LIST,
  version: 1,
});

/**
 * Task runtime configurations storage item
 * Stores runtime configurations for different task types (translate, explain, etc.)
 */
export const taskConfigsStorage = storage.defineItem<TaskRuntimeConfig>('local:taskConfigs', {
  fallback: DefaultTaskConfig,
  version: 1,
});

/**
 * Storage utilities for managing configurations
 */
export class StorageManager {
  /**
   * Get all AI configurations
   */
  static async getAIConfigs(): Promise<IConfigList> {
    return await aiConfigsStorage.getValue();
  }

  /**
   * Save AI configurations
   */
  static async setAIConfigs(configs: IConfigList): Promise<void> {
    await aiConfigsStorage.setValue(configs);
  }

  /**
   * Get task configurations
   */
  static async getTaskConfigs(): Promise<TaskRuntimeConfig> {
    return await taskConfigsStorage.getValue();
  }

  /**
   * Save task configurations
   */
  static async setTaskConfigs(configs: TaskRuntimeConfig): Promise<void> {
    await taskConfigsStorage.setValue(configs);
  }

  /**
   * Reset all configurations to defaults
   */
  static async resetToDefaults(): Promise<void> {
    await Promise.all([
      aiConfigsStorage.setValue(DEFAULT_AI_CONFIG_LIST),
      taskConfigsStorage.setValue(DefaultTaskConfig),
    ]);
  }

  /**
   * Clear all stored data
   */
  static async clearAll(): Promise<void> {
    await Promise.all([aiConfigsStorage.removeValue(), taskConfigsStorage.removeValue()]);
  }

  /**
   * Watch for storage changes
   */
  static watchAIConfigs(
    callback: (newConfigs: IConfigList, oldConfigs: IConfigList | null) => void
  ) {
    return aiConfigsStorage.watch(callback);
  }

  static watchTaskConfigs(
    callback: (newConfigs: TaskRuntimeConfig, oldConfigs: TaskRuntimeConfig | null) => void
  ) {
    return taskConfigsStorage.watch(callback);
  }

  /**
   * Get storage metadata
   */
  static async getAIConfigsMeta() {
    return await aiConfigsStorage.getMeta();
  }

  static async getTaskConfigsMeta() {
    return await taskConfigsStorage.getMeta();
  }

  /**
   * Backup current configurations
   */
  static async backup(): Promise<{
    aiConfigs: IConfigList;
    taskConfigs: TaskRuntimeConfig;
    timestamp: number;
  }> {
    const [aiConfigs, taskConfigs] = await Promise.all([
      this.getAIConfigs(),
      this.getTaskConfigs(),
    ]);

    return {
      aiConfigs,
      taskConfigs,
      timestamp: Date.now(),
    };
  }

  /**
   * Restore from backup
   */
  static async restore(backup: {
    aiConfigs: IConfigList;
    taskConfigs: TaskRuntimeConfig;
  }): Promise<void> {
    await Promise.all([
      this.setAIConfigs(backup.aiConfigs),
      this.setTaskConfigs(backup.taskConfigs),
    ]);
  }

  /**
   * Check if storage is initialized with default values
   */
  static async isInitialized(): Promise<boolean> {
    try {
      const [aiConfigs, taskConfigs] = await Promise.all([
        this.getAIConfigs(),
        this.getTaskConfigs(),
      ]);

      return aiConfigs.length > 0 && Object.keys(taskConfigs).length > 0;
    } catch {
      return false;
    }
  }
}
