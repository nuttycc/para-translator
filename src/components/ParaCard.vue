<script setup lang="ts">
import { createLogger } from '@/utils/logger';
import { CircleAlert } from 'lucide-vue-next';
import { ref } from 'vue';

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
const isTab = ref('translation');
</script>

<template>
  <div class="card prose-sm rounded-md text-sm max-w-full">
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
