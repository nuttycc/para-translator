<script setup lang="ts">
import type { AIConfigs, TaskRuntimeConfig } from '@/agent/types';
import { agentStorage } from '@/agent/storage';
import { ref } from '#imports';

const props = defineProps<{
  config: TaskRuntimeConfig;
  taskType: string;
}>();

const aiConfigs = ref<AIConfigs>({});

agentStorage.aiConfigs.getValue().then((configs) => {
  aiConfigs.value = configs;
});

</script>

<template>
  <div class="card shadow-xl">
    <div class="card-body">
      <h2 class="card-title text-2xl mb-6">
        {{ taskType.charAt(0).toUpperCase() + taskType.slice(1) }} Task
      </h2>

      <div class="space-y-4">
        <div class="form-control flex flex-col gap-2">
          <label class="label">
            <span class="label-text font-semibold">Select AI Config</span>
          </label>
          <select class="select" v-model="config.aiConfigId">
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
            v-model="config.prompt.system"
            class="textarea textarea-bordered textarea-primary h-20 w-full resize-none"
            placeholder="Enter system prompt"
          ></textarea>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">User Prompt</span>
          </label>
          <textarea
            v-model="config.prompt.user"
            class="textarea textarea-bordered textarea-primary h-20 w-full resize-none"
            placeholder="Enter user prompt"
          ></textarea>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Temperature</span>
            <span class="label-text-alt text-base-content/70">{{ config.temperature || 0 }}</span>
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            v-model="config.temperature"
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
