<script setup lang="ts">
import { computed, isProxy, ref, watch } from 'vue';
import VueJsonPretty from 'vue-json-pretty';

import { useTaskSettingsStore } from '@/stores';
import { createLogger } from '@/utils/logger';

import type { TaskType } from '@/agent/types';

import 'vue-json-pretty/lib/styles.css';

import { isJSON } from 'es-toolkit';
import { storeToRefs } from 'pinia';

import { AGENT_SEEDS } from '@/agent/seeds';

const logger = createLogger('PromptEditor');
const taskConfigsStore = useTaskSettingsStore();
const props = defineProps<{
  taskType: TaskType;
}>();

const { taskRuntimeConfigs } = storeToRefs(taskConfigsStore);

const runtimeConfig = computed(() => taskRuntimeConfigs.value[props.taskType]);

const prompt = computed(() => runtimeConfig.value.prompt);

const objPrompts = computed(() => ({
  system: isJSON(prompt.value.system) ? JSON.parse(prompt.value.system) : prompt.value.system,
  user: isJSON(prompt.value.user) ? JSON.parse(prompt.value.user) : prompt.value.user,
}));

const isPrettyMode = ref({
  system: true,
  user: true,
});

const resetSystemPrompt = () => {
  prompt.value.system = AGENT_SEEDS.TASK_RUNTIME_CONFIGS[props.taskType].prompt.system;
};

const resetUserPrompt = () => {
  prompt.value.user = AGENT_SEEDS.TASK_RUNTIME_CONFIGS[props.taskType].prompt.user;
};
</script>

<template>
  <div class="space-y-4">
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body p-0">
        <div class="flex items-center justify-between">
          <label class="label">System Prompt</label>

          <div class="flex items-center gap-2">
            <fieldset class="fieldset bg-base-100 border-base-300 rounded-box border">
              <label class="label">
                Edit
                <input type="checkbox" class="toggle toggle-sm" v-model="isPrettyMode.system" />
                View
              </label>
            </fieldset>

            <div class="tooltip" data-tip="Reset the system prompt to default">
              <button class="btn btn-xs btn-soft" @click="resetSystemPrompt">RESET</button>
            </div>
          </div>
        </div>

        <!-- <JsonTable v-if="isJsonMode" :data="JSON.parse(system)" /> -->

        <div v-if="isPrettyMode.system" class="json-view">
          <vue-json-pretty
            :data="objPrompts.system"
            :theme="'dark'"
            class="max-h-80 overflow-y-auto"
          />
        </div>
        <textarea
          v-else
          v-model="prompt.system"
          class="textarea textarea-bordered textarea-primary h-40 w-full"
        />
      </div>
    </div>

    <div class="card bg-base-100 shadow-xl">
      <div class="card-body p-0">
        <div class="flex items-center justify-between">
          <label class="label">User Prompt</label>

          <div class="flex items-center gap-2">
            <fieldset class="fieldset bg-base-100 border-base-300 rounded-box border">
              <label class="label">
                Edit
                <input type="checkbox" class="toggle toggle-sm" v-model="isPrettyMode.user" />
                View
              </label>
            </fieldset>
            <div class="tooltip" data-tip="Reset the user prompt to default">
              <button class="btn btn-xs btn-soft" @click="resetUserPrompt">RESET</button>
            </div>
          </div>
        </div>
        <!-- <JsonTable v-if="isJsonMode" :data="JSON.parse(user)" /> -->
        <div v-if="isPrettyMode.user" class="json-view">
          <vue-json-pretty
            :data="objPrompts.user"
            :theme="'dark'"
            class="max-h-80 overflow-y-auto"
          />
        </div>
        <textarea
          v-else
          v-model="prompt.user"
          class="textarea textarea-bordered textarea-primary h-40 w-full"
        />
      </div>
    </div>
  </div>
</template>
