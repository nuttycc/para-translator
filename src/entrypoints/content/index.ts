import { defineContentScript } from '#imports';

import { initContentStore } from '@/entrypoints/content/core/store';
// import '@/assets/content-ui.css';

import { setupEventListeners } from '@/entrypoints/content/core/event-handler';
import { createLogger } from '@/utils/logger';

export const logger = createLogger('content');

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  runAt: 'document_idle',

  main(ctx) {
    const startTime = performance.now();

    initContentStore();

    // Setup event listeners for hover and keyboard interactions
    const teardown = setupEventListeners(ctx);

    ctx.onInvalidated(teardown);

    const endTime = performance.now();
    logger.info`content script loaded in ${(endTime - startTime).toFixed(2)} ms`;
  },
});
