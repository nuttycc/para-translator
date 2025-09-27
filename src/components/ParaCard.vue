<script setup lang="ts">
import { CircleAlert } from 'lucide-vue-next';

export interface ParaCardProps {
  showContext?: boolean;
  sourceText?: string;
  translation?: string;
  explanation?: string;
  error?: { type: 'translate' | 'explain'; message: string };
}

const { showContext, sourceText, translation, explanation, error } = defineProps<ParaCardProps>();
</script>

<template>
  <div class="para-card">
    <div v-if="error?.type === 'translate'" role="alert" class="para-card-alert">
      <CircleAlert />
      <span>{{ error.message }}</span>
    </div>
    <div v-if="!translation" class="para-card-loading">
      <span>Loading...</span>
    </div>
    <div v-else class="para-card-content">
      {{ translation }}
    </div>
  </div>
</template>
