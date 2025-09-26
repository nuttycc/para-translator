
export function findClosestTextContainer(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Node)) return null;
  let element = target instanceof Element ? target : target.parentElement;
  if (!element || !(element instanceof HTMLElement)) return null;

  // 从当前元素开始向上查找最佳容器
  let current: HTMLElement | null = element;
  let bestCandidate: HTMLElement | null = null;
  let bestScore = 0;

  // 最多向上遍历10层，避免性能问题
  for (let i = 0; i < 10 && current; i++) {
    const text = extractReadableText(current);

    if (text.length >= 2) {
      // 计算文本质量分数
      const score = calculateTextScore(text, current);

      if (score > bestScore) {
        bestScore = score;
        bestCandidate = current;
      }

      // 如果找到高质量文本，提前停止
      if (score >= 80) break;
    }

    current = current.parentElement;
  }

  return bestCandidate;
}

/**
 * 计算文本质量分数
 * 综合考虑文本长度、句子结构、单词密度和元素类型
 */
function calculateTextScore(text: string, element: HTMLElement): number {
  let score = 0;

  // 基础长度分数 (0-40分)
  const length = text.length;
  if (length >= 500) score += 80;
  else if (length >= 100) score += 40;
  else if (length >= 50) score += 20;
  else if (length >= 20) score += 10;

  // 句子结构分数 (0-30分)
  const sentences = text.split(/[.!?。！？]/).filter(s => s.trim().length > 0);
  if (sentences.length >= 3) score += 20;
  else if (sentences.length >= 2) score += 10;
  else if (sentences.length >= 1) score += 5;

  // 元素类型加分 (0-10分)
  const tagName = element.tagName.toLowerCase();
  if (['p', 'div', 'article', 'section', 'li'].includes(tagName)) score += 80;
  else if (['span', 'a'].includes(tagName)) score += 10;

  return Math.min(score, 100);
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
