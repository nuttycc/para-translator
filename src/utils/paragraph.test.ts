/**
 * Unit tests for paragraph utilities.
 * Testing library/framework: Jest (with jsdom) or Vitest (jsdom-like environment).
 * These tests rely only on standard DOM APIs available in jsdom.
 */
import { describe, it, expect, beforeEach } from 'vitest'; // If project uses Jest, replace with Jest globals or rely on provided globals.

// Try-catch dynamic import fallback to adapt to project's export location.
let utils: any;
let findClosestTextContainer: (t: EventTarget | null) => HTMLElement | null;
let extractReadableText: (el: HTMLElement | null) => string;
let isParagraphLike: (text: string) => boolean;

async function loadUtils() {
  // Attempt common import paths; the repository structure may differ.
  try {
    // Preferred: dedicated implementation file
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    utils = await import('./paragraph'); // src/utils/paragraph.ts
  } catch {
    try {
      // Some repos co-locate exports temporarily in a test file (PR diff context)
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      utils = await import('./paragraph.test'); // fallback if impl exists here (not ideal)
    } catch {
      // As a last resort, try index export re-exports
      try {
        utils = await import('../index');
      } catch {
        // Leave utils undefined; tests will throw with informative message below
      }
    }
  }
  if (!utils) {
    throw new Error(
      "Unable to import paragraph utilities. Ensure 'src/utils/paragraph.ts' exports findClosestTextContainer, extractReadableText, isParagraphLike."
    );
  }
  findClosestTextContainer = utils.findClosestTextContainer;
  extractReadableText = utils.extractReadableText;
  isParagraphLike = utils.isParagraphLike;
}

describe('paragraph utilities', () => {
  beforeEach(async () => {
    document.body.textContent = '';
    await loadUtils();
  });

  describe('findClosestTextContainer', () => {
    it('returns null for null target or non-Node targets', () => {
      expect(findClosestTextContainer(null)).toBeNull();
      // Non-Node target simulation: EventTarget without Node inheritance
      const nonNodeTarget: EventTarget = { addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; } };
      expect(findClosestTextContainer(nonNodeTarget)).toBeNull();
    });

    it('finds the element itself when it matches the paragraph selector', () => {
      const p = document.createElement('p');
      p.textContent = 'Hello';
      document.body.appendChild(p);
      expect(findClosestTextContainer(p)).toBe(p);
    });

    it('finds closest matching ancestor from a nested child', () => {
      const div = document.createElement('div');
      const span = document.createElement('span');
      span.textContent = 'Nested';
      div.appendChild(span);
      document.body.appendChild(div);

      expect(findClosestTextContainer(span)).toBe(div);
    });

    it('resolves from a text node (child of a matching element) to its closest container', () => {
      const li = document.createElement('li');
      const textNode = document.createTextNode('Item text node');
      li.appendChild(textNode);
      document.body.appendChild(li);

      // Target is a Text node; function should walk to parentElement and closest()
      expect(findClosestTextContainer(textNode)).toBe(li);
    });

    it('returns null when no ancestor matches the paragraph selector', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      svg.appendChild(g);
      document.body.appendChild(svg);

      // Text node inside non-matching SVG element
      const textNode = document.createTextNode('svg text');
      // In jsdom, append to foreignObject or use element textContent
      g.appendChild(document.createTextNode('svg text'));
      expect(findClosestTextContainer(textNode)).toBeNull();
    });

    it('covers multiple allowed tags in the selector (a, blockquote, dd, dt, pre, article, section)', () => {
      const tags = ['a', 'blockquote', 'dd', 'dt', 'pre', 'article', 'section'] as const;
      tags.forEach(tag => {
        const el = document.createElement(tag);
        el.textContent = `Tag ${tag}`;
        const inner = document.createElement('span');
        inner.textContent = 'Inner';
        el.appendChild(inner);
        document.body.appendChild(el);

        expect(findClosestTextContainer(inner)).toBe(el);
      });
    });

    it('never returns non-HTMLElement nodes (e.g., DocumentFragment)', () => {
      const frag = document.createDocumentFragment();
      const div = document.createElement('div');
      frag.appendChild(div);
      // Not attached to document; closest should still be an HTMLElement if matched
      expect(findClosestTextContainer(div)).toBe(div);
    });
  });

  describe('extractReadableText', () => {
    it('returns empty string for null elements', () => {
      expect(extractReadableText(null)).toBe('');
    });

    it('uses innerText when available and trims/normalizes whitespace', () => {
      const div = document.createElement('div');
      div.textContent = '  Hello   \n  world\t!';
      document.body.appendChild(div);
      // jsdom innerText approximates textContent; regardless we normalize
      expect(extractReadableText(div)).toBe('Hello world !');
    });

    it('falls back to textContent and normalizes whitespace', () => {
      const pre = document.createElement('pre');
      pre.textContent = '\nLine1\n   Line2\t\tLine3  ';
      document.body.appendChild(pre);
      expect(extractReadableText(pre)).toBe('Line1 Line2 Line3');
    });

    it('returns empty string for elements with no text', () => {
      const section = document.createElement('section');
      document.body.appendChild(section);
      expect(extractReadableText(section)).toBe('');
    });

    it('strips leading/trailing spaces after normalization', () => {
      const p = document.createElement('p');
      p.textContent = '   lots   of   space   ';
      document.body.appendChild(p);
      expect(extractReadableText(p)).toBe('lots of space');
    });
  });

  describe('isParagraphLike', () => {
    it('rejects falsy or empty strings', () => {
      expect(isParagraphLike('')).toBe(false);
      // @ts-expect-error Intentional incorrect type to check runtime behavior
      expect(isParagraphLike(undefined)).toBe(false as any);
      // @ts-expect-error
      expect(isParagraphLike(null)).toBe(false as any);
    });

    it('rejects strings shorter than 2 characters', () => {
      expect(isParagraphLike('a')).toBe(false);
    });

    it('accepts typical paragraph-sized text', () => {
      expect(isParagraphLike('Hi')).toBe(true);
      expect(isParagraphLike('This is a short paragraph.')).toBe(true);
    });

    it('rejects extremely long text (> 5000 chars) to reduce noise', () => {
      const long = 'x'.repeat(5001);
      expect(isParagraphLike(long)).toBe(false);
      const boundary = 'x'.repeat(5000);
      expect(isParagraphLike(boundary)).toBe(true);
    });
  });

  describe('integration-style checks', () => {
    it('combines the utilities to identify and extract valid paragraph-like text', () => {
      const article = document.createElement('article');
      const span = document.createElement('span');
      span.textContent = '  A  readable   sentence. ';
      article.appendChild(span);
      document.body.appendChild(article);

      const container = findClosestTextContainer(span);
      const text = extractReadableText(container);
      expect(container).toBe(article);
      expect(text).toBe('A readable sentence.');
      expect(isParagraphLike(text)).toBe(true);
    });

    it('handles noisy whitespace and ensures non-paragraphs are filtered out', () => {
      const div = document.createElement('div');
      div.textContent = ' ';
      document.body.appendChild(div);
      const text = extractReadableText(div);
      expect(text).toBe('');
      expect(isParagraphLike(text)).toBe(false);
    });
  });
});