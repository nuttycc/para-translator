// src/agent/configManager.ts
import {
  type IConfig,
  type IConfigList,
  type RuntimeConfig,
  type TaskRuntimeConfig,
  type TaskType,
} from '@/agent/types';
import { DEFAULT_AI_CONFIG_LIST, DefaultTaskConfig } from '@/agent/constants';
import { StorageManager } from '@/agent/storage';

/**
 * AI Configuration Manager.
 * Manages AI service configurations with persistent storage.
 */
export class AIConfigManager {
  private configs: Map<string, IConfig>;
  private initialized: boolean = false;

  constructor() {
    this.configs = new Map();
  }

  /**
   * Initialize the manager by loading configurations from storage
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const storedConfigs = await StorageManager.getAIConfigs();
      this.loadConfigs(storedConfigs);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize AIConfigManager:', error);
      // Fallback to defaults if storage fails
      this.loadConfigs(DEFAULT_AI_CONFIG_LIST);
      this.initialized = true;
    }
  }

  /**
   * Load configurations into the manager
   */
  private loadConfigs(configs: IConfigList): void {
    this.configs.clear();
    configs.forEach((config) => {
      this.configs.set(config.id, { ...config });
    });
  }

  getAll(): IConfigList {
    return Array.from(this.configs.values());
  }

  getById(id: string): IConfig | undefined {
    return this.configs.get(id);
  }

  async add(config: IConfig): Promise<void> {
    // Ensure we're working with a copy
    const newConfig = { ...config };
    this.configs.set(config.id, newConfig);

    // Sync to storage
    await this.syncToStorage();
  }

  async update(id: string, updates: Partial<IConfig>): Promise<IConfig | null> {
    const existing = this.configs.get(id);
    if (!existing) {
      return null;
    }

    // Merge updates with existing config
    const updated = { ...existing, ...updates, id, updatedAt: Date.now() };
    this.configs.set(id, updated);

    // Sync to storage
    await this.syncToStorage();
    return updated;
  }

  async remove(id: string): Promise<boolean> {
    const deleted = this.configs.delete(id);
    if (deleted) {
      // Sync to storage
      await this.syncToStorage();
    }
    return deleted;
  }

  /**
   * Sync current configurations to storage
   */
  private async syncToStorage(): Promise<void> {
    try {
      const configs = this.getAll();
      await StorageManager.setAIConfigs(configs);
    } catch (error) {
      console.error('Failed to sync AI configs to storage:', error);
    }
  }

  exists(id: string): boolean {
    return this.configs.has(id);
  }

  getAsMap(): Record<string, IConfig> {
    const map: Record<string, IConfig> = {};
    this.configs.forEach((config, id) => {
      map[id] = config;
    });
    return map;
  }
}

/**
 * Task Configuration Manager.
 *
 * @remark
 *
 * Used to store and retrieve task runtime configurations. e.g. temperature, prompt, etc.
 * Now with persistent storage support.
 */
export class TaskConfigManager {
  private configs: TaskRuntimeConfig;
  private initialized: boolean = false;

  constructor() {
    this.configs = DefaultTaskConfig;
  }

  /**
   * Initialize the manager by loading configurations from storage
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const storedConfigs = await StorageManager.getTaskConfigs();
      this.configs = storedConfigs;
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize TaskConfigManager:', error);
      // Fallback to defaults if storage fails
      this.configs = DefaultTaskConfig;
      this.initialized = true;
    }
  }

  get(taskType: TaskType): RuntimeConfig {
    return this.configs[taskType];
  }

  async set(taskType: TaskType, config: RuntimeConfig): Promise<void> {
    this.configs[taskType] = config;
    // Sync to storage
    await this.syncToStorage();
  }

  /**
   * Sync current configurations to storage
   */
  private async syncToStorage(): Promise<void> {
    try {
      await StorageManager.setTaskConfigs(this.configs);
    } catch (error) {
      console.error('Failed to sync task configs to storage:', error);
    }
  }
}

let aiConfigManagerInstance: AIConfigManager | null = null;
let taskConfigManagerInstance: TaskConfigManager | null = null;

export async function getAIConfigManager(): Promise<AIConfigManager> {
  if (!aiConfigManagerInstance) {
    aiConfigManagerInstance = new AIConfigManager();
    await aiConfigManagerInstance.init();
  }
  return aiConfigManagerInstance;
}

export async function getTaskConfigManager(): Promise<TaskConfigManager> {
  if (!taskConfigManagerInstance) {
    taskConfigManagerInstance = new TaskConfigManager();
    await taskConfigManagerInstance.init();
  }
  return taskConfigManagerInstance;
}

// For backward compatibility - synchronous access (may not be initialized)
export function getAIConfigManagerSync(): AIConfigManager | null {
  return aiConfigManagerInstance;
}

export function getTaskConfigManagerSync(): TaskConfigManager | null {
  return taskConfigManagerInstance;
}

// Note: Proxy objects have been removed. Use getAIConfigManager() and getTaskConfigManager() instead.
