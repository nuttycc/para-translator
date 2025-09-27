import { describe, expect, it } from 'vitest';

import { calculateTextScore } from '@/utils/paragraph';

describe('calculateTextScore', () => {
  it('returns 80 for a paragraph-like <p> ending with punctuation', () => {
    const el = document.createElement('p');
    el.textContent = 'MarkItDown currently supports the conversion from:';

    const score = calculateTextScore(el.textContent ?? '', el);

    expect(score).toBeGreaterThan(80);
  });
});
