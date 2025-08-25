<script setup lang="ts">
import { agentStorage } from '@/agent/storage';
import type { AIConfig, AIConfigs, TaskRuntimeConfigs } from '@/agent/types';
import AiConfig from '@/components/AiConfig.vue';
import TaskConfig from '@/components/TaskConfig.vue';
import { createLogger } from '@/utils/logger';

const logger = createLogger('options');

const aiConfigs = ref<AIConfigs>({});
const taskRuntimeConfigs = ref<TaskRuntimeConfigs | null>(null);

onMounted(async () => {
  const configs = await agentStorage.aiConfigs.getValue();
  const taskConfigs = await agentStorage.taskConfigs.getValue();
  logger.debug`AI Configs: ${configs}`;
  logger.debug`Task Configs: ${taskConfigs}`;

  aiConfigs.value = configs;
  taskRuntimeConfigs.value = taskConfigs;
});

const updateConfig = (config: AIConfig) => {
  aiConfigs.value[config.id] = config;
  agentStorage.aiConfigs
    .setValue(aiConfigs.value)
    .catch((err) => {
      logger.error`Failed to update AI Configs: ${err}`;
    })
    .finally(() => {
      logger.debug`Updated AI Configs: ${aiConfigs.value}`;
    });
};
</script>

<template>
  <div class="max-w-2xl mx-auto p-4 mb-16">
    <h1 class="text-2xl font-bold mb-6">Options</h1>

    <AiConfig
      v-for="config in aiConfigs"
      :key="config.id"
      :config="config"
      @update="updateConfig"
    />
    <div class="divider">NEXT</div>
    <TaskConfig v-for="config in taskRuntimeConfigs" :key="config.aiConfigId" :config="config" />
  </div>
</template>
