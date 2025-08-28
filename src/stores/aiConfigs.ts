import { AGENT_SEEDS } from '@/agent/seeds';
import { agentStorage } from '@/agent/storage';
import type { AIConfig, AIConfigs } from '@/agent/types';
import { createLogger } from '@/utils/logger';
import { isEqual, omit } from 'es-toolkit';
import { defineStore } from 'pinia';
import { computed, onScopeDispose, readonly, ref, toRaw, watch } from 'vue';

const logger = createLogger('useAiConfigsStore');

export const useAiConfigsStore = defineStore('aiConfigs', () => {
  const aiConfigsState = ref<AIConfigs>(AGENT_SEEDS.AI_CONFIGS);
  const lastWriteError = ref<unknown | null>(null);
  const lastActiveConfigId = ref<string>('');

  let unwatchStorage: (() => void) | null = null;
  let unwatchState: (() => void) | null = null;

  let isInitialized = false;
  let initPromise: Promise<void> | null = null;
  let suppressWriteDepth = 0;

  /**
   * Executes a function with write suppression, allowing for reentrant (nested) calls.
   * Uses a depth counter instead of a boolean flag to prevent premature clearing
   * when multiple nested operations are in progress.
   */
  const withSuppressWrite = async <T>(fn: () => Promise<T> | T): Promise<T> => {
    suppressWriteDepth++;
    try {
      return await fn();
    } finally {
      suppressWriteDepth--;
    }
  };

  // Getters
  const configIds = computed(() => Object.keys(aiConfigsState.value));
  const firstConfigId = computed(() => configIds.value.at(0) || '');
  const hasConfigs = computed(() => configIds.value.length > 0);

  // state -> storage
  const writeToStorage = async () => {
    try {
      lastWriteError.value = null;
      await agentStorage.aiConfigs.setValue({ ...aiConfigsState.value });
      logger.debug`Persisted aiConfigs (${Object.keys(aiConfigsState.value).length} items)`;
    } catch (err) {
      // Reload from storage to reconcile and expose error
      lastWriteError.value = err;
      const fresh = (await agentStorage.aiConfigs.getValue()) ?? {};
      await withSuppressWrite(() => {
        if (!isEqual(aiConfigsState.value, fresh)) {
          aiConfigsState.value = fresh;
        }
        return undefined;
      });
      logger.error`Failed to persist aiConfigs: ${String(err)}`;
    }
  };

  /**
   * Ensure the aiConfigs store is initialized.
   *
   * Loads initial AI configs from persistent storage into the in-memory map and sets up two-way synchronization:
   * - storage -> state: watches storage changes and merges them into the reactive `aiConfigsState` (last-write-wins by `updatedAt`).
   * - state -> storage: watches the in-memory state and writes changes back to storage (writes are suppressed during internal merges).
   *
   * This function is idempotent and concurrent-safe: if initialization is already complete it returns immediately; if an initialization
   * is in progress it returns the in-flight promise. On completion it marks the store as initialized and registers cleanup hooks
   * (unwatch functions) for the installed watchers.
   *
   * @returns A promise that resolves when initialization has completed.
   */
  async function ensureInit(): Promise<void> {
    if (isInitialized) {
      logger.debug`AI Configs already initialized. Skipping init.`;
      return;
    }
    if (initPromise) {
      logger.debug`Waiting for AI Configs init promise...`;
      return initPromise;
    }
    logger.debug`Initializing AI Configs...`;
    initPromise = (async () => {
      await withSuppressWrite(async () => {
        aiConfigsState.value = (await agentStorage.aiConfigs.getValue()) ?? {};
      });
      if (!unwatchStorage) {
        // storage -> state (read)
        unwatchStorage = agentStorage.aiConfigs.watch((newValue) => {
          return withSuppressWrite(() => {
            // Last-write-wins by updatedAt for each key
            const incoming = newValue || {};
            const current = aiConfigsState.value;
            const next: AIConfigs = {};
            // add/update
            for (const [id, cfg] of Object.entries(incoming)) {
              const cur = current[id];
              next[id] = !cur || (cfg.updatedAt ?? 0) >= (cur.updatedAt ?? 0) ? cfg : cur;
            }
            // deletions (present locally but missing in storage)
            for (const id of Object.keys(current)) {
              if (!(id in incoming)) {
                // treat as removed in storage
                // no-op: simply don't copy it into `next`
              }
            }
            aiConfigsState.value = next;
            logger.debug`Read storage change, merged into state. Items=${Object.keys(next).length}`;
            return undefined;
          });
        });
      }

      //  state -> storage (write)
      if (!unwatchState) {
        unwatchState = watch(
          aiConfigsState,
          async () => {
            // Only allow writes when no suppression is active (depth === 0)
            if (suppressWriteDepth > 0) return;
            await writeToStorage();
          },
          { deep: true }
        );
      }

      isInitialized = true;
      logger.debug`AI Configs initialized. ${toRaw(aiConfigsState.value)}`;
    })();
    try {
      await initPromise;
    } finally {
      initPromise = null;
    }
  }

  /**
   * Ensure the aiConfigs store is initialized and synchronized with persistent storage.
   *
   * Awaits initialization (loading initial configs, setting up storage ↔ state watchers, and establishing suppression behavior).
   * Safe to call multiple times; returns immediately if initialization is already complete or in progress.
   */
  async function load(): Promise<void> {
    await ensureInit();
  }

  /**
   * Adds or updates an AI configuration in the store.
   *
   * Ensures the store is initialized, normalizes `localModels` and `remoteModels`, and merges the config into the in-memory `aiConfigsState`.
   * If an existing config with the same `id` exists and the only differences are `createdAt`/`updatedAt`, the update is skipped to avoid a no-op write.
   * When applied, `updatedAt` is set to the current timestamp and the config is merged into the state map.
   *
   * @param config - The AI configuration to add or update. Must include an `id`.
   * @returns A promise that resolves once the in-memory state has been updated.
   */
  async function upsert(config: AIConfig): Promise<void> {
    await ensureInit();
    const next: AIConfig = {
      ...config,
      localModels: Array.isArray(config.localModels) ? config.localModels : [],
      remoteModels: Array.isArray(config.remoteModels) ? config.remoteModels : undefined,
    };
    const prev = aiConfigsState.value[next.id];
    if (prev) {
      // Compare objects ignoring timestamp fields (createdAt and updatedAt)
      const prevWithoutTimestamps = omit(prev, ['createdAt', 'updatedAt']);
      const nextWithoutTimestamps = omit(next, ['createdAt', 'updatedAt']);
      if (isEqual(prevWithoutTimestamps, nextWithoutTimestamps)) {
        logger.debug`Skipping write operation for ${next.id} because it is identical to the previous version`;
        return; // Skip no-op write when objects are identical
      }
    }
    next.updatedAt = Date.now();
    aiConfigsState.value = { ...aiConfigsState.value, [next.id]: next };
  }

  /**
   * Sets the last-active AI config ID if it exists in the current store.
   *
   * If `configId` is empty or does not match a key in the in-memory `aiConfigsState`,
   * no change is made (prevents dangling references).
   *
   * @param configId - The ID of the config to mark as last active.
   */
  function setLastActiveConfigId(configId: string): void {
    // Only accept ids that exist in current state to avoid dangling references
    if (configId && aiConfigsState.value[configId]) {
      lastActiveConfigId.value = configId;
    }
  }

  /**
   * Remove an AI configuration from the in-memory store.
   *
   * Ensures the store is initialized, deletes the config with the given id from the reactive
   * aiConfigsState, and if the removed id was the lastActiveConfigId updates lastActiveConfigId
   * to the last remaining config id (or to an empty string when none remain).
   *
   * This function mutates only the in-memory state; persistence to storage is handled by the
   * store's state->storage synchronization watcher and is not performed directly here.
   */
  async function remove(configId: string): Promise<void> {
    await ensureInit();
    const next = { ...aiConfigsState.value };
    delete next[configId];
    aiConfigsState.value = next;

    if (lastActiveConfigId.value === configId) {
      lastActiveConfigId.value = Object.keys(next).at(-1) ?? '';
    }
  }

  // Register cleanup with onScopeDispose to avoid overriding Pinia's built-in $dispose
  onScopeDispose(() => {
    if (unwatchStorage) {
      unwatchStorage();
      unwatchStorage = null;
    }
    if (unwatchState) {
      unwatchState();
      unwatchState = null;
    }
    // Reset initialization state to allow re-initialization if needed
    isInitialized = false;
    initPromise = null;
  });

  return {
    aiConfigs: aiConfigsState,
    configIds: readonly(configIds),
    firstConfigId: readonly(firstConfigId),
    hasConfigs: readonly(hasConfigs),
    lastActiveConfigId: readonly(lastActiveConfigId),
    load,
    remove,
    setLastActiveConfigId,
    upsert,
    lastWriteError: readonly(lastWriteError),
  };
});
