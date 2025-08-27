<script setup lang="ts">
import type { TaskType } from '@/agent/types';
import TaskConfig from '@/components/TaskConfig.vue';

const props = defineProps<{
  taskId: TaskType;
}>();
</script>

<template>
  <div>
    <div>
      <TaskConfig :task-type="taskId" :key="taskId" />
    </div>
  </div>
</template>
