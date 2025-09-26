<script setup lang="ts">
import LayoutWithNav from '@/components/LayoutWithNav.vue';
import { usePreferenceStore } from '@/stores/preference';

const preferenceStore = usePreferenceStore();

preferenceStore.init();
</script>

<template>
  <LayoutWithNav>
    <template #nav>
      <nav role="tablist" class="tabs *:tab flex-col gap-2">
        <RouterLink :to="{ name: 'preference.home' }" role="tab" class="btn btn-soft"
          >Home</RouterLink
        >
        <RouterLink :to="{ name: 'preference.custom-css' }" role="tab" class="btn btn-soft"
          >Custom CSS</RouterLink
        >
      </nav>
    </template>

    <template #content>
      <RouterView />
    </template>
  </LayoutWithNav>
</template>
