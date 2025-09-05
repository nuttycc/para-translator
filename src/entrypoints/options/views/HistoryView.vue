<script setup lang="ts">
import { agentStorage } from '@/agent/storage';
import type { AgentExecutionResult } from '@/agent/types';
import ParaCard from '@/components/ParaCard.vue';
import { createLogger } from '@/utils/logger';
import { ref } from 'vue';

const logger = createLogger('HistoryView');
const history = ref<AgentExecutionResult[]>([]);

// option 1
agentStorage.agentExecutionResults
  .getValue()
  .then((value) => {
    history.value = value;
    return;
  })
  .catch((error) => {
    logger.error`Failed to get history, ${error}`;
  });
</script>
<template>
  <div class="container mx-auto p-4 max-w-6xl">
    <!-- Header Section -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-base-content mb-2">Execution History</h1>
      <div class="flex items-center gap-4 text-sm text-base-content/70">
        <span>Total Records: {{ history.length }}</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="history.length === 0" class="hero min-h-96">
      <div class="hero-content text-center">
        <div>
          <svg class="w-16 h-16 text-base-content/30 mb-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 class="text-2xl font-bold text-base-content mb-2">No Execution History</h2>
          <p class="text-base-content/70">
            Start using translation or explanation features to see your execution history here.
          </p>
        </div>
      </div>
    </div>

    <!-- History Grid -->
    <div v-else class="flex flex-col gap-4">
      <div
        v-for="item in history"
        :key="item.id"
        class="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow duration-200"
      >
        <div class="card-body p-5">
          <!-- Header Info -->
          <div class="flex justify-between items-start mb-4">
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2">
                <div v-if="item.duration" class="badge badge-outline badge-sm">
                  {{ Math.round(item.duration / 1000) }}s
                </div>
              </div>
              <div class="text-xs text-base-content/60">
                <span class="ml-1">{{ new Date(item.timestamp).toLocaleString() }}</span>
              </div>
            </div>
            <div class="text-right">
              <div class="text-xs font-mono text-base-content/50">{{ item.id.slice(-8) }}</div>
            </div>
          </div>

          <!-- Text Preview -->
          <div class="mb-3">
            <div class="text-sm text-base-content/80 line-clamp-3 bg-base-200 p-3 rounded-lg">
              {{ item.context.sourceText }}
            </div>
          </div>

          <!-- Metadata Tags -->
          <div class="flex flex-wrap gap-2 mb-4">
            <div v-if="item.metadata?.provider" class="badge badge-outline badge-xs">
              {{ item.metadata.provider }}
            </div>
            <div v-if="item.metadata?.model" class="badge badge-outline badge-xs">
              {{ item.metadata.model }}
            </div>
            <div v-if="item.metadata?.temperature" class="badge badge-ghost badge-xs">
              T: {{ item.metadata.temperature }}
            </div>
            <div v-if="item.metadata?.resultLength" class="badge badge-ghost badge-xs">
              {{ item.metadata.resultLength }} chars
            </div>
          </div>

          <!-- Collapsible Details -->
          <div class="collapse collapse-arrow bg-base-200">
            <input type="checkbox" class="peer" />
            <div class="collapse-title text-sm font-medium peer-checked:bg-base-300">
              View Details
            </div>
            <div class="collapse-content text-sm space-y-3 mt-2">
              <div class="grid gap-2">
                <div class="flex justify-between">
                  <span class="font-medium">ID:</span>
                  <span class="font-mono text-xs">{{ item.id }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="font-medium">AI Config:</span>
                  <span class="font-mono text-xs">{{ item.aiConfigId.slice(-8) }}</span>
                </div>
                <div v-if="item.context.siteTitle" class="flex justify-between">
                  <span class="font-medium">Page Title:</span>
                  <span class="text-xs">{{ item.context.siteTitle }}</span>
                </div>
                <div v-if="item.context.siteUrl" class="flex justify-between">
                  <span class="font-medium">Page URL:</span>
                  <a
                    :href="item.context.siteUrl"
                    target="_blank"
                    class="link link-primary text-xs"
                    >{{ item.context.siteUrl }}</a
                  >
                </div>
              </div>
              <div class="divider my-2"></div>
              <div>
                <div class="font-medium mb-2">Result:</div>
                <div class="p-3 rounded text-sm">
                  <ParaCard :result="item.result" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Stats -->
    <div v-if="history.length > 0" class="mt-8 pt-6 border-t border-base-300">
      <div class="stats stats-vertical lg:stats-horizontal shadow w-full">
        <div class="stat">
          <div class="stat-title">Total Executions</div>
          <div class="stat-value text-primary">{{ history.length }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">Translations</div>
          <div class="stat-value text-secondary">
            {{ history.filter((item) => item.taskType === 'translate').length }}
          </div>
        </div>
        <div class="stat">
          <div class="stat-title">Explanations</div>
          <div class="stat-value text-accent">
            {{ history.filter((item) => item.taskType === 'explain').length }}
          </div>
        </div>
        <div class="stat">
          <div class="stat-title">Avg Duration</div>
          <div class="stat-value text-info">
            {{
              history.filter((item) => item.duration).length > 0
                ? Math.round(
                    history
                      .filter((item) => item.duration)
                      .reduce((sum, item) => sum + item.duration!, 0) /
                      history.filter((item) => item.duration).length /
                      1000
                  ) + 's'
                : 'N/A'
            }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
