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
  return String(
    route.params.configId || lastActiveConfigId.value || firstConfigId.value
  );
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
  <div class="flex h-[600px] justify-start items-start gap-4">
    <div class="navbar w-60 min-w-56 flex flex-col gap-2">
      <div
        ref="scrollContainer"
        class="w-full px-2 mt-6 h-[460px] overflow-y-auto flex flex-col gap-2"
      >
        <router-link
          v-for="configId in configIds"
          :key="configId"
          :data-config-id="configId"
          :to="{ name: 'ai.config', params: { configId } }"
          :class="[
            'btn btn-soft text-sm w-48 justify-start truncate',
            { 'btn-active btn-accent': false },
          ]"
          :title="aiConfigs[configId]?.name || String(configId)"
        >
          {{ aiConfigs[configId]?.name || configId }}
        </router-link>
      </div>
      <button class="btn btn-soft btn-primary w-full" @click="addNewConfig">+ New</button>
    </div>
    <div class="flex-1 min-w-0 h-[560px] overflow-auto">
      <router-view v-slot="{ Component }">
        <keep-alive :max="5">
          <component :is="Component" :key="$route.params.configId" :config-id="activeConfigId" />
        </keep-alive>
      </router-view>
    </div>
  </div>
</template>

<style scoped>
* {
  scrollbar-width: none;
}
</style>
