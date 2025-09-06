import { defineContentScript } from '#imports';

import '@/assets/content-ui.css';

import { setupEventListeners } from '@/entrypoints/content/event-handler';
import { createLogger } from '@/utils/logger';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  main(ctx) {
    const startTime = performance.now();
    const logger = createLogger('content');

    // Setup event listeners for hover and keyboard interactions
    setupEventListeners(ctx);

    const endTime = performance.now();
    logger.info`content script loaded in ${(endTime - startTime).toFixed(2)} ms`;
  },
});
