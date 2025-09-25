<script setup lang="ts">
import { usePreferredLanguages } from '@vueuse/core';
import { storeToRefs } from 'pinia';

import { usePreferenceStore } from '@/stores/preference';

const brLanguages = usePreferredLanguages();
const preferenceStore = usePreferenceStore();
const { preferences } = storeToRefs(preferenceStore);

const languageOptions = { 'zh-CN': 'Chinese(Simplified)', en: 'English', ja: 'Japanese' };
</script>
<template>
  <div>
    <h1>Preference</h1>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">Target Language</legend>
      <select class="select" v-model="preferences.targetLanguage">
        <option v-for="(v, k) in languageOptions" :value="v" :data-code="k">
          {{ v }}
        </option>
      </select>
    </fieldset>
  </div>
</template>
