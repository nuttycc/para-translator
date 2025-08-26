<script setup lang="ts">
import { ref, computed, onMounted } from '#imports';
import { useRoute } from 'vue-router';
import { agentStorage } from '@/agent/storage';
import type { TaskRuntimeConfig, TaskRuntimeConfigs } from '@/agent/types';
import TaskConfig from '@/components/TaskConfig.vue';

const route = useRoute();
const taskId = computed(() => String(route.params.taskId || ''));

const taskRuntimeConfigs = ref<TaskRuntimeConfigs | null>(null);
const currentTask = computed<TaskRuntimeConfig | null>(() => {
  const id = taskId.value;
  const configs = taskRuntimeConfigs.value || {};
  // @ts-expect-error index signature of TaskRuntimeConfigs
  return configs[id] || null;
});

onMounted(async () => {
  taskRuntimeConfigs.value = await agentStorage.taskConfigs.getValue();
});
</script>

<template>
  <div>
    <div v-if="currentTask">
      <TaskConfig :config="currentTask" :task-type="taskId" />
    </div>
    <div v-else class="h-full flex items-center justify-center text-base-content/60">
      No task selected.
    </div>
  </div>
</template>


