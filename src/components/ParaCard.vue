<script setup lang="ts">
import { CircleAlert } from 'lucide-vue-next';
import { ref } from 'vue';
import VueMarkdown from 'vue-markdown-render';

import { HistoryData } from '@/agent/types';
import { DISABLED_EXPLANATION } from '@/constant';
import { createLogger } from '@/utils/logger';

export interface ParaCardProps extends HistoryData {
  showContext?: boolean;
  sourceText: string;
  translation: string | null;
  explanation: string | null;
  error?: { type: 'translate' | 'explain'; message: string };
}

const props = withDefaults(defineProps<ParaCardProps>(), {
  showContext: false,
  translation: '',
  explanation: '',
});

const logger = createLogger('ParaCard');
const showTab = ref(props.showContext ? 'context' : 'translation');
</script>

<template>
  <div class="card card-border bg-base-100 rounded-[4px]">
    <div v-if="props.error?.type === 'translate'" role="alert" class="card-body alert alert-error">
      <CircleAlert />
      <span>{{ props.error.message }}</span>
    </div>
    <div v-if="!props.translation" class="card-body mx-auto w-fit">
      <span class="loading loading-spinner loading-sm"></span>
    </div>
    <div v-else class="card-body">
      {{ props.translation }}
    </div>
  </div>

  <!-- <div class="card prose grid max-w-full rounded-md">

    <div class="tabs tabs-sm tabs-box justify-end-safe">
      <input
        v-if="showContext"
        type="radio"
        name="my_tabs_1"
        value="context"
        v-model="showTab"
        class="tab"
        aria-label="Context"
      />

      <div class="tab-content">
        <div v-if="!props.context">
          <span class="loading loading-spinner loading-sm"></span>
          <span class="text-base-content/70">Loading...</span>
        </div>
        <div v-else>
          <ul class="grid grid-cols-1 gap-2">
            <li v-for="(value, key) in props.context" :key="key" class="flex gap-2">
              <span class="font-medium">{{ key }}:</span>
              <span class="text-base-content/80">{{ value }}</span>
            </li>
          </ul>
        </div>
      </div>

      <input
        type="radio"
        name="my_tabs_1"
        value="translation"
        v-model="showTab"
        class="tab"
        aria-label="Translation"
        checked="true"
      />
      <div class="tab-content bg-base-100 border-base-300">
        <div v-if="props.error?.type === 'translate'" role="alert" class="alert alert-error">
          <CircleAlert />
          <span>{{ props.error.message }}</span>
        </div>
        <div v-if="!props.translation">
          <span class="loading loading-spinner loading-sm"></span>
          <span class="text-base-content/70">Loading...</span>
        </div>
        <div v-else>
          {{ props.translation }}
        </div>
      </div>

      <input
        v-if="!DISABLED_EXPLANATION"
        type="radio"
        name="my_tabs_1"
        value="explanation"
        v-model="showTab"
        class="tab"
        aria-label="Explanation"
      />
      <div class="tab-content">
        <div v-if="props.error?.type === 'explain'" role="alert" class="alert alert-error">
          <CircleAlert />
          <span>{{ props.error.message }}</span>
        </div>
        <div v-else-if="!props.explanation">
          <span class="loading loading-spinner loading-sm"></span>
          <span class="text-base-content/70">Loading...</span>
        </div>
        <div v-else class="max-h-96 overflow-y-auto">
          <VueMarkdown :source="props.explanation" />
        </div>
      </div>
    </div>
  </div> -->
</template>
<style scoped>
.card-body {
  padding: clamp(8px, 0.25rem + 0.94vw, 1.5rem);
  line-height: clamp(1.5, 1.7, 2);
}
</style>
