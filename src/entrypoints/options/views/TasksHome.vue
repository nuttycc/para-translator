<script setup lang="ts">
import { onMounted } from '#imports';
import { useRouter } from 'vue-router';
import { agentStorage } from '@/agent/storage';

const router = useRouter();

onMounted(async () => {
  try {
    const taskConfigs = await agentStorage.taskConfigs.getValue();
    const firstTask = Object.keys(taskConfigs || {}).at(0) || 'translate';
    router.replace({ name: 'tasks.detail', params: { taskId: firstTask } });
  } catch (err) {
    console.error('Failed to load task configs:', err);
    // Optionally show an error toast to the user
  }
});
</script>

<template>
  <div class="h-full w-full flex items-center justify-center text-base-content/60">
    No task selected.
  </div>
</template>


