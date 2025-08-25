/**
 * Utilities for detecting and extracting paragraph-like text from DOM elements.
 * comments: Keep simple and focused for content-script use.
 */

const PARAGRAPH_SELECTOR = 'p, a, li, blockquote, dd, dt, pre, article, section, div';

/**
 * Find the nearest ancestor paragraph-like HTMLElement for a given event target.
 *
 * If `target` is not a DOM Node, or no matching ancestor is found, returns `null`.
 *
 * @param target - The event target (may be an Element, a Node, or `null`)
 * @returns The closest ancestor matching paragraph-like selectors (e.g. `p`, `div`, `article`, etc.), or `null` if none
 */
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

/**
 * Heuristic check whether a string resembles a paragraph-sized text block.
 *
 * Returns false for empty or very short strings (less than 2 characters) and
 * for extremely long blocks (more than 5000 characters); otherwise returns true.
 *
 * @param text - The text to evaluate.
 * @returns `true` when `text` is non-empty and its length is between 2 and 5000 characters (inclusive of bounds checked by the function), otherwise `false`.
 */
export function isParagraphLike(text: string): boolean {
  if (!text) return false;
  if (text.length < 2) return false;
  // Avoid extremely long blocks to reduce noise
  if (text.length > 5000) return false;
  return true;
}
