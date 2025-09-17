<script setup lang="ts">
import { computed, isProxy, ref, watch } from 'vue';
import VueJsonPretty from 'vue-json-pretty';

import { useTaskSettingsStore } from '@/stores';
import { createLogger } from '@/utils/logger';

import type { TaskType } from '@/agent/types';

import 'vue-json-pretty/lib/styles.css';

import { isJSON } from 'es-toolkit';
import { storeToRefs } from 'pinia';

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
</script>

<template>
  <div class="space-y-4">
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body p-0">
        <div class="flex items-center justify-between">
          <label class="label">System Prompt</label>
          <fieldset class="fieldset bg-base-100 border-base-300 rounded-box border">
            <label class="label">
              Edit
              <input type="checkbox" class="toggle" v-model="isPrettyMode.system" />
              View
            </label>
          </fieldset>
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
          <fieldset class="fieldset bg-base-100 border-base-300 rounded-box border">
            <label class="label">
              Edit
              <input type="checkbox" class="toggle" v-model="isPrettyMode.user" />
              View
            </label>
          </fieldset>
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
