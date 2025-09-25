<script setup lang="ts">
import { usePreferenceStore } from '@/stores/preference';

const preferenceStore = usePreferenceStore();

preferenceStore.init();
</script>

<template>
  <div class="flex min-h-[66dvh]">
    <nav role="tablist" class="tabs *:tab flex-col gap-2">
      <RouterLink :to="{ name: 'preference.home' }" role="tab" class="btn btn-soft"
        >Home</RouterLink
      >
      <RouterLink :to="{ name: 'preference.custom-css' }" role="tab" class="btn btn-soft"
        >Custom CSS</RouterLink
      >
    </nav>

    <div class="divider divider-horizontal"></div>

    <RouterView />
  </div>
</template>
