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

  async function load(): Promise<void> {
    await ensureInit();
  }

  // add or update a config
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

  function setLastActiveConfigId(configId: string): void {
    // Only accept ids that exist in current state to avoid dangling references
    if (configId && aiConfigsState.value[configId]) {
      lastActiveConfigId.value = configId;
    }
  }

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
