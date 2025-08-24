import { sendMessage } from '@/messaging';
import { createLogger } from '@/utils/logger';
import { extractReadableText, findClosestTextContainer, isParagraphLike } from '@/utils/paragraph';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    const logger = createLogger('content');

    // Feature: Hover + Shift to translate nearest paragraph
    let lastHoverEl: HTMLElement | null = null;
    let lastHoverText: string | null = null;
    let lastTriggeredText: string | null = null;

    const triggerTranslateIfEligible = async () => {
      if (!isParagraphLike(lastHoverText || '')) return;
      if (!lastHoverText) return;
      if (lastHoverText === lastTriggeredText) return;
      lastTriggeredText = lastHoverText;

      const result = await sendMessage('translate', {
        sourceText: lastHoverText,
        targetLanguage: 'zh-CN',
      });
      logger.debug('translated result', { result });
    };

    const handleMouseMove = (ev: MouseEvent) => {
      const container = findClosestTextContainer(ev.target);
      if (container !== lastHoverEl) {
        lastHoverEl = container;
        lastHoverText = extractReadableText(container);
      }
      if (ev.shiftKey) {
        triggerTranslateIfEligible();
      }
    };

    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Shift') {
        triggerTranslateIfEligible();
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('keydown', handleKeyDown, { passive: true } as AddEventListenerOptions);
  },
});
