<script setup lang="ts">
import { browser } from '#imports';

import { Bolt, Wrench } from 'lucide-vue-next';
import { RouterLink, RouterView } from 'vue-router';

import { createLogger } from '@/utils/logger';
import { showToast, testToast } from '@/utils/toast';

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
      return;
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

const openDrawer = () => {
  document.getElementById('my-drawer')?.click();
};
</script>

<template>
  <div class="mx-auto flex w-fit flex-col items-center font-sans">
    <div class="navbar flex h-4 max-h-[22vh] w-5xl justify-between">
      <h1 class="text-xl font-bold">Options</h1>

      <div class="drawer">
        <input id="my-drawer" type="checkbox" class="drawer-toggle" />
        <div class="drawer-content">
          <!-- Page content here -->
          <label for="my-drawer" class="btn btn-primary drawer-button hidden">Open drawer</label>
        </div>
        <div class="drawer-side">
          <label for="my-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
          <ul class="menu bg-base-200 text-base-content min-h-full w-80 p-4">
            <!-- Sidebar content here -->
            <li><button @click="runToastTest">Test Toast</button></li>
            <li><button @click="resetStorage">Reset Storage</button></li>
          </ul>
        </div>
      </div>

      <div class="fab inset-x-14 inset-y-8">
        <!-- a focusable div with tabindex is necessary to work on all browsers. role="button" is necessary for accessibility -->
        <div tabindex="0" role="button" class="btn btn-lg btn-circle btn-soft">
          <Bolt />
        </div>

        <!-- buttons that show up when FAB is open -->
        <div class="tooltip" data-tip="Debug Menu">
          <button class="btn btn-lg btn-circle" @click="openDrawer"><Wrench /></button>
        </div>
      </div>

      <div class="flex gap-2">
        <RouterLink :to="{ name: 'ai.config' }" class="btn btn-soft"> AI</RouterLink>
        <RouterLink :to="{ name: 'tasks.detail' }" class="btn btn-soft">Tasks</RouterLink>
        <RouterLink :to="{ name: 'history' }" class="btn btn-soft">History</RouterLink>
      </div>
    </div>

    <div class="divider mt-0"></div>

    <div class="min-h-[80dvh] w-3xl">
      <RouterView v-slot="{ Component, route }">
        <transition :name="(route.meta?.transition as string) || 'fade'" mode="out-in">
          <component :is="Component" :key="route.matched[0]?.path" />
        </transition>
      </RouterView>
    </div>

    <div class="divider"></div>
  </div>
</template>
