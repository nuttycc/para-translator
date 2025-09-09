import { defineStore } from 'pinia';
import { readonly, ref, toRaw, watch } from 'vue';

import { agentStorage } from '@/agent/storage';
import type { HistoryData } from '@/agent/types';
import { createLogger } from '@/utils/logger';

export const useHistoryStore = defineStore('history', () => {
  const logger = createLogger('HistoryStore');

  const history = ref<HistoryData[]>([]);
  const isInitialized = ref(false);
  let loadPromise: Promise<void> | null = null;

  const load = async () => {
    history.value = await agentStorage.historyData.getValue();

    // sync: state -> storage
    const { pause, resume } = watch(
      history,
      async (newVal) => {
        await agentStorage.historyData.setValue(toRaw(newVal));
      },
      { deep: true }
    );

    // sync: storage -> state
    agentStorage.historyData.watch((newVal) => {
      pause();
      history.value = newVal;
      resume();
    });

    isInitialized.value = true;
  };

  const ensureInit = async (): Promise<void> => {
    if (isInitialized.value) return;
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
      try {
        await load();
      } catch (error) {
        loadPromise = null; // Clear promise on error to allow retries
        logger.error`Failed to initialize history store: ${error}`;
        throw error;
      }
    })();

    return loadPromise;
  };

  const upsert = async (data: Partial<HistoryData>) => {
    await ensureInit();
    const id = data.id;
    const index = history.value.findIndex((item) => item.id === id);
    if (index !== -1) {
      const prev = history.value[index];
      const next = {
        ...toRaw(prev),
        ...data,
      };
      history.value[index] = next;
    } else {
      history.value.unshift(toRaw(data as HistoryData));
    }

    logger.debug`upsert history record \n {history: ${history.value}}`;
  };

  return {
    history: readonly(history),
    load,
    upsert,
  };
});
