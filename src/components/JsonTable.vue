<script setup lang="ts">
import { createLogger } from '@/utils/logger';
import { isJSONObject } from 'es-toolkit';

const logger = createLogger('JsonTable');

const props = defineProps<{
  data: Record<string, unknown> | string;
}>();

logger.info`isJSONObject: ${isJSONObject(props.data)}, data: ${JSON.stringify(props.data)}`;

</script>

<template>
  <div v-if="isJSONObject(data)" class="json-table-wrapper">
    <table class="table table-zebra w-full">
      <tbody>
        <tr v-for="(v, k) in data" :key="k">
          <th>{{ k }}</th>
          <td>
            <JsonTable :data="v as Record<string, unknown>" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div v-else>{{ data }}</div>
</template>
