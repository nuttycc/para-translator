import { defineStore } from 'pinia';
import { readonly, ref, computed } from 'vue';
import type { TaskRuntimeConfig, TaskRuntimeConfigs, TaskType } from '@/agent/types';
import { agentStorage } from '@/agent/storage';
import { createLogger } from '@/utils/logger';

const logger = createLogger('useTaskConfigsStore');

export const useTaskConfigsStore = defineStore('taskConfigs', () => {
  const taskRuntimeConfigs = ref<TaskRuntimeConfigs | null>(null);
  const lastWriteError = ref<unknown | null>(null);
  let isInitialized = false;
  let unwatchStorage: (() => void) | null = null;
  let initPromise: Promise<void> | null = null;

  // Getters to reduce repetitive computations in views
  const taskIds = computed(() => Object.keys(taskRuntimeConfigs.value || {}));
  const firstTaskId = computed(() => taskIds.value.at(0) || 'translate');
  const hasTasks = computed(() => taskIds.value.length > 0);

  async function ensureInit(): Promise<void> {
    if (isInitialized) return;
    if (initPromise) return initPromise;
    initPromise = (async () => {
      taskRuntimeConfigs.value = (await agentStorage.taskConfigs.getValue()) ?? null;
      if (!unwatchStorage) {
        unwatchStorage = agentStorage.taskConfigs.watch((newValue) => {
          taskRuntimeConfigs.value = newValue ?? null;
          logger.debug`Task configs storage change merged`;
        });
      }
      isInitialized = true;
    })();
    try {
      await initPromise;
    } finally {
      initPromise = null;
    }
  }

  async function load(): Promise<void> {
    await ensureInit();
  }

  async function updateOne(taskType: TaskType, config: TaskRuntimeConfig): Promise<void> {
    await ensureInit();
    const prev = taskRuntimeConfigs.value ?? {};
    const next = { ...prev, [taskType]: config };
    try {
      await agentStorage.taskConfigs.setValue(next);
      taskRuntimeConfigs.value = next;
      logger.debug`Updated task config for ${taskType}`;
    } catch (err) {
      lastWriteError.value = err;
      logger.error`Failed to update task config for ${taskType}: ${String(err)}`;
      // Reload from storage to reconcile
      taskRuntimeConfigs.value = (await agentStorage.taskConfigs.getValue()) ?? null;
    }
  }

  return {
    taskRuntimeConfigs: readonly(taskRuntimeConfigs),
    taskIds: readonly(taskIds),
    firstTaskId: readonly(firstTaskId),
    hasTasks: readonly(hasTasks),
    load,
    updateOne,
    lastWriteError: readonly(lastWriteError),
  };
});
