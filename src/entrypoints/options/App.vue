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
  browser.storage.local.clear().then(() => {
    showToast({
      message: 'Storage reset',
      type: 'success',
      position: 'toast-bottom toast-center',
    });
  }).catch((err) => {
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
    <div class="navbar w-5xl flex justify-between">
      <h1 class="text-xl font-bold">Options</h1>
      <div class="flex gap-2">
        <button class="btn btn-outline btn-warning" @click="runToastTest">Test Toast</button>
        <button class="btn btn-outline btn-error" @click="resetStorage">Reset Storage</button>
      </div>

      <div class="flex gap-2">
        <RouterLink to="/" class="btn btn-soft" exact-active-class="btn-active btn-accent"
          >AI</RouterLink
        >
        <RouterLink to="/tasks" class="btn btn-soft" exact-active-class="btn-active btn-accent"
          >Tasks</RouterLink
        >
      </div>
    </div>

    <div class="divider"></div>

    <div class="min-h-[600px] w-3xl mb-8">
      <RouterView v-slot="{ Component, route }">
        <transition :name="(route.meta?.transition as string) || 'fade'" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </RouterView>
    </div>

    <div class="divider"></div>

    <div class="w-5xl h-16 flex items-center justify-center">
      <p class="text-sm text-gray-500">Some text here</p>
    </div>
  </div>
</template>

<style scoped>
/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>
