<script setup lang="ts">
import { onMounted } from '#imports';
import { useRouter } from 'vue-router';
import { agentStorage } from '@/agent/storage';

const router = useRouter();

onMounted(async () => {
  const configs = await agentStorage.aiConfigs.getValue();
  const firstId = Object.keys(configs || {}).at(0);
  if (firstId) {
    router.replace({ name: 'ai.config', params: { configId: firstId } });
  }
});
</script>

<template>
  <div class="h-full w-full flex items-center justify-center text-base-content/60">
    No AI configs. Create one to get started.
  </div>
</template>


