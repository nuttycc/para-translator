<script setup lang="ts">
import { storeToRefs } from 'pinia';

import ParaCard from '@/components/ParaCard.vue';
import { useHistoryStore } from '@/stores/history';
import { logger } from '@/utils/logger';

const historyStore = useHistoryStore();

const { history } = storeToRefs(historyStore);

logger.debug`history ${{ history }}`;
</script>
<template>
  <div>
    <div v-if="history.length === 0">
      <span>No history found</span>
    </div>

    <ul class="list card">
      <li v-for="(item, index) in history" :key="item.id">
        <ParaCard
          :show-context="true"
          :id="item.id"
          :context="item.context"
          :timestamp="item.timestamp"
          :source-text="item.context.sourceText"
          :translation="item.translation"
          :explanation="item.explanation"
        />
      </li>
    </ul>
  </div>
</template>
