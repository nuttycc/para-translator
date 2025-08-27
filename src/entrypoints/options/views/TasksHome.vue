<script setup lang="ts">
import { onMounted } from '#imports';
import { useRouter } from 'vue-router';
import { useTaskConfigsStore } from '@/stores/taskConfigs';

const router = useRouter();
const taskConfigsStore = useTaskConfigsStore();

onMounted(async () => {
  try {
    // Store is already initialized globally, just navigate to first task
    const firstTask = taskConfigsStore.firstTaskId;
    router.replace({ name: 'tasks.detail', params: { taskId: firstTask } });
  } catch (err) {
    console.error('Failed to navigate to first task:', err);
    // Optionally show an error toast to the user
  }
});
</script>

<template>
  <div class="h-full w-full flex items-center justify-center text-base-content/60">
    No task selected.
  </div>
</template>


