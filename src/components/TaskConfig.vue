<script setup lang="ts">
import type { AIConfigs, TaskRuntimeConfig } from '@/agent/types';
import { agentStorage } from '@/agent/storage';
import { ref, watch, nextTick } from '#imports';

const props = defineProps<{
  config: TaskRuntimeConfig;
  taskType: string;
}>();

const emit = defineEmits<{
  (e: 'update', value: TaskRuntimeConfig): void;
}>();

const aiConfigs = ref<AIConfigs>({});

// Local working copy of the config
const local = ref<TaskRuntimeConfig>(structuredClone(props.config));
// Internal flag to avoid echo loops when syncing from props
const syncingFromProps = ref(false);

// Emit changes upstream (skip while we are syncing from props)
watch(
  local,
  (val) => {
    if (syncingFromProps.value) return;
    emit('update', val);
  },
  { deep: true }
);

// Keep local in sync if parent replaces the config object
watch(
  () => props.config,
  (next) => {
    syncingFromProps.value = true;
    local.value = structuredClone(next);
    nextTick(() => {
      syncingFromProps.value = false;
    });
  }
  // reference watch is sufficient; use { deep: true } only if parent mutates in-place
);

agentStorage.aiConfigs
  .getValue()
  .then((configs) => {
    aiConfigs.value = configs ?? {};
  })
  .catch((err) => {
    console.error('Failed to load AI configs:', err);
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
          <select class="select" v-model="local.aiConfigId">
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
            v-model="local.prompt.system"
            class="textarea textarea-bordered textarea-primary h-20 w-full resize-none"
            placeholder="Enter system prompt"
          ></textarea>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">User Prompt</span>
          </label>
          <textarea
            v-model="local.prompt.user"
            class="textarea textarea-bordered textarea-primary h-20 w-full resize-none"
            placeholder="Enter user prompt"
          ></textarea>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Temperature</span>
            <span class="label-text-alt text-base-content/70">{{ local.temperature || 0 }}</span>
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            v-model.number="local.temperature"
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
