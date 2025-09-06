<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import JsonTable from './JsonTable.vue';
import { createLogger } from '@/utils/logger';
import { useTaskConfigsStore } from '@/stores/taskConfigs';
import type { TaskType } from '@/agent/types';

const logger = createLogger('PromptEditor');
const taskConfigsStore = useTaskConfigsStore();
const props = defineProps<{
  taskType: TaskType;
}>();

const { system, user } = taskConfigsStore.taskRuntimeConfigs[props.taskType].prompt;

const isJsonMode = ref(false);
</script>

<template>
  <div class="space-y-4">
    <div class="form-control">
      <fieldset class="fieldset bg-base-100 border-base-300 rounded-box w-64 border p-4">
        <legend class="fieldset-legend">Mode</legend>
        <label class="label">
          <input type="checkbox" class="toggle" v-model="isJsonMode" />
          JSON
        </label>
      </fieldset>
    </div>

    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h3 class="card-title text-lg font-semibold">System Prompt</h3>
        <JsonTable v-if="isJsonMode" :data="JSON.parse(system)" />
        <textarea
          v-else
          v-model="system"
          class="textarea textarea-bordered textarea-primary h-20 w-full"
        />
      </div>
    </div>

    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h3 class="card-title text-lg font-semibold">User Prompt</h3>
        <JsonTable v-if="isJsonMode" :data="JSON.parse(user)" />
        <textarea
          v-else
          v-model="user"
          class="textarea textarea-bordered textarea-primary h-20 w-full"
        />
      </div>
    </div>
  </div>
</template>
