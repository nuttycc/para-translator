import { findClosestTextContainer } from '@/utils/paragraph';
import { toggleTranslateIfEligible } from './card-manager';
import type { ContentScriptContext } from '#imports';

/**
 * Currently hovered element (used to find its closest text container).
 * Cleared when the pointer leaves the paragraph region.
 */
export let currentHoveredElement: HTMLElement | null = null;

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
 * @param ctx - Content script context from WXT
 */
export const handleKeyDown = (ev: KeyboardEvent, ctx: ContentScriptContext) => {
  if (ev.key === 'Shift' && !ev.repeat) {
    void toggleTranslateIfEligible(ctx, currentHoveredElement);
  }
};

/**
 * Sets up event listeners for the content script.
 *
 * @param ctx - Content script context from WXT
 */
export const setupEventListeners = (ctx: ContentScriptContext) => {
  // --- Event subscriptions (passive for perf) ---
  document.addEventListener('mouseover', handleMouseOver, { passive: true });
  document.addEventListener('mouseout', handleMouseOut, { passive: true });
  document.addEventListener('keydown', (ev) => {
    handleKeyDown(ev, ctx);
  }, { passive: true });
};
