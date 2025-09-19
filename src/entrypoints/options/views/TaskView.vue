<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { DISABLED_EXPLANATION } from '@/constant';
import { useTaskSettingsStore } from '@/stores';
import { createLogger } from '@/utils/logger';

import type { TaskType } from '@/agent/types';

const route = useRoute();
const router = useRouter();

const logger = createLogger('options');
const taskSettingsStore = useTaskSettingsStore();
const { taskIds, lastActiveTaskId, firstTaskId } = storeToRefs(taskSettingsStore);

const activeTaskId = computed(() => {
  if (route.params.taskId && typeof route.params.taskId === 'string') {
    return route.params.taskId as TaskType;
  }

  return lastActiveTaskId.value || (firstTaskId.value as TaskType);
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
    if (!id || !taskIds.value.includes(id)) {
      return;
    }
    taskSettingsStore.setLastActiveTaskId(id);

    router.replace({ name: 'tasks.detail', params: { taskId: id } });
  },
  { immediate: true }
);
</script>

<template>
  <div>
    <div class="navbar flex gap-2">
      <router-link
        v-for="tid in taskIds.sort().filter((tid) => {
          if (DISABLED_EXPLANATION && tid === 'explain') {
            return false;
          }
          return true;
        })"
        :key="tid"
        :to="{ name: 'tasks.detail', params: { taskId: tid } }"
        :class="['btn btn-soft']"
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
