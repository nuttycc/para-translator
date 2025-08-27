<script setup lang="ts">
import { computed, toRaw } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import type { AIConfig } from '@/agent/types';
import AiConfig from '@/components/AiConfig.vue';
import { useAiConfigsStore } from '@/stores/aiConfigs';
import { createLogger } from '@/utils/logger';

const route = useRoute();
const router = useRouter();
const logger = createLogger('AiPanel');

const aiConfigsStore = useAiConfigsStore();
const { aiConfigs } = storeToRefs(aiConfigsStore);

const props = defineProps<{
  configId?: string;
}>();

const configId = computed(() => String(props.configId || aiConfigsStore.firstConfigId));

const currentConfig = computed<AIConfig | null>(() => {
  const cfg = aiConfigs.value[configId.value];
  return cfg ? (toRaw(cfg) as AIConfig) : null;
});


logger.debug`Current config: ${configId.value}`;

const handleUpdate = async (config: AIConfig) => {
  await aiConfigsStore.upsert(config);
};

const handleDelete = async (id: string) => {
  await aiConfigsStore.remove(id);
  const nextId = Object.keys(aiConfigs.value || {}).at(-1);
  if (nextId) {
    router.replace({ name: 'ai.config', params: { configId: nextId } });
  } else {
    router.replace({ name: 'ai' });
  }
};

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


