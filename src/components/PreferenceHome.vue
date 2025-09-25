<script setup lang="ts">
import { usePreferenceStore } from '@/stores/preference';
import { storeToRefs } from 'pinia';

const preferenceStore = usePreferenceStore();

const { preferences } = storeToRefs(preferenceStore);

</script>
<template>
  <div>
    <h1>Preference</h1>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">Target Language</legend>
      <select class="select" v-model="preferences.targetLanguage">
        <option value="English">English</option>
        <option value="Chinese">Chinese</option>
        <option value="Japanese">Japanese</option>
      </select>
    </fieldset>
  </div>
</template>
