<script setup lang="ts">
import { useUserSettingsStore } from '@/stores/userSettings';
import { onMounted, ref } from 'vue';

const userSettingsStore = useUserSettingsStore();
const { settings, loadSettings, updateSettings } = userSettingsStore;

const nativeLanguage = ref('');
const learningLanguage = ref('');
const learningLanguageLevel = ref('');

onMounted(async () => {
  await loadSettings();
  if (settings) {
    nativeLanguage.value = settings.nativeLanguage;
    learningLanguage.value = settings.learningLanguage;
    learningLanguageLevel.value = settings.learningLanguageLevel;
  }
});

const saveSettings = async () => {
  await updateSettings({
    nativeLanguage: nativeLanguage.value,
    learningLanguage: learningLanguage.value,
    learningLanguageLevel: learningLanguageLevel.value,
  });
};
</script>

<template>
  <div class="p-4">
    <h2 class="text-2xl font-bold mb-4">User Settings</h2>
    <div v-if="settings" class="space-y-4">
      <div>
        <label for="nativeLanguage" class="block text-sm font-medium text-gray-700">Native Language</label>
        <input
          id="nativeLanguage"
          v-model="nativeLanguage"
          type="text"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label for="learningLanguage" class="block text-sm font-medium text-gray-700">Learning Language</label>
        <input
          id="learningLanguage"
          v-model="learningLanguage"
          type="text"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label for="learningLanguageLevel" class="block text-sm font-medium text-gray-700">Learning Language Level</label>
        <input
          id="learningLanguageLevel"
          v-model="learningLanguageLevel"
          type="text"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <button class="btn btn-primary" @click="saveSettings">Save</button>
    </div>
    <div v-else>
      <p>Loading...</p>
    </div>
  </div>
</template>
