<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import JsonTable from './JsonTable.vue';
import { createLogger } from '@/utils/logger';
import { useTaskConfigsStore } from '@/stores/taskConfigs';
import type { TaskType } from '@/agent/types';
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';

const logger = createLogger('PromptEditor');
const taskConfigsStore = useTaskConfigsStore();
const props = defineProps<{
  taskType: TaskType;
}>();

const { system, user } = taskConfigsStore.taskRuntimeConfigs[props.taskType].prompt;

const objPrompts = ref({
  system: JSON.parse(system),
  user: JSON.parse(user),
});

const isPrettyMode = ref({
  system: true,
  user: true,
});
</script>

<template>
  <div class="space-y-4">
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body p-0">
        <div class="flex justify-between items-center">
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
            class="overflow-y-auto max-h-80"
          />
        </div>
        <textarea
          v-else
          v-model="system"
          class="textarea textarea-bordered textarea-primary h-40 w-full"
        />
      </div>
    </div>

    <div class="card bg-base-100 shadow-xl">
      <div class="card-body p-0">
        <div class="flex justify-between items-center">
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
            class="overflow-y-auto max-h-80"
          />
        </div>
        <textarea
          v-else
          v-model="user"
          class="textarea textarea-bordered textarea-primary h-40 w-full"
        />
      </div>
    </div>
  </div>
</template>
