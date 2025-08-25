<script setup lang="ts">
import { AIConfig } from '@/agent/types';
import { throttle } from 'es-toolkit';
import { createLogger } from '@/utils/logger';

const logger = createLogger('AiConfig');

const emit = defineEmits(['update']);

const props = defineProps({
  config: {
    type: Object as PropType<AIConfig>,
    required: true,
  },
});

const config = reactive<AIConfig>({ ...props.config });

const updateConfig = throttle((newConfig: AIConfig) => {
  emit('update', newConfig);
}, 1000);

watch(
  config,
  (newConfig) => {
    updateConfig(newConfig);
  },
  { deep: true }
);

onBeforeUnmount(() => {
  // Flush latest edits on navigation away
  emit('update', config);
});
</script>
<template>
  <div class="container mx-auto p-4">
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h1 class="card-title text-2xl font-bold mb-6">{{ config.provider }}</h1>

        <div class="space-y-4">
          <!-- Base URL -->
          <div class="form-control w-full">
            <label class="label" for="baseurl">
              <span class="label-text font-medium">Base URL</span>
            </label>
            <input
              type="url"
              id="baseurl"
              v-model="config.baseUrl"
              class="input input-bordered w-full"
              placeholder="https://api.example.com"
            />
          </div>

          <!-- API Key -->
          <div class="form-control w-full">
            <label class="label" for="apikey">
              <span class="label-text font-medium">API Key</span>
            </label>
            <input
              type="text"
              id="apikey"
              v-model="config.apiKey"
              class="input input-bordered w-full"
              placeholder="Enter your API key"
            />
          </div>

          <!-- Model -->
          <div class="form-control w-full">
            <label class="label" for="model">
              <span class="label-text font-medium">Model</span>
            </label>
            <input
              type="text"
              id="model"
              v-model="config.model"
              class="input input-bordered w-full"
              placeholder="e.g., gpt-4, gpt-3.5-turbo"
            />
          </div>

          <!-- Local Models -->
          <div class="form-control w-full">
            <label class="label" for="models">
              <div class="label-text font-medium">Models List</div>
            </label>
            <div v-for="model in config.localModels" :key="model">
              <div class="input input-bordered w-full">
                {{ model }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
