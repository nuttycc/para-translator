/**
 * Utilities for locating paragraph-like containers and extracting readable text.
 *
 * Designed for use in content scripts: keep fast, avoid layout thrashing,
 * and operate on generic `HTMLElement` instances without framework coupling.
 */

const PARAGRAPH_SELECTOR = 'p, a, li, blockquote, dd, dt, pre, article, section, div';

export function findClosestTextContainer(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Node)) return null;
  const element = target instanceof Element ? target : target.parentElement;
  if (!element) return null;
  const closest = element.closest(PARAGRAPH_SELECTOR);
  return closest instanceof HTMLElement ? closest : null;
}

export function extractReadableText(el: HTMLElement | null): string {
  if (!el) return '';
  const text = el.textContent || '';
  return text.replace(/\s+/g, ' ').trim();
}

export function isParagraphLike(text: string): boolean {
  if (!text) return false;
  if (text.length < 2) return false;
  if (text.length > 5000) return false;
  return true;
}
