<script setup lang="ts">
import { onMounted, ref, computed } from '#imports';
import { agentStorage } from '@/agent/storage';
import type { TaskRuntimeConfigs } from '@/agent/types';
import { createLogger } from '@/utils/logger';
import { useRoute } from 'vue-router';


const route = useRoute();

const logger = createLogger('options');

const taskRuntimeConfigs = ref<TaskRuntimeConfigs | null>(null);
const taskIds = computed(() => Object.keys(taskRuntimeConfigs.value || {}));
const activeTaskId = computed(() => String(route.params.taskId || ''));

onMounted(async () => {
  try {
    const taskConfigs = await agentStorage.taskConfigs.getValue();
    logger.debug`Task Configs: ${taskConfigs}`;
    taskRuntimeConfigs.value = taskConfigs;
  } catch (err) {
    logger.error`Failed to load task configs: ${err}`;
    taskRuntimeConfigs.value = null;
  }
});

</script>

<template>
  <div>
    <div class="navbar flex gap-2 justify-end-safe">
      <router-link
        v-for="tid in taskIds"
        :key="tid"
        :to="{ name: 'tasks.detail', params: { taskId: tid } }"
        :class="['btn btn-soft', { 'btn-active btn-accent': activeTaskId === String(tid) }]"
      >
        {{ String(tid).charAt(0).toUpperCase() + String(tid).slice(1) }}
      </router-link>
    </div>

    <div class="flex-1 min-w-0 mt-4">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </transition>
      </router-view>
    </div>
  </div>
</template>

