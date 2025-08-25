<script setup lang="ts">
export interface ParaCardProps {
  text: string;
  loading: boolean;
  result: string;
  error: string | null;
  [key: string]: any;
}

const props = withDefaults(defineProps<ParaCardProps>(), {
  text: '',
  loading: false,
  result: '',
  error: null,
});
</script>

<template>
  <div class="card bg-base-100 shadow-lg">
    <div class="card-body">
      <h2 class="card-title text-primary">Para-Translator</h2>

      <div v-if="props.loading" class="flex items-center gap-2">
        <span class="loading loading-spinner loading-sm"></span>
        <span class="text-base-content/70">Loading...</span>
      </div>

      <div v-else-if="props.error" class="alert alert-error">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="stroke-current shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{{ props.error }}</span>
      </div>

      <div v-else class="text-base-content">
        {{ props.result }}
      </div>
    </div>
  </div>
</template>
