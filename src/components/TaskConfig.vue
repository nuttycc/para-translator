<script setup lang="ts">
import type { TaskRuntimeConfig } from '@/agent/types';

const props = defineProps<{
  config: TaskRuntimeConfig;
}>();
</script>

<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title text-2xl mb-6">Task Configuration</h2>

      <div class="space-y-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">AI Config ID</span>
          </label>
          <input
            type="text"
            v-model="config.aiConfigId"
            class="input input-bordered input-primary w-full"
            placeholder="Enter AI configuration ID"
          />
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
