<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAiConfigsStore } from '@/stores/aiConfigs';

const router = useRouter();
const aiConfigsStore = useAiConfigsStore();
const isLoading = ref(true);

// Watch for store initialization and navigate to first config
watch(
  () => aiConfigsStore.hasConfigs,
  (hasConfigs) => {
    isLoading.value = false;
    if (hasConfigs) {
      const firstId = aiConfigsStore.firstConfigId;
      if (firstId) {
        router.replace({ name: 'ai.config', params: { configId: firstId } });
      }
    }
  },
  { immediate: true }
);
</script>

<template>
  <div v-if="isLoading" class="h-full w-full flex items-center justify-center">
    <div class="loading loading-spinner loading-lg"></div>
  </div>
  <div v-else-if="!aiConfigsStore.hasConfigs" class="h-full w-full flex items-center justify-center text-base-content/60">
    No AI configs. Create one to get started.
  </div>
  <div v-else class="h-full w-full flex items-center justify-center text-base-content/60">
    <!-- This should not be visible as we navigate away when configs exist -->
    Redirecting to first AI config...
  </div>
</template>


