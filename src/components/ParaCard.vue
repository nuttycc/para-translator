<script setup lang="ts">
import { CircleAlert } from 'lucide-vue-next';

import { HistoryData } from '@/agent/types';

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
</script>

<template>
  <div class="para-card">
    <div v-if="props.error?.type === 'translate'" role="alert" class="para-card-alert">
      <CircleAlert />
      <span>{{ props.error.message }}</span>
    </div>
    <div v-if="!props.translation" class="para-card-loading">
      <span>Loading...</span>
    </div>
    <div v-else class="para-card-content">
      {{ props.translation }}
    </div>
  </div>
</template>
