import { defineStore } from 'pinia';
import { readonly, ref, computed } from 'vue';
import type { AIConfig, AIConfigs } from '@/agent/types';
import { agentStorage } from '@/agent/storage';
import { isEqual } from 'es-toolkit';
import { createLogger } from '@/utils/logger';
import { toRaw } from '#imports';

const logger = createLogger('useAiConfigsStore');

export const useAiConfigsStore = defineStore('aiConfigs', () => {
  const aiConfigsState = ref<AIConfigs>({});
  const lastWriteError = ref<unknown | null>(null);
  const lastActiveConfigId = ref<string>('');
  let isInitialized = false;
  let unwatchStorage: (() => void) | null = null;
  let initPromise: Promise<void> | null = null;

  // Getters to reduce repetitive computations in views
  const configIds = computed(() => Object.keys(aiConfigsState.value));
  const firstConfigId = computed(() => configIds.value.at(0) || '');
  const hasConfigs = computed(() => configIds.value.length > 0);

  const writeThrough = async () => {
    try {
      lastWriteError.value = null;
      await agentStorage.aiConfigs.setValue({ ...aiConfigsState.value });
      logger.debug`Persisted aiConfigs (${Object.keys(aiConfigsState.value).length} items)`;
    } catch (err) {
      // Reload from storage to reconcile and expose error
      lastWriteError.value = err;
      const fresh = (await agentStorage.aiConfigs.getValue()) ?? {};
      aiConfigsState.value = fresh;
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
      aiConfigsState.value = (await agentStorage.aiConfigs.getValue()) ?? {};
      if (!unwatchStorage) {
        unwatchStorage = agentStorage.aiConfigs.watch((newValue) => {
          // Last-write-wins by updatedAt for each key
          const incoming = newValue || {};
          const merged: AIConfigs = { ...aiConfigsState.value };
          for (const [id, cfg] of Object.entries(incoming)) {
            const current = merged[id];
            if (!current || (cfg.updatedAt ?? 0) >= (current.updatedAt ?? 0)) {
              merged[id] = cfg;
            }
          }
          // Do not infer deletions from absence to avoid dropping local, unflushed entries.
          // Deletions should be explicit (handled via `remove()` or tombstones).
          aiConfigsState.value = merged;
          logger.debug`Storage change merged. Items=${Object.keys(merged).length}`;
        });
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

  async function upsert(config: AIConfig): Promise<void> {
    await ensureInit();
    const next: AIConfig = {
      ...config,
      localModels: Array.isArray(config.localModels) ? config.localModels : [],
      remoteModels: Array.isArray(config.remoteModels) ? config.remoteModels : undefined,
      // updatedAt will be set only when there is a meaningful diff
    };
    const prev = aiConfigsState.value[next.id];
    if (prev && isEqual(prev, next)) {
      logger.debug`Skipping write operation for ${next.id} because it is identical to the previous version`;
      return; // Skip no-op write when objects are identical
    }

    next.updatedAt = Date.now();
    aiConfigsState.value = { ...aiConfigsState.value, [next.id]: next };
    writeThrough();
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
    try {
      await agentStorage.aiConfigs.setValue({ ...next });
      logger.debug`Removed config ${configId}. Items=${Object.keys(next).length}`;
    } catch (err) {
      lastWriteError.value = err;
      logger.error`Failed to remove config ${configId}: ${String(err)}`;
      aiConfigsState.value = (await agentStorage.aiConfigs.getValue()) ?? {};
    }
  }

  return {
    aiConfigs: readonly(aiConfigsState),
    configIds: readonly(configIds),
    firstConfigId: readonly(firstConfigId),
    hasConfigs: readonly(hasConfigs),
    lastActiveConfigId: readonly(lastActiveConfigId),
    load,
    upsert,
    remove,
    setLastActiveConfigId,
    lastWriteError: readonly(lastWriteError),
  };
});
