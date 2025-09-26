/**
 * Finds the closest text container element by traversing up the DOM tree from the target.
 * Scores candidates based on text quality and returns the best match.
 */
export function findClosestTextContainer(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Node)) return null;
  let element = target instanceof Element ? target : target.parentElement;
  if (!element || !(element instanceof HTMLElement)) return null;

  // Traverse up the DOM tree from the current element to find the best text container
  let current: HTMLElement | null = element;
  let bestCandidate: HTMLElement | null = null;
  let bestScore = 0;

  // Limit traversal to 10 levels up to prevent performance issues
  for (let i = 0; i < 10 && current; i++) {
    const text = extractReadableText(current);

    if (text.length >= 2) {
      const score = calculateTextScore(text, current);

      if (score > bestScore) {
        bestScore = score;
        bestCandidate = current;
      }

      // Stop early if we find high-quality text
      if (score >= 80) break;
    }

    current = current.parentElement;
  }

  return bestCandidate;
}

/**
 * Calculates a quality score for text content based on length, sentence structure, and element type.
 */
export function calculateTextScore(text: string, element: HTMLElement): number {
  let score = 0;

  const punctuation = new Set(['.', '!', '?', '。', '！', '？', ',', ':', ';', '，', '：', '；']);

  const lastChar = text[text.length - 1];
  const isValidLastChar = punctuation.has(lastChar);

  if (isValidLastChar) score += 20;

  // Base score based on text length
  const length = text.length;
  if (isValidLastChar && length >= 150) score += 40;
  else if (length >= 20) score += 20;
  else if (length >= 2) score += 10;

  // Bonus based on element type
  const tagName = element.tagName.toLowerCase();
  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) score += 70;
  else if (['p', 'div', 'article', 'section', 'li'].includes(tagName)) score += 60;
  else if (['span', 'a'].includes(tagName)) score += 20;

  return Math.min(score, 100);
}

/**
 * Extracts readable text from an element, normalizing whitespace.
 */
export function extractReadableText(el: HTMLElement | null): string {
  if (!el) return '';
  const text = el.textContent || '';
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Checks if the given text appears to be paragraph-like based on length criteria.
 */
export function isParagraphLike(text: string): boolean {
  if (!text) return false;
  if (text.length < 2) return false;
  if (text.length > 5000) return false;
  return true;
}
