import { isEqual, omit } from 'es-toolkit';
import { defineStore } from 'pinia';
import { computed, onScopeDispose, readonly, ref, toRaw, watch } from 'vue';

import { AGENT_SEEDS } from '@/agent/seeds';
import { agentStorage } from '@/agent/storage';
import { createLogger } from '@/utils/logger';

import type { AIConfig, AIConfigs } from '@/agent/types';

const logger = createLogger('store', 'ai-providers');

export const useAiProviderStore = defineStore('ai-providers', () => {
  const aiConfigsState = ref<AIConfigs>(AGENT_SEEDS.AI_CONFIGS);
  const lastWriteError = ref<unknown>(null);
  const lastActiveConfigId = ref<string>('');

  let unwatchStorage: (() => void) | null = null;
  let unwatchState: (() => void) | null = null;

  let isInitialized = false;
  let initPromise: Promise<void> | null = null;
  let suppressWriteDepth = 0;

  /**
   * Run a function while suppressing writes to storage.
   * Uses a depth counter so nested calls stay safe.
   */
  const withSuppressWrite = async <T>(fn: () => Promise<T> | T): Promise<T> => {
    suppressWriteDepth++;
    try {
      return await fn();
    } finally {
      suppressWriteDepth--;
    }
  };

  // Derived state
  const configIds = computed(() => Object.keys(aiConfigsState.value));
  const firstConfigId = computed(() => configIds.value.at(0) || '');
  const hasConfigs = computed(() => configIds.value.length > 0);

  // Persist state -> storage
  const writeToStorage = async () => {
    try {
      logger.debug`Writing state to storage...`;

      lastWriteError.value = null;
      await agentStorage.aiConfigs.setValue(toRaw(aiConfigsState.value));
    } catch (err) {
      // On failure: record the error and reconcile from storage
      lastWriteError.value = err;
      const fresh = (await agentStorage.aiConfigs.getValue()) ?? {};
      await withSuppressWrite(() => {
        if (!isEqual(aiConfigsState.value, fresh)) {
          aiConfigsState.value = fresh;
        }
        return undefined;
      });
      logger.error`Failed to write state to storage: ${String(err)}`;
    }
  };

  /**
   * Initialize and set up bidirectional sync with storage.
   * Idempotent and concurrency-safe.
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
        // Storage -> State: merge by updatedAt (last-write-wins per key)
        unwatchStorage = agentStorage.aiConfigs.watch((newValue) =>
          withSuppressWrite(() => {
            const incoming = toRaw(newValue) ?? {};
            const current = toRaw(aiConfigsState.value);
            const next: AIConfigs = {};

            // Add/update from storage
            for (const [id, cfg] of Object.entries(incoming)) {
              const cur = current[id];
              next[id] = !cur || (cfg.updatedAt ?? 0) >= (cur.updatedAt ?? 0) ? cfg : cur;
            }
            // Respect deletions in storage: keys missing in `incoming` are not copied into `next`
            for (const id of Object.keys(current)) {
              if (!(id in incoming)) {
                // Intentionally left blank
              }
            }
            aiConfigsState.value = next;
            logger.debug`Watched storage change, merged into state. next: ${next}`;

            return undefined;
          })
        );
      }

      // State -> Storage: persist changes unless writes are suppressed
      if (!unwatchState) {
        unwatchState = watch(
          aiConfigsState,
          async () => {
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

  /** Ensure initialization and storage sync (safe to call repeatedly). */
  async function load(): Promise<void> {
    await ensureInit();
  }

  /**
   * Add or update a config.
   * Normalizes arrays, skips no-op updates, and refreshes updatedAt.
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
      // Compare while ignoring timestamps
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

  /** Set the last-active config ID if it exists. */
  function setLastActiveConfigId(configId: string): void {
    if (configId && aiConfigsState.value[configId]) {
      lastActiveConfigId.value = configId;
    }
  }

  /**
   * Remove a config and update `lastActiveConfigId` if needed.
   * Persistence is handled by the state watcher.
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

  // Cleanup watchers and reset init flags on scope disposal
  onScopeDispose(() => {
    if (unwatchStorage) {
      unwatchStorage();
      unwatchStorage = null;
    }
    if (unwatchState) {
      unwatchState();
      unwatchState = null;
    }
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
