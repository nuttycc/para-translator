<script setup lang="ts">
import { CircleAlert } from 'lucide-vue-next';
import { ref } from 'vue';

import { createLogger } from '@/utils/logger';

export interface ParaCardProps {
  sourceText?: string;
  loading?: boolean;
  result?: string;
  error?: string;
}

const props = withDefaults(defineProps<ParaCardProps>(), {
  loading: false,
});

const logger = createLogger('ParaCard');
const showTab = ref('translation');
</script>

<template>
  <div class="card prose-sm max-w-full rounded-md text-sm/relaxed grid">
    <!-- name of each tab group should be unique -->
    <div class="tabs tabs-xs tabs-box justify-end-safe">
      <input type="radio" name="my_tabs_1" value="translation" v-model="showTab" class="tab" aria-label="Translation" />
      <input type="radio" name="my_tabs_1" value="explanation" v-model="showTab" class="tab" aria-label="Explanation" />
    </div>
    <div class="card-body p-3">
      <div v-if="props.loading" class="flex items-center gap-2">
        <span class="loading loading-spinner loading-sm"></span>
        <span class="text-base-content/70">Loading...</span>
      </div>

      <div v-else-if="props.error" class="alert alert-error">
        <CircleAlert />
        <span>{{ props.error }}</span>
      </div>

      <div v-else>
        {{ props.result }}
      </div>
    </div>
  </div>
</template>
