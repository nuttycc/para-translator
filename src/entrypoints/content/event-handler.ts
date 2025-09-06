import type { ContentScriptContext } from '#imports';

import { throttle } from 'es-toolkit';

import { toggleParaCard } from '@/entrypoints/content/card-manager';
import { findClosestTextContainer } from '@/utils/paragraph';

/**
 * Currently hovered element (used to find its closest text container).
 * Cleared when the pointer leaves the paragraph region.
 */
export let currentHoveredElement: HTMLElement | null = null;
// Stable runner initialized in setupEventListeners
let throttledToggle: (() => void) | null = null;

/**
 * Tracks the hovered element if it belongs to a paragraph-like container.
 * Lightweight gate to avoid expensive work for non-paragraph nodes.
 * Expensive DOM operations are deferred until translation trigger.
 *
 * @param ev - Mouse event bubbling from the document.
 */
export const handleMouseOver = (ev: MouseEvent) => {
  const container = findClosestTextContainer(ev.target);
  if (container && ev.target instanceof HTMLElement) {
    currentHoveredElement = ev.target;
    // logger.debug`hovering over paragraph-like element`;
  }
};

/**
 * Clears the `currentHoveredElement` when leaving the paragraph region.
 * Prevents accidental toggles outside of the intended text block.
 *
 * @param ev - Mouse event bubbling from the document.
 */
export const handleMouseOut = (ev: MouseEvent) => {
  const container = findClosestTextContainer(ev.target);
  if (container && currentHoveredElement) {
    const relatedContainer = findClosestTextContainer(ev.relatedTarget);
    if (!relatedContainer || relatedContainer !== container) {
      currentHoveredElement = null;
      // logger.debug`left paragraph area`;
    }
  }
};

/**
 * Handles keyboard events for translation triggering.
 *
 * @param ev - Keyboard event
 */
export const handleKeyDown = (ev: KeyboardEvent) => {
  if (ev.key === 'Shift' && !ev.repeat) {
    throttledToggle?.();
  }
};

/**
 * Sets up event listeners for the content script.
 *
 * @param ctx - Content script context from WXT
 * @returns Teardown function to remove event listeners
 */
export const setupEventListeners = (ctx: ContentScriptContext) => {
  // Prepare the throttled action once
  throttledToggle = throttle(() => toggleParaCard(ctx, currentHoveredElement), 300);
  // --- Event subscriptions (passive for perf) ---
  document.addEventListener('mouseover', handleMouseOver, { passive: true });
  document.addEventListener('mouseout', handleMouseOut, { passive: true });
  const keydownHandler = (ev: KeyboardEvent) => handleKeyDown(ev);
  document.addEventListener('keydown', keydownHandler);

  // Return teardown to avoid leaks
  return () => {
    document.removeEventListener('mouseover', handleMouseOver as EventListener);
    document.removeEventListener('mouseout', handleMouseOut as EventListener);
    document.removeEventListener('keydown', keydownHandler);
  };
};
