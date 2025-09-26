<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAiProviderStore } from '@/stores';
import LayoutWithNav from '@/components/LayoutWithNav.vue';

const route = useRoute();
const router = useRouter();
const aiProviderStore = useAiProviderStore();

const { aiConfigs, configIds, lastActiveConfigId, firstConfigId } = storeToRefs(aiProviderStore);

// Template ref for the scrollable container
const scrollContainer = ref<HTMLElement>();

const activeConfigId = computed(() => {
  if (
    route.params.configId &&
    typeof route.params.configId === 'string' &&
    configIds.value.includes(route.params.configId)
  ) {
    return route.params.configId;
  }

  return lastActiveConfigId.value || firstConfigId.value;
});

// Function to scroll active config into view
const scrollToActiveConfig = async () => {
  if (!scrollContainer.value || !activeConfigId.value) return;

  await nextTick();

  // Find the active config element
  const activeElement = scrollContainer.value.querySelector(
    `[data-config-id="${activeConfigId.value}"]`
  ) as HTMLElement;

  if (activeElement) {
    // Scroll the element into view with smooth behavior
    activeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });

    // Programmatically focus the element for accessibility
    activeElement.focus({ preventScroll: true });
  }
};

const addNewConfig = async () => {
  const newConfigId = `x-${Date.now()}`;
  await aiProviderStore.upsert({
    id: newConfigId,
    name: `New Config ${aiProviderStore.configIds.length + 1}`,
    provider: 'new',
    model: 'new',
    localModels: [],
    apiKey: '',
    baseUrl: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  router.push({ name: 'ai.config', params: { configId: newConfigId } });
};

watch(
  () => route.params.configId,
  () => {
    scrollToActiveConfig();
  },
  { immediate: true }
);

watch(
  () => activeConfigId.value,
  (id) => {
    aiProviderStore.setLastActiveConfigId(id);
    router.replace({ name: 'ai.config', params: { configId: id } });
  },
  { immediate: true }
);
</script>

<template>
  <LayoutWithNav>
    <template #nav>
      <button class="btn btn-soft btn-primary w-36" @click="addNewConfig">+ New Config</button>

      <div class="divider my-0"></div>

      <div
        ref="scrollContainer"
        class="flex h-[68vh] flex-col items-start justify-start gap-2 overflow-y-auto"
      >
        <router-link
          v-for="configId in configIds"
          :key="configId"
          :data-config-id="configId"
          :to="{ name: 'ai.config', params: { configId } }"
          :class="['btn btn-soft text-sm focus:outline-0 w-36']"
          :title="aiConfigs[configId]?.name || String(configId)"
        >
          <p class="truncate">
            {{ aiConfigs[configId]?.name || configId }}
          </p>
        </router-link>
      </div>
    </template>

    <template #content>
      <router-view v-slot="{ Component }">
        <keep-alive :max="10">
          <component :is="Component" :key="$route.params.configId" :config-id="activeConfigId" />
        </keep-alive>
      </router-view>
    </template>
  </LayoutWithNav>
</template>
