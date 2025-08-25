/**
 * Utilities for detecting and extracting paragraph-like text from DOM elements.
 * comments: Keep simple and focused for content-script use.
 */

const PARAGRAPH_SELECTOR = 'p, a, li, blockquote, dd, dt, pre, article, section, div';

/** Return the closest paragraph-like element for a given event target. */
export function findClosestTextContainer(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Node)) return null;
  const element =
    target.nodeType === Node.ELEMENT_NODE ? (target as Element) : target.parentElement;
  if (!element) return null;
  const closest = element.closest(PARAGRAPH_SELECTOR);
  return closest instanceof HTMLElement ? closest : null;
}

/** Extract readable text from an element. Trims and normalizes whitespace. */
export function extractReadableText(el: HTMLElement | null): string {
  if (!el) return '';
  const text = el.innerText || el.textContent || '';
  return text.replace(/\s+/g, ' ').trim();
}

/** Basic filter to decide if a text looks like a paragraph. */
export function isParagraphLike(text: string): boolean {
  if (!text) return false;
  if (text.length < 2) return false;
  // Avoid extremely long blocks to reduce noise
  if (text.length > 5000) return false;
  return true;
}
