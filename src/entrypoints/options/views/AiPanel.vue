<script setup lang="ts">
import { computed, toRaw } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { AIConfig } from '@/agent/types';
import AiConfig from '@/components/AiConfig.vue';
import { useAiConfigs } from '@/composables/useAiConfigs';

const route = useRoute();
const router = useRouter();
const configId = computed(() => String(route.params.configId || ''));

const { aiConfigs, load, upsert, remove } = useAiConfigs();
const currentConfig = computed<AIConfig | null>(() => {
  const cfg = aiConfigs.value[configId.value];
  return cfg ? (toRaw(cfg) as AIConfig) : null;
});

const handleUpdate = async (config: AIConfig) => {
  await upsert(config);
};

const handleDelete = async (id: string) => {
  await remove(id);
  const nextId = Object.keys(aiConfigs.value || {}).at(0);
  if (nextId) {
    router.replace({ name: 'ai.config', params: { configId: nextId } });
  } else {
    router.replace({ name: 'ai.home' });
  }
};

load();
</script>

<template>
  <div class="h-full">
    <div v-if="currentConfig">
      <AiConfig :config="currentConfig" @update="handleUpdate" @delete="handleDelete" />
    </div>
    <div v-else class="h-full flex items-center justify-center text-base-content/60">
      No AI config selected.
    </div>
  </div>
</template>


