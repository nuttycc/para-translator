<script setup lang="ts">
import { browser } from '#imports';
import { createLogger } from '@/utils/logger';
import { showToast, testToast } from '@/utils/toast';
import { RouterLink, RouterView } from 'vue-router';

const logger = createLogger('options');

const runToastTest = () => {
  testToast();
};

const resetStorage = () => {
  browser.storage.local
    .clear()
    .then(() => {
      showToast({
        message: 'Storage reset',
        type: 'success',
        position: 'toast-bottom toast-center',
      });
    })
    .catch((err) => {
      logger.error`Failed to reset storage: ${err}`;
      showToast({
        message: 'Failed to reset storage',
        type: 'error',
        position: 'toast-bottom toast-center',
      });
    });
};
</script>

<template>
  <div class="w-fit mx-auto flex flex-col items-center">
    <div class="navbar h-4 max-h-[22vh] w-5xl flex justify-between">
      <h1 class="text-xl font-bold">Options</h1>
      <div class="flex gap-2">
        <button class="btn btn-outline btn-warning" @click="runToastTest">Test Toast</button>
        <button class="btn btn-outline btn-error" @click="resetStorage">Reset Storage</button>
      </div>

      <div class="flex gap-2">
        <RouterLink :to="{ name: 'ai.config' }" class="btn btn-soft"> AI</RouterLink>
        <RouterLink :to="{ name: 'tasks.detail' }" class="btn btn-soft">Tasks</RouterLink>
      </div>
    </div>

    <div class="divider mt-0"></div>

    <div class="min-h-[66vh] w-3xl">
      <RouterView v-slot="{ Component, route }">
        <transition :name="(route.meta?.transition as string) || 'fade'" mode="out-in">
          <component :is="Component" :key="route.matched[0]?.path" />
        </transition>
      </RouterView>
    </div>

    <div class="divider"></div>
  </div>
</template>
