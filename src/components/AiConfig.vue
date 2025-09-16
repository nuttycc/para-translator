<script setup lang="ts">
import { Eye, EyeOff, Minus, Plus, RefreshCcw, Trash } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';

import type { AIConfig } from '@/agent/types';
import { useAiProviderStore } from '@/stores';
import { createLogger } from '@/utils/logger';
import { showToast } from '@/utils/toast';

interface ModelResponse {
  id: string;
  [key: string]: unknown;
}

const aiConfigsStore = useAiProviderStore();

const { firstConfigId, lastActiveConfigId, aiConfigs } = storeToRefs(aiConfigsStore);

const configId = computed(() => String(lastActiveConfigId.value || firstConfigId.value));

const config = computed<AIConfig>(() => aiConfigs.value[configId.value]);

const logger = createLogger('AiConfig');

const newLocalModel = ref('');
const remoteModels = ref<string[]>([]);

// Initialize remoteModels with existing data from config
const initializeRemoteModels = () => {
  remoteModels.value = config.value.remoteModels ?? [];
};

// Watch for config changes and initialize remote models
watch(config, initializeRemoteModels, { immediate: true });

const showRemoteModels = ref(config.value.isRemoteModel ?? false);
const showApiKey = ref(false);

const addLocalModel = () => {
  if (!config.value) return;
  logger.debug`Adding local model: localModels=${config.value.localModels}`;
  const newModel = newLocalModel.value.trim();
  if (!newModel) return;
  config.value.localModels.push(newModel);
  config.value.model = newModel;
  newLocalModel.value = '';
};

const deleteLocalModel = () => {
  if (!config.value) return;
  config.value.localModels = config.value.localModels.filter(
    (model) => model !== config.value.model
  );
  config.value.model = config.value.localModels.at(-1) ?? '';
};

const deleteConfig = () => {
  aiConfigsStore.remove(configId.value);
};

const fetchModes = async () => {
  if (!config.value?.baseUrl) {
    showToast({
      message: 'No base URL found',
      type: 'error',
    });
    return;
  }

  const endpoint = `${config.value.baseUrl}/models`;

  logger.debug`Fetching models from ${endpoint}`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${config.value.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const res = await response.json();

    if (!Array.isArray(res?.data)) {
      throw new Error('Invalid response format: "data" is not an array.');
    }

    const models = res.data.map((model: unknown) => {
      if (
        typeof model === 'object' &&
        model !== null &&
        'id' in model &&
        typeof (model as ModelResponse).id === 'string'
      ) {
        return (model as ModelResponse).id;
      }
      throw new Error('Invalid model format: missing or invalid id property');
    });

    remoteModels.value = models;

    // Persist remote models to the store
    if (config.value) {
      const updatedConfig = {
        ...config.value,
        remoteModels: models,
      };
      await aiConfigsStore.upsert(updatedConfig);
    }
  } catch (err) {
    logger.error`Failed to fetch models: ${err}`;
    showToast({
      message: `Error fetching models: ${err instanceof Error ? err.message : 'Unknown error'}`,
      type: 'error',
    });
    remoteModels.value = [];
  }
};

watch(showRemoteModels, (value) => {
  config.value.isRemoteModel = value;
});
</script>
<template>
  <div class="card card-lg px-16 shadow-xl">
    <div class="card-body flex flex-col">
      <h1 class="card-title mb-6 text-2xl font-bold">{{ config.name }}</h1>
      <div class="space-y-4">
        <!-- name -->
        <div class="form-control w-full">
          <label class="label" for="name">
            <span class="label-text font-medium">Config Name</span>
          </label>
          <input
            type="text"
            id="name"
            v-model="config.name"
            class="input input-bordered w-full"
            placeholder="Enter your name"
          />
        </div>
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

          <div class="flex gap-2">
            <input
              :type="showApiKey ? 'text' : 'password'"
              id="apikey"
              v-model="config.apiKey"
              class="input input-bordered w-full"
              placeholder="Enter your API key"
            />
            <button class="btn btn-soft btn-primary w-fit" @click="showApiKey = !showApiKey">
              <EyeOff v-if="!showApiKey" class="h-4 w-4" />
              <Eye v-else class="h-4 w-4" />
            </button>
          </div>
        </div>

        <!-- Models -->
        <div class="form-control w-full">
          <fieldset class="fieldset flex flex-col gap-2">
            <legend class="label label-text flex gap-2 font-medium">
              Model

              <fieldset class="fieldset bg-base-100 border-base-300 rounded-box flex gap-2">
                <label class="label">
                  <input type="checkbox" v-model="showRemoteModels" class="checkbox checkbox-xs" />
                  Show remote models list
                </label>
              </fieldset>
            </legend>

            <div v-if="!showRemoteModels" class="join join-vertical gap-2">
              <div class="join-item flex items-center-safe gap-2">
                <select class="select" v-model="config.model">
                  <option v-if="config.localModels.length === 0" disabled selected>
                    Please add a custom model first
                  </option>
                  <option v-for="model in config.localModels" :key="model">
                    {{ model }}
                  </option>
                </select>

                <div class="tooltip" data-tip="Remove the model from list">
                  <button class="btn btn-soft w-fit" @click="deleteLocalModel">
                    <Minus />
                  </button>
                </div>
              </div>

              <!-- Add local model -->
              <div class="join-item flex gap-2">
                <input
                  type="text"
                  placeholder="Input a model id"
                  class="input"
                  v-model="newLocalModel"
                />

                <div class="tooltip" data-tip="Add a model to local list">
                  <button class="btn btn-soft btn-primary w-fit" @click="addLocalModel">
                    <Plus />
                  </button>
                </div>
              </div>
            </div>

            <!-- Select remote model -->
            <div class="flex gap-2" v-if="showRemoteModels">
              <select class="select" v-model="config.model">
                <option v-if="remoteModels.length === 0" disabled selected>
                  Please fetch models first
                </option>
                <option v-for="model in remoteModels" :key="model">
                  {{ model }}
                </option>
              </select>

              <button type="button" class="btn btn-soft btn-primary w-fit" @click="fetchModes">
                <RefreshCcw class="h-4 w-4" />
              </button>
            </div>
          </fieldset>
        </div>
      </div>
      <div class="mt-4 flex justify-end">
        <button class="btn btn-soft btn-error w-fit" @click="deleteConfig">
          <div class="tooltip" data-tip="Delete the config">
            <Trash />
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
