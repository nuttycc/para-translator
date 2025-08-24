import { sendMessage } from '@/messaging';
import { createLogger } from '@/utils/logger';
import { extractReadableText, findClosestTextContainer, isParagraphLike } from '@/utils/paragraph';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    const logger = createLogger('content');

    // Feature: Press Shift to translate paragraph under cursor
    let lastPointerX = 0;
    let lastPointerY = 0;
    let lastTriggeredText: string | null = null;

    const triggerTranslateIfEligible = async () => {
      const el = document.elementFromPoint(lastPointerX, lastPointerY);
      logger.debug`keydown@Shift elementFromPoint ${{
        x: lastPointerX,
        y: lastPointerY,
        elTag: el instanceof Element ? el.tagName : null,
        elId: el instanceof Element ? (el as Element).id || null : null,
      }}`;
      const container = findClosestTextContainer(el);
      logger.debug`closest text container ${{
        containerTag: container ? container.tagName : null,
        containerId: container ? container.id || null : null,
      }}`;
      const text = extractReadableText(container);
      logger.debug`extracted text meta ${{ length: text.length, preview: text.slice(0, 80) }}`;

      if (!isParagraphLike(text)) {
        logger.debug('skip: not paragraph-like');
        return;
      }
      if (text === lastTriggeredText) {
        logger.debug('skip: duplicate text');
        return;
      }
      lastTriggeredText = text;

      const result = await sendMessage('translate', {
        sourceText: text,
        targetLanguage: 'zh-CN',
      });
      logger.debug`translated result ${result}`;
    };

    const handlePointerMove = (ev: PointerEvent) => {
      lastPointerX = ev.clientX;
      lastPointerY = ev.clientY;
    };

    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Shift') {
        triggerTranslateIfEligible();
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('keydown', handleKeyDown, { passive: true });
  },
});
