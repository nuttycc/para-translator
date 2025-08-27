<script setup lang="ts">
import { onMounted } from '#imports';
import { useRouter } from 'vue-router';
import { useAiConfigsStore } from '@/stores/aiConfigs';

const router = useRouter();
const aiConfigsStore = useAiConfigsStore();

onMounted(async () => {
  try {
    // Store is already initialized globally, just navigate to first config
    const firstId = aiConfigsStore.firstConfigId;
    if (firstId) {
      router.replace({ name: 'ai.config', params: { configId: firstId } });
    }
  } catch (err) {
    console.error('Failed to navigate to first AI config:', err);
    // Optionally show an error toast to the user
  }
});
</script>

<template>
  <div class="h-full w-full flex items-center justify-center text-base-content/60">
    No AI configs. Create one to get started.
  </div>
</template>


