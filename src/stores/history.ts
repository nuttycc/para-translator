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

  const ensureInit = async () => {
    if (isInitialized.value) return;
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
      await load();
    })();
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
      history.value.push(toRaw(data as HistoryData));
    }

    logger.debug`upsert history record \n {history: ${history.value}}`;
  };

  return {
    history: readonly(history),
    load,
    upsert,
  };
});
