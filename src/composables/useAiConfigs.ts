import { readonly, ref } from 'vue';
import type { AIConfig, AIConfigs } from '@/agent/types';
import { agentStorage } from '@/agent/storage';
import { debounce } from 'es-toolkit';
import { createLogger } from '@/utils/logger';

const aiConfigsState = ref<AIConfigs>({});
const lastWriteError = ref<unknown | null>(null);
let isInitialized = false;
let unwatchStorage: (() => void) | null = null;
const logger = createLogger('useAiConfigs');

const writeThrough = debounce(async () => {
  try {
    lastWriteError.value = null;
    await agentStorage.aiConfigs.setValue({ ...aiConfigsState.value });
    logger.debug`Persisted aiConfigs (${Object.keys(aiConfigsState.value).length} items)`;
  } catch (err) {
    // Reload from storage to reconcile and expose error
    lastWriteError.value = err;
    const fresh = await agentStorage.aiConfigs.getValue();
    aiConfigsState.value = fresh;
    logger.error`Failed to persist aiConfigs: ${String(err)}`;
  }
}, 600);

async function ensureInit(): Promise<void> {
  if (isInitialized) return;
  aiConfigsState.value = await agentStorage.aiConfigs.getValue();
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
      // Handle deletions (keys missing in incoming)
      for (const id of Object.keys(merged)) {
        if (!(id in incoming)) {
          delete merged[id];
        }
      }
      aiConfigsState.value = merged;
      logger.debug`Storage change merged. Items=${Object.keys(merged).length}`;
    });
  }
  isInitialized = true;
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
    updatedAt: Date.now(),
  };
  aiConfigsState.value = { ...aiConfigsState.value, [next.id]: next };
  await writeThrough();
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
    aiConfigsState.value = await agentStorage.aiConfigs.getValue();
  }
}

export function useAiConfigs() {
  return {
    aiConfigs: readonly(aiConfigsState),
    load,
    upsert,
    remove,
    lastWriteError: readonly(lastWriteError),
  };
}


