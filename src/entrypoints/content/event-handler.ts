import type { ContentScriptContext } from '#imports';

import { onKeyDown, useElementByPoint, useMouse } from '@vueuse/core';
import { throttle } from 'es-toolkit';
import { effectScope, watch } from 'vue';

import { toggleParaCard } from '@/entrypoints/content/card-manager';
import { findClosestTextContainer } from '@/utils/paragraph';

export let currentHoveredElement: HTMLElement | null = null;

/**
 * Initialize reactive hover tracking and keyboard trigger.
 *
 * @param ctx - WXT content script context
 * @returns Teardown function
 */
export const setupEventListeners = (ctx: ContentScriptContext) => {
  const throttledToggle = throttle(() => toggleParaCard(ctx, currentHoveredElement), 300);
  const scope = effectScope();
  scope.run(() => {
    const { x, y } = useMouse({ type: 'client', touch: false });
    const { element } = useElementByPoint({ x, y });
    watch(
      element,
      (el) => {
        if (el instanceof HTMLElement && findClosestTextContainer(el)) {
          currentHoveredElement = el;
        } else {
          currentHoveredElement = null;
        }
      },
      { immediate: true }
    );

    onKeyDown('Shift', () => { throttledToggle(); }, { target: document, dedupe: true });
  });

  // Return teardown to avoid leaks
  return () => {
    scope.stop();
  };
};
