import { AGENT_SEEDS } from '@/agent/seeds';
import { agentStorage } from '@/agent/storage';
import { TASK_TYPES } from '@/agent/types';
import { createLogger } from '@/utils/logger';

import type { TaskRuntimeConfig, TaskRuntimeConfigs, TaskType } from '@/agent/types';

const log = createLogger('TaskConfigService');

export class TaskConfigService {
  private configs = new Map<TaskType, TaskRuntimeConfig>();
  private unwatch?: () => void;

  async init(): Promise<void> {
    log.info`Initializing task config service for tasks: ${TASK_TYPES.join(', ')}`;

    const loaded = await agentStorage.task.getValue().catch(() => undefined);

    for (const taskType of TASK_TYPES) {
      this.configs.set(taskType, loaded?.[taskType] ?? AGENT_SEEDS.TASK_RUNTIME_CONFIGS[taskType]);
    }

    this.unwatch = agentStorage.task.watch((next: TaskRuntimeConfigs | null | undefined) => {
      if (!next) return;

      for (const taskType of TASK_TYPES) {
        const updated = next[taskType];
        if (!updated) continue;

        const current = this.configs.get(taskType);

        if (
          !current ||
          current.aiConfigId !== updated.aiConfigId ||
          current.temperature !== updated.temperature ||
          current.prompt.system !== updated.prompt.system ||
          current.prompt.user !== updated.prompt.user
        ) {
          log.info`Updating config for task: ${taskType}`;
          this.configs.set(taskType, updated);
        }
      }
    });
  }

  get(taskType: TaskType): TaskRuntimeConfig {
    const config = this.configs.get(taskType);
    if (!config) {
      throw new Error(`Runtime config not found for task: ${taskType}`);
    }
    return config;
  }

  dispose(): void {
    log.info`Disposing task config service`;
    this.unwatch?.();
    this.unwatch = undefined;
    this.configs.clear();
  }
}
