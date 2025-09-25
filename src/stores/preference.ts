import { storage } from '#imports';
import { watchDebounced } from '@vueuse/core';
import { defineStore } from 'pinia';
import { ref } from 'vue';

// default css string
import defaultParaCardCSS from '@/assets/ParaCard.css?raw';
import { createLogger } from '@/utils/logger';

const logger = createLogger('store', 'preference');

export interface Preference {
  paraCardCSS: string;
  targetLanguage: string;
}

export const preferenceStorage = storage.defineItem<{
  paraCardCSS: string;
  targetLanguage: string;
}>('local:preference', {
  init: () => ({
    paraCardCSS: defaultParaCardCSS,
    targetLanguage: 'English',
  }),
  version: 1,
});

export const usePreferenceStore = defineStore('ui-preference', () => {
  const preferences = ref<Preference>({
    paraCardCSS: defaultParaCardCSS,
    targetLanguage: 'English',
  });

  async function init() {
    const storedPreferences = await preferenceStorage.getValue();

    if (storedPreferences) {
      preferences.value = storedPreferences;
    }

    watchDebounced(
      preferences,
      async () => {
        logger.debug`Updating preferences: ${preferences.value}`;

        await preferenceStorage.setValue(preferences.value);

        logger.debug`Preferences updated`;
      },
      { deep: true, debounce: 500, maxWait: 5000 }
    );
  }

  return {
    preferences,
    init,
  };
});
