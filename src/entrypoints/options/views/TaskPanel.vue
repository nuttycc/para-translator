<script setup lang="ts">
import { computed } from '#imports';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import type { TaskRuntimeConfig, TaskType } from '@/agent/types';
import { TASK_TYPES } from '@/agent/types';
import TaskConfig from '@/components/TaskConfig.vue';
import { useTaskConfigsStore } from '@/stores/taskConfigs';

const route = useRoute();
const taskId = computed(() => String(route.params.taskId || ''));

const taskConfigsStore = useTaskConfigsStore();
const { taskRuntimeConfigs } = storeToRefs(taskConfigsStore);

const currentTask = computed<TaskRuntimeConfig | null>(() => {
  const id = taskId.value;
  const configs = taskRuntimeConfigs.value || {};
  // @ts-expect-error index signature of TaskRuntimeConfigs
  return configs[id] || null;
});

// Store is already initialized globally in App.vue

const handleUpdate = async (updated: TaskRuntimeConfig) => {
  const id = taskId.value as TaskType;
  if (!TASK_TYPES.includes(id)) return;
  await taskConfigsStore.updateOne(id, updated);
};
</script>

<template>
  <div>
    <div v-if="currentTask">
      <TaskConfig :config="currentTask" :task-type="taskId" @update="handleUpdate" />
    </div>
    <div v-else class="h-full flex items-center justify-center text-base-content/60">
      No task selected.
    </div>
  </div>
</template>


