<script setup lang="ts">
import type { TaskRuntimeConfig, TaskType } from '@/agent/types';
import { useTaskConfigsStore } from '@/stores/taskConfigs';
import { useAiConfigsStore } from '@/stores/aiConfigs';
import { computed, ref, toRaw, watch } from 'vue';
import { createLogger } from '@/utils/logger';
import { useDebounceFn } from '@vueuse/core';

const logger = createLogger('TaskConfig');
const taskConfigsStore = useTaskConfigsStore();
const aiConfigsStore = useAiConfigsStore();

const taskRuntimeConfigs = taskConfigsStore.taskRuntimeConfigs;
const aiConfigs = aiConfigsStore.aiConfigs;

const activeTaskId = computed(() => {
  return taskConfigsStore.lastActiveTaskId;
});

const runtimeConfig = computed<TaskRuntimeConfig>(() => {
  return taskRuntimeConfigs[activeTaskId.value];
});
</script>

<template>
  <div class="card shadow-xl">
    <div class="card-body">
      <h2 class="card-title text-2xl mb-6">
        {{ activeTaskId.charAt(0).toUpperCase() + activeTaskId.slice(1) }} Task
      </h2>

      <div class="space-y-4" v-if="runtimeConfig">
        <div class="form-control flex flex-col gap-2">
          <label class="label">
            <span class="label-text font-semibold">Select AI Config</span>
          </label>
          <select class="select" v-model="runtimeConfig.aiConfigId">
            <option disabled selected>Pick an AI Config</option>
            <option v-for="config in aiConfigs" :key="config.id" :value="config.id">
              {{ config.name }}
            </option>
          </select>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">System Prompt</span>
          </label>
          <textarea
            v-model="runtimeConfig.prompt.system"
            class="textarea textarea-bordered textarea-primary h-20 w-full resize-none"
            placeholder="Enter system prompt"
          ></textarea>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">User Prompt</span>
          </label>
          <textarea
            v-model="runtimeConfig.prompt.user"
            class="textarea textarea-bordered textarea-primary h-20 w-full resize-none"
            placeholder="Enter user prompt"
          ></textarea>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Temperature</span>
            <span class="label-text-alt text-base-content/70">{{ runtimeConfig.temperature || 0 }}</span>
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            v-model.number="runtimeConfig.temperature"
            class="range range-primary w-full"
          />
          <div class="flex justify-between text-xs text-base-content/60 mt-1 px-1">
            <span>0</span>
            <span>1</span>
            <span>2</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
