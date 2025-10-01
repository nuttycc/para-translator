import paraCardCSS from '@/assets/ParaCard.css?inline';
import { contentStore } from '@/entrypoints/content/core/store';

// Shared style element management - reduces DOM overhead by reusing CSS
let sharedStyleEl: HTMLStyleElement | null = null;
let sharedStyleRefCount = 0;

/**
 * Updates the shared style element with the latest CSS content.
 */
export const updateSharedStyleContent = () => {
  if (sharedStyleEl) {
    sharedStyleEl.textContent = contentStore?.paraCardCSS ?? paraCardCSS;
  }
};

/**
 * Ensures the shared style element exists and is in the document head.
 * @returns The shared style element
 */
export const ensureSharedStyleElement = (): { styleEl: HTMLStyleElement } => {
  if (sharedStyleEl && document.head.contains(sharedStyleEl)) {
    return { styleEl: sharedStyleEl };
  }

  const styleEl = document.createElement('style');
  styleEl.id = 'para-card-style';

  styleEl.textContent = contentStore?.paraCardCSS ?? paraCardCSS;

  document.head.appendChild(styleEl);
  sharedStyleEl = styleEl;
  return { styleEl };
};

/**
 * Increments the reference count for the shared style element.
 */
export const incrementStyleRefCount = () => {
  sharedStyleRefCount += 1;
};

/**
 * Decrements the reference count and removes the style element if no longer needed.
 */
export const decrementStyleRefCount = () => {
  if (sharedStyleRefCount > 0) {
    sharedStyleRefCount -= 1;
  }
  if (sharedStyleRefCount === 0 && sharedStyleEl) {
    sharedStyleEl.remove();
    sharedStyleEl = null;
  }
};
