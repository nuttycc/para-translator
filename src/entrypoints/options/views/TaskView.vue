<script setup lang="ts">
import { computed, watch } from 'vue';
import { useTaskConfigsStore } from '@/stores/taskConfigs';
import { createLogger } from '@/utils/logger';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { TaskType } from '@/agent/types';

const route = useRoute();
const router = useRouter();

const logger = createLogger('options');
const taskConfigsStore = useTaskConfigsStore();
const { taskIds, lastActiveTaskId, firstTaskId } = storeToRefs(taskConfigsStore);

const activeTaskId = computed(() => {
  return String(route.params.taskId || lastActiveTaskId.value || firstTaskId.value) as TaskType;
});

watch(
  () => route.params.taskId,
  (newTaskId) => {
    if (!newTaskId || !taskIds.value.includes(String(newTaskId))) {
      const fallback = lastActiveTaskId.value || firstTaskId.value;
      if (fallback) {
        router.replace({
          name: 'tasks.detail',
          params: { taskId: fallback },
        });
      }
    }
  },
  { immediate: true }
);

watch(
  () => activeTaskId.value,
  (id) => {
    taskConfigsStore.setLastActiveTaskId(id);
    router.replace({ name: 'tasks.detail', params: { taskId: id } });
  },
  { immediate: true }
);
</script>

<template>
  <div>
    <div class="navbar flex gap-2">
      <router-link
        v-for="tid in taskIds"
        :key="tid"
        :to="{ name: 'tasks.detail', params: { taskId: tid } }"
        :class="['btn btn-soft', { 'btn-active btn-accent': false }]"
      >
        {{ String(tid).charAt(0).toUpperCase() + String(tid).slice(1) }}
      </router-link>
    </div>

    <div class="mt-2">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" :key="activeTaskId" />
        </keep-alive>
      </router-view>
    </div>
  </div>
</template>
