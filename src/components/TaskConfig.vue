<script setup lang="ts">
import { computed } from 'vue';

import PromptEditor from '@/components/PromptEditor.vue';
import { useAiProviderStore, useTaskSettingsStore } from '@/stores';
import { createLogger } from '@/utils/logger';

import type { TaskRuntimeConfig } from '@/agent/types';

const logger = createLogger('TaskConfig');
const taskConfigsStore = useTaskSettingsStore();
const aiConfigsStore = useAiProviderStore();

const { taskRuntimeConfigs } = taskConfigsStore;
const { aiConfigs } = aiConfigsStore;

const activeTaskId = computed(() => taskConfigsStore.lastActiveTaskId);

const runtimeConfig = computed<TaskRuntimeConfig>(() => taskRuntimeConfigs[activeTaskId.value]);
</script>

<template>
  <div class="card shadow-xl">
    <fieldset class="fieldset card-body space-y-4">
      <legend class="fieldset-legend text-lg font-semibold">
        {{ activeTaskId.charAt(0).toUpperCase() + activeTaskId.slice(1) }} Task
      </legend>

      <div class="join join-horizontal justify-between">
        <label class="label join-item" for="aiConfigId">
          <span class="label-text font-semibold">Select AI Config</span>
        </label>
        <select class="select join-item" id="aiConfigId" v-model="runtimeConfig.aiConfigId">
          <option disabled selected>Pick an AI Config</option>
          <option v-for="config in aiConfigs" :key="config.id" :value="config.id">
            {{ config.name }}
          </option>
        </select>
      </div>

      <PromptEditor :taskType="activeTaskId" />

      <label class="label" for="temperature">
        <span class="label-text font-semibold">Temperature</span>
        <span class="label-text-alt text-base-content/70">{{
          runtimeConfig.temperature || 0
        }}</span>
      </label>

      <input
        id="temperature"
        type="range"
        min="0"
        max="2"
        step="0.1"
        v-model.number="runtimeConfig.temperature"
        class="range range-primary w-full"
      />
      <div class="text-base-content/60 mt-1 flex justify-between px-1 text-xs">
        <span>0</span>
        <span>1</span>
        <span>2</span>
      </div>
    </fieldset>
  </div>
</template>
