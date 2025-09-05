<script setup lang="ts">
import { computed, ref } from 'vue';
import { createLogger } from '@/utils/logger';
import type { ResponseFormatType } from '@/agent/executor';
import VueMarkdown from 'vue-markdown-render';

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

const parsedResult = computed<ResponseFormatType>(() => {
  if (!props.result) return null;
  try {
    return JSON.parse(props.result);
  } catch (error) {
    logger.error`failed to parse result: ${error}`;
    return props.result;
  }
});
</script>

<template>
  <div class="card text-sm">
    <div class="card-body py-2">
      <!-- <h2 class="card-title text-primary">Para-Translator</h2> -->

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

      <div v-else class="grid text-base-content">
        <ul class="row-span-1 menu menu-sm menu-horizontal place-self-end">
          <li>
            <button
              @click="isTab = 'translation'"
              :class="{ 'menu-active': isTab === 'translation' }"
            >
              Translation
            </button>
          </li>
          <li>
            <button @click="isTab = 'grammar'" :class="{ 'menu-active': isTab === 'grammar' }">
              Grammar
            </button>
          </li>
          <li>
            <button
              @click="isTab = 'vocabulary'"
              :class="{ 'menu-active': isTab === 'vocabulary' }"
            >
              Vocabulary
            </button>
          </li>
        </ul>
        <ul class="row-auto pb-3 list-none prose-sm">
          <li v-if="isTab === 'translation'">
            {{ parsedResult.translatedText }}
          </li>
          <li v-if="isTab === 'grammar'">
            <vue-markdown :source="parsedResult.grammar" />
          </li>
          <li v-if="isTab === 'vocabulary'">
            <vue-markdown :source="parsedResult.vocabulary" />
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
