import { storage } from '#imports';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const userSettingsStorage = storage.defineItem<UserSettings>(
  'local:userSettings',
  {
    defaultValue: {
      nativeLanguage: 'English',
      learningLanguage: 'Spanish',
      learningLanguageLevel: 'Beginner',
    },
  },
);

export interface UserSettings {
  nativeLanguage: string;
  learningLanguage: string;
  learningLanguageLevel: string;
}

export const useUserSettingsStore = defineStore('userSettings', () => {
  const settings = ref<UserSettings | null>(null);

  async function loadSettings() {
    settings.value = await userSettingsStorage.getValue();
  }

  async function updateSettings(newSettings: Partial<UserSettings>) {
    const updatedSettings = {
      ...settings.value,
      ...newSettings,
    };
    await userSettingsStorage.setValue(updatedSettings);
    settings.value = updatedSettings;
  }

  return {
    settings,
    loadSettings,
    updateSettings,
  };
});
