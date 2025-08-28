<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAiConfigsStore } from '@/stores/aiConfigs';

const route = useRoute();
const router = useRouter();
const aiConfigsStore = useAiConfigsStore();
const { aiConfigs, configIds, lastActiveConfigId, firstConfigId } = storeToRefs(aiConfigsStore);

// Template ref for the scrollable container
const scrollContainer = ref<HTMLElement>();

const activeConfigId = computed(() => {
  return String(route.params.configId || lastActiveConfigId.value || firstConfigId.value);
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
  const newConfigId = `new-${Date.now()}`;
  await aiConfigsStore.upsert({
    id: newConfigId,
    name: `New Config ${aiConfigsStore.configIds.length + 1}`,
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
  (newConfigId) => {
    if (!newConfigId || !configIds.value.includes(String(newConfigId))) {
      const fallback = lastActiveConfigId.value || firstConfigId.value;
      if (fallback) {
        router.replace({ name: 'ai.config', params: { configId: fallback } });
      }
    }
    scrollToActiveConfig();
  },
  { immediate: true }
);

watch(
  () => activeConfigId.value,
  (id) => {
    aiConfigsStore.setLastActiveConfigId(id);
  },
  { immediate: true }
);
</script>

<template>
  <div class="flex gap-9 justify-center items-start">
    <div class="navbar basis-1/4 self-start flex flex-col items-start gap-2">
      <div>
        <button class="btn btn-soft btn-primary" @click="addNewConfig">+ New Config</button>
      </div>

      <div
        ref="scrollContainer"
        class="h-[68vh] pr-3 overflow-y-auto flex flex-col justify-start items-start gap-2"
      >
        <router-link
          v-for="configId in configIds"
          :key="configId"
          :data-config-id="configId"
          :to="{ name: 'ai.config', params: { configId } }"
          :class="['btn btn-soft text-sm w-36 focus:outline-0']"
          :title="aiConfigs[configId]?.name || String(configId)"
        >
          <p class="truncate">
            {{ aiConfigs[configId]?.name || configId }}
          </p>
        </router-link>
      </div>
    </div>
    <div class="flex-auto">
      <router-view v-slot="{ Component }">
        <keep-alive :max="10">
          <component :is="Component" :key="$route.params.configId" :config-id="activeConfigId" />
        </keep-alive>
      </router-view>
    </div>
  </div>
</template>

