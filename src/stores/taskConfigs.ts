import { defineStore } from 'pinia';
import { ref, computed, toRaw, onScopeDispose, watch } from 'vue';
import type { TaskRuntimeConfig, TaskRuntimeConfigs, TaskType } from '@/agent/types';
import { agentStorage } from '@/agent/storage';
import { createLogger } from '@/utils/logger';
import { AGENT_SEEDS } from '@/agent/seeds';

const logger = createLogger('useTaskConfigsStore');

export const useTaskConfigsStore = defineStore('taskConfigs', () => {
  const taskRuntimeConfigs = ref<TaskRuntimeConfigs>(AGENT_SEEDS.TASK_RUNTIME_CONFIGS);
  const lastActiveTaskId = ref<TaskType>('translate');
  const lastWriteError = ref<unknown>(null);

  let isInitialized = false;
  let initPromise: Promise<void> | null = null;

  const suppressWriteDepth = ref(0); // Reentrant write suppression using depth counter
  let unwatchStorage: (() => void) | null = null;
  let unwatchState: (() => void) | null = null;

  // Getters to reduce repetitive computations in views
  const taskIds = computed(() => Object.keys(taskRuntimeConfigs.value));
  const firstTaskId = computed(() => taskIds.value.at(0) || 'translate');
  const hasTasks = computed(() => taskIds.value.length > 0);

  /**
   * Executes a function with write suppression, allowing for reentrant (nested) calls.
   * Uses a depth counter instead of a boolean flag to prevent premature clearing
   * when multiple nested operations are in progress.
   */
  const withSuppressWrite = async <T>(fn: () => Promise<T> | T): Promise<T> => {
    suppressWriteDepth.value++;
    try {
      return await fn();
    } finally {
      suppressWriteDepth.value--;
    }
  };

  /**
   * Lazily initializes the task runtime configs from persistent storage and wires up bidirectional syncing.
   *
   * Loads task runtime configs from agentStorage (falling back to AGENT_SEEDS.TASK_RUNTIME_CONFIGS when absent),
   * establishes a storage watcher to merge external storage changes into the in-memory state (updates occur
   * inside a write-suppressed block), and establishes a Vue watcher to persist in-memory changes back to storage
   * (skipped while suppression is active). Initialization is deduplicated so concurrent callers share a single
   * in-flight initialization. Marks the store as initialized and sets up cleanup handles for the watchers.
   *
   * @returns A promise that resolves when initialization completes.
   */
  async function ensureInit(): Promise<void> {
    if (isInitialized) return;
    if (initPromise) return initPromise;
    initPromise = (async () => {
      taskRuntimeConfigs.value =
        (await agentStorage.taskConfigs.getValue()) ?? AGENT_SEEDS.TASK_RUNTIME_CONFIGS;
      if (!unwatchStorage) {
        unwatchStorage = agentStorage.taskConfigs.watch((newValue) =>
          withSuppressWrite(() => {
            taskRuntimeConfigs.value = newValue ?? AGENT_SEEDS.TASK_RUNTIME_CONFIGS;
            logger.debug`Read storage change, merged into state. next:${newValue}`;
          })
        );
      }
      if (!unwatchState) {
        unwatchState = watch(
          taskRuntimeConfigs,
          async () => {
            // Only allow writes when no suppression is active (depth === 0)
            if (suppressWriteDepth.value > 0 || !taskRuntimeConfigs.value) return;
            logger.debug`Write state to storage: ${toRaw(taskRuntimeConfigs.value)}`;
            await agentStorage.taskConfigs.setValue(toRaw(taskRuntimeConfigs.value));
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

  /**
   * Update and persist the runtime config for a single task type.
   *
   * Ensures the store is initialized, writes the provided config into persistent storage, and updates the in-memory configs. If the storage write fails, the error is recorded in `lastWriteError` and the in-memory configs are reloaded from storage (falling back to seeded defaults).
   *
   * @param taskType - The task type to update
   * @param config - The new runtime configuration for the task
   * @returns A promise that resolves when the update and in-memory synchronization complete
   */
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
      taskRuntimeConfigs.value =
        (await agentStorage.taskConfigs.getValue()) ?? AGENT_SEEDS.TASK_RUNTIME_CONFIGS;
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
