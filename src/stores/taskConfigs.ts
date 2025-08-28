import { defineStore } from 'pinia';
import { readonly, ref, computed, toRaw, onScopeDispose, watch } from 'vue';
import type { TaskRuntimeConfig, TaskRuntimeConfigs, TaskType } from '@/agent/types';
import { agentStorage } from '@/agent/storage';
import { createLogger } from '@/utils/logger';
import { AGENT_SEEDS } from '@/agent/seeds';

const logger = createLogger('useTaskConfigsStore');

export const useTaskConfigsStore = defineStore('taskConfigs', () => {
  const taskRuntimeConfigs = ref<TaskRuntimeConfigs>(AGENT_SEEDS.TASK_RUNTIME_CONFIGS);
  const lastActiveTaskId = ref<TaskType>('translate');
  const lastWriteError = ref<unknown | null>(null);

  let isInitialized = false;
  let initPromise: Promise<void> | null = null;

  const suppressWrite = ref(false);
  let unwatchStorage: (() => void) | null = null;
  let unwatchState: (() => void) | null = null;

  // Getters to reduce repetitive computations in views
  const taskIds = computed(() => Object.keys(taskRuntimeConfigs.value || {}));
  const firstTaskId = computed(() => taskIds.value.at(0) || 'translate');
  const hasTasks = computed(() => taskIds.value.length > 0);

  const withSuppressWrite = async <T>(fn: () => Promise<T> | T): Promise<T> => {
    suppressWrite.value = true;
    try {
      return await fn();
    } finally {
      suppressWrite.value = false;
    }
  };

  async function ensureInit(): Promise<void> {
    if (isInitialized) return;
    if (initPromise) return initPromise;
    initPromise = (async () => {
      taskRuntimeConfigs.value = (await agentStorage.taskConfigs.getValue()) ?? null;
      if (!unwatchStorage) {
        unwatchStorage = agentStorage.taskConfigs.watch((newValue) => {
          return withSuppressWrite(() => {
            taskRuntimeConfigs.value = newValue ?? null;
            logger.debug`Task configs storage change merged`;
          });
        });
      }
      if (!unwatchState) {
        unwatchState = watch(
          taskRuntimeConfigs,
          async () => {
            if (suppressWrite.value || !taskRuntimeConfigs.value) return;
            await agentStorage.taskConfigs.setValue(taskRuntimeConfigs.value);
          },
          { deep: true }
        );
      }

      isInitialized = true;

      logger.debug`Task configs initialized. ${toRaw(taskRuntimeConfigs.value)}`;
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
    const next = { ...toRaw(prev), [taskType]: config } as TaskRuntimeConfigs;
    try {
      await agentStorage.taskConfigs.setValue(next);
      taskRuntimeConfigs.value = next;
      logger.debug`Updated task config for ${taskType}. prev: ${toRaw(prev)}, next: ${toRaw(next)}`;
    } catch (err) {
      lastWriteError.value = err;
      logger.error`Failed to update task config for ${taskType}: ${String(err)}`;
      // Reload from storage to reconcile
      taskRuntimeConfigs.value = (await agentStorage.taskConfigs.getValue()) ?? null;
    }
  }

  function setLastActiveTaskId(taskId: TaskType): void {
    // Only accept ids that exist in current state to avoid dangling references
    if (taskId && taskRuntimeConfigs.value && taskRuntimeConfigs.value[taskId]) {
      lastActiveTaskId.value = taskId;
    }
  }

  // Register cleanup with onScopeDispose to avoid overriding Pinia's built-in $dispose
  onScopeDispose(() => {
    if (unwatchStorage) {
      unwatchStorage();
      unwatchStorage = null;
    }
    // Reset initialization state to allow re-initialization if needed
    isInitialized = false;
    initPromise = null;
  });

  return {
    taskRuntimeConfigs,
    taskIds,
    firstTaskId,
    hasTasks,
    lastActiveTaskId,
    load,
    updateOne,
    setLastActiveTaskId,
    lastWriteError,
  };
});
