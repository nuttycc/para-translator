import { storage } from '#imports';
import { watchDebounced } from '@vueuse/core';
import { defineStore } from 'pinia';
import { ref } from 'vue';

// default css string
import defaultParaCardCSS from '@/assets/ParaCard.css?raw';
import { createLogger } from '@/utils/logger';

const logger = createLogger('store', 'appearance');

export const appearanceStorage = storage.defineItem<{
  paraCardCSS: string;
  theme: string;
}>('local:appearance', {
  init: () => ({
    paraCardCSS: defaultParaCardCSS,
    theme: 'default',
  }),
  version: 1,
});

export const useAppearanceStore = defineStore('ui-appearance', () => {
  const paraCardCSS = ref(defaultParaCardCSS);
  const theme = ref('default');

  async function init() {
    paraCardCSS.value = (await appearanceStorage.getValue())?.paraCardCSS ?? defaultParaCardCSS;

    watchDebounced(
      paraCardCSS,
      async () => {
        logger.debug`Updating para card CSS: ${paraCardCSS.value}`;

        await appearanceStorage.setValue({ paraCardCSS: paraCardCSS.value, theme: theme.value });

        logger.debug`CSS updated`;
      },
      { debounce: 500 }
    );
  }

  return {
    paraCardCSS,
    init,
  };
});
