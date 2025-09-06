<script setup lang="ts">
import { ref } from 'vue';

import { agentStorage } from '@/agent/storage';
import type { AgentExecutionResult } from '@/agent/types';
import ParaCard from '@/components/ParaCard.vue';
import { createLogger } from '@/utils/logger';

const logger = createLogger('HistoryView');
const history = ref<AgentExecutionResult[]>([]);

// option 1
agentStorage.agentExecutionResults
  .getValue()
  .then((value) => {
    history.value = value ?? [];
    return;
  })
  .catch((error) => {
    logger.error`Failed to get history, ${error}`;
  });
</script>
<template>
  <div class="container mx-auto max-w-6xl p-4">
    <!-- Header Section -->
    <div class="mb-6">
      <h1 class="text-base-content mb-2 text-3xl font-bold">Execution History</h1>
      <div class="text-base-content/70 flex items-center gap-4 text-sm">
        <span>Total Records: {{ history.length }}</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="history.length === 0" class="hero min-h-96">
      <div class="hero-content text-center">
        <div>
          <svg class="text-base-content/30 mb-4 h-16 w-16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 class="text-base-content mb-2 text-2xl font-bold">No Execution History</h2>
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
        class="card bg-base-100 shadow-lg transition-shadow duration-200 hover:shadow-xl"
      >
        <div class="card-body p-5">
          <!-- Header Info -->
          <div class="mb-4 flex items-start justify-between">
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2">
                <div v-if="item.duration" class="badge badge-outline badge-sm">
                  {{ Math.round(item.duration / 1000) }}s
                </div>
              </div>
              <div class="text-base-content/60 text-xs">
                <span class="ml-1">{{ new Date(item.timestamp).toLocaleString() }}</span>
              </div>
            </div>
            <div class="text-right">
              <div class="text-base-content/50 font-mono text-xs">{{ item.id.slice(-8) }}</div>
            </div>
          </div>

          <!-- Text Preview -->
          <div class="mb-3">
            <div class="text-base-content/80 bg-base-200 line-clamp-3 rounded-lg p-3 text-sm">
              {{ item.context.sourceText }}
            </div>
          </div>

          <!-- Metadata Tags -->
          <div class="mb-4 flex flex-wrap gap-2">
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
          <div class="collapse-arrow bg-base-200 collapse">
            <input type="checkbox" class="peer" />
            <div class="collapse-title peer-checked:bg-base-300 text-sm font-medium">
              View Details
            </div>
            <div class="collapse-content mt-2 space-y-3 text-sm">
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
                <div class="mb-2 font-medium">Result:</div>
                <div class="rounded p-3 text-sm">
                  <ParaCard :result="item.result" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Stats -->
    <div v-if="history.length > 0" class="border-base-300 mt-8 border-t pt-6">
      <div class="stats stats-vertical lg:stats-horizontal w-full shadow">
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
