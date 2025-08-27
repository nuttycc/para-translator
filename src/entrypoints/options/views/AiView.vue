<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAiConfigs } from '@/composables/useAiConfigs';

const route = useRoute();
const router = useRouter();
const { aiConfigs, load, upsert } = useAiConfigs();

const configIds = computed(() => Object.keys(aiConfigs.value));
const activeConfigId = computed(() => String(route.params.configId || ''));

const addNewConfig = async () => {
  const newConfigId = `new-${Date.now()}`;
  await upsert({
    id: newConfigId,
    name: 'New Config',
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

load();
</script>

<template>
  <div class="flex h-[600px] justify-start items-start gap-4">
    <div class="navbar w-60 min-w-56 flex flex-col gap-2">
      <div class="w-full px-2 mt-6 h-[460px]  overflow-y-auto flex flex-col gap-2">
        <router-link
          v-for="configId in configIds"
          :key="configId"
          :to="{ name: 'ai.config', params: { configId } }"
          :class="[
            'btn btn-soft text-sm w-48 justify-start truncate',
            { 'btn-active btn-accent': activeConfigId === String(configId) },
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
        <transition name="fade" mode="out-in">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </transition>
      </router-view>
    </div>
  </div>
</template>

<style scoped>
* {
  scrollbar-width: none;
}
</style>
