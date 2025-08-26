<script setup lang="ts">
import { onMounted, onUnmounted, ref } from '#imports';
import { agentStorage } from '@/agent/storage';
import type { AIConfigs, TaskRuntimeConfigs } from '@/agent/types';
import TaskConfig from '@/components/TaskConfig.vue';
import { createLogger } from '@/utils/logger';

const logger = createLogger('options');

const aiConfigs = ref<AIConfigs>({});
const taskRuntimeConfigs = ref<TaskRuntimeConfigs | null>(null);
const activeRoute = ref<string>('translate');

const routes = ['translate', 'explain'];

const updateActiveRoute = () => {
  const hash = window.location.hash.replace('#', '');
  if (routes.includes(hash)) {
    activeRoute.value = hash;
  } else {
    // Default route
    activeRoute.value = 'translate';
    window.location.hash = 'translate';
  }
};

onMounted(async () => {
  const configs = await agentStorage.aiConfigs.getValue();
  const taskConfigs = await agentStorage.taskConfigs.getValue();
  logger.debug`AI Configs: ${configs}`;
  logger.debug`Task Configs: ${taskConfigs}`;

  aiConfigs.value = configs;
  taskRuntimeConfigs.value = taskConfigs;

  // Initialize route
  updateActiveRoute();

  // Listen for hash changes
  window.addEventListener('hashchange', updateActiveRoute);
});

onUnmounted(() => {
  window.removeEventListener('hashchange', updateActiveRoute);
});
</script>

<template>
  <div>
    <div class="navbar flex gap-2 justify-end-safe">
      <a
        href="#translate"
        :class="['btn', 'btn-soft', { 'btn-active btn-accent': activeRoute === 'translate' }]"
      >
        Translate
      </a>
      <a
        href="#explain"
        :class="['btn', 'btn-soft', { 'btn-active btn-accent': activeRoute === 'explain' }]"
      >
        Explain
      </a>
    </div>

    <div class="route-container">
      <div v-if="taskRuntimeConfigs" class="route-content">
        <div
          v-for="(config, key) in taskRuntimeConfigs"
          :key="key"
          :class="['task-route', { 'active': activeRoute === key }]"
        >
          <TaskConfig :config="config" :task-type="key" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.route-container {
  position: relative;
  min-height: 400px;
}

.route-content {
  position: relative;
}

.task-route {
  display: none;
  opacity: 0;
  transform: translateX(20px);
  transition: opacity 0.3s ease, transform 0.3s ease;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}

.task-route.active {
  display: block;
  opacity: 1;
  transform: translateX(0);
}

</style>
