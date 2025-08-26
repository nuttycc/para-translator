<script setup lang="ts">
import { agentStorage } from '@/agent/storage';
import { AIConfig, AIConfigs, TaskRuntimeConfigs } from '@/agent/types';
import AiConfig from '@/components/AiConfig.vue';
import { createLogger } from '@/utils/logger';
import { debounce } from 'es-toolkit';
import { computed, isProxy, nextTick, onMounted, onUnmounted, ref, shallowRef, toRaw } from 'vue';

const logger = createLogger('options');

const aiConfigs = shallowRef<AIConfigs>({});
const taskRuntimeConfigs = shallowRef<TaskRuntimeConfigs | null>(null);
const activeRoute = ref<string>('');
const deletingConfigs = ref<Record<string, boolean>>({});

const configIds = computed(() => Object.keys(aiConfigs.value));

const updateActiveRoute = () => {
  const hash = window.location.hash.replace('#', '');
  if (hash && configIds.value.includes(hash)) {
    activeRoute.value = hash;
  } else if (configIds.value.length > 0) {
    // Default to first config
    activeRoute.value = configIds.value[0];
    window.location.hash = configIds.value[0];
  } else {
    activeRoute.value = '';
  }
};

const addNewConfig = () => {
  const newConfig = {
    id: `new-${Date.now()}`,
    name: 'New Config',
    provider: 'new',
    model: 'new',
    localModels: [],
    apiKey: '',
    baseUrl: '',
    createdAt: 0,
    updatedAt: 0,
  };
  aiConfigs.value[newConfig.id] = newConfig;
  agentStorage.aiConfigs.setValue(aiConfigs.value).catch((err) => {
    logger.error`Failed to update AI Configs: ${err}`;
  });
};

const updateConfig = debounce((config: AIConfig) => {
  if (isProxy(config)) {
    config = toRaw(config);
    logger.info`Config is a proxy, converted to raw`;
  }
  if (isProxy(config.localModels)) {
    logger.error`Config.localModels is a proxy, skipping update`;
    return;
  }
  aiConfigs.value[config.id] = config;
  agentStorage.aiConfigs
    .setValue(aiConfigs.value)
    .catch((err) => {
      logger.error`Failed to update AI Configs: ${err}`;
    })
    .finally(() => {
      logger.debug`Updated AI Configs: ${aiConfigs.value}`;
    });
}, 500);

const deleteConfig = async (configId: string) => {
  const confirmed = window.confirm(`Are you sure you want to delete config ${configId}?`);
  if (!confirmed) {
    return;
  }

  // Keep original configs for recovery
  const originalConfigs = { ...aiConfigs.value };
  // const deletedConfig = aiConfigs.value[configId];

  // 1. Mark config as being deleted
  deletingConfigs.value[configId] = true;

  try {
    // 2. Wait for component to unmount
    await nextTick();

    // 3. Execute delete operation
    delete aiConfigs.value[configId];
    await agentStorage.aiConfigs.setValue(aiConfigs.value);

    logger.debug`Successfully deleted AI Config: ${configId}`;

    // 4. Update route
    updateActiveRoute();
  } catch (err) {
    // Restore original configs and delete mark
    aiConfigs.value = originalConfigs;
    delete deletingConfigs.value[configId];
    logger.error`Failed to delete AI Config ${configId}: ${err}`;
    alert(`Failed to delete config: ${err}`);
  } finally {
    // Clean up delete mark
    delete deletingConfigs.value[configId];
  }
};

onMounted(async () => {
  const configs = await agentStorage.aiConfigs.getValue();
  const taskConfigs = await agentStorage.taskConfigs.getValue();
  logger.debug`Configs: ${configs} ${taskConfigs}`;

  aiConfigs.value = configs;
  taskRuntimeConfigs.value = taskConfigs;

  // Initialize route after configs are loaded
  updateActiveRoute();

  // Listen for hash changes
  window.addEventListener('hashchange', updateActiveRoute);
});

onUnmounted(() => {
  window.removeEventListener('hashchange', updateActiveRoute);
});
</script>

<template>
  <div class="flex h-[600px] justify-start items-start">
    <div class="navbar w-fit flex flex-col gap-2">
      <div class="w-max px-2 mt-6 h-[460px] overflow-y-auto flex flex-col gap-2">
        <a
          v-for="configId in configIds"
          :key="configId"
          :href="`#${configId}`"
          :class="[
            'btn',
            'btn-soft',
            'text-sm',
            { 'btn-active btn-accent': activeRoute === configId },
          ]"
        >
          {{ aiConfigs[configId]?.name || configId }}
        </a>
      </div>
      <button class="btn btn-soft btn-primary" @click="addNewConfig">+ New</button>
    </div>

    <div class="route-container w-full">
      <div class="route-content">
        <div
          v-for="config in aiConfigs"
          :key="config.id"
          :class="['ai-route', { active: activeRoute === config.id }]"
        >
          <AiConfig
            v-if="!deletingConfigs[config.id]"
            :config="config"
            @update="updateConfig"
            @delete="deleteConfig"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
* {
  scrollbar-width: none;
}

.route-container {
  position: relative;
  min-height: 500px;
}

.route-content {
  position: relative;
}

.ai-route {
  display: none;
  opacity: 0;
  transform: translateX(20px);
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
  /* position: absolute; */
  top: 0;
  left: 0;
  width: 100%;
}

.ai-route.active {
  display: block;
  opacity: 1;
  transform: translateX(0);
}

.navbar .btn {
  transition: all 0.2s ease;
  min-width: 120px;
}

/* Handle empty state */
.route-container:empty::before {
  content: 'No AI configurations found. Please add a configuration first.';
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: hsl(var(--bc) / 0.6);
  font-style: italic;
}
</style>
