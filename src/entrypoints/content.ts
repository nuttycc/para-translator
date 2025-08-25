import '@/assets/base.css';
import ParaCard, { type ParaCardProps } from '@/components/ParaCard.vue';
import { sendMessage } from '@/messaging';
import { createLogger } from '@/utils/logger';
import { extractReadableText, findClosestTextContainer, isParagraphLike } from '@/utils/paragraph';
import { createApp, type App } from 'vue';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  main(ctx) {
    const logger = createLogger('content');

    const addParaCard = async (container: Element, props: ParaCardProps) => {
      const ui = await createShadowRootUi(ctx, {
        name: 'para-card-ui',
        position: 'inline',
        anchor: container,
        onMount: (container, shadow) => {
          // Define how your UI will be mounted inside the container
          const app = createApp(ParaCard, props);
          app.mount(container);

          // Debug CSS injection
          logger.debug`mounted para card ${{
            containerTag: container.tagName,
            shadowRoot: shadow,
            shadowStyleSheets: shadow.styleSheets?.length,
            shadowHead: shadow.querySelector('head'),
            shadowBody: shadow.querySelector('body'),
          }}`;

          // Check if CSS is injected
          if (shadow.styleSheets) {
            Array.from(shadow.styleSheets).forEach((sheet, index) => {
              logger.debug`shadow stylesheet ${index}: ${sheet.href || 'inline'}`;
            });
          }

          return app;
        },
        onRemove: (app) => {
          // Unmount the app when the UI is removed
          app?.unmount();
        },
      });

      // Mount the UI to make it visible
      ui.mount();

      // Return the UI instance for later management
      return ui;
    };

    // Feature: Hover paragraph + Shift to toggle translation card
    let currentHoveredElement: HTMLElement | null = null;
    let cardUIs = new Map<string, { ui: ShadowRootContentScriptUi<App>; container: HTMLElement }>();

    const toggleTranslateIfEligible = async () => {
      if (!currentHoveredElement) {
        logger.debug('skip: no element currently hovered');
        return;
      }

      const container = findClosestTextContainer(currentHoveredElement);
      if (!container) {
        logger.debug('skip: no container found');
        return;
      }

      logger.debug`hovered text container ${{
        containerTag: container.tagName,
        containerId: container.id || null,
      }}`;

      const text = extractReadableText(container);
      logger.debug`extracted text meta ${{ length: text.length, preview: text.slice(0, 80) }}`;

      if (!isParagraphLike(text)) {
        logger.debug('skip: not paragraph-like');
        return;
      }

      // Generate unique key for this paragraph
      const paraKey = container.dataset.paraId || text.slice(0, 100);

      // Check if card already exists - toggle logic
      if (cardUIs.has(paraKey)) {
        // Remove existing card
        const existingCard = cardUIs.get(paraKey);
        if (existingCard && existingCard.ui && typeof existingCard.ui.remove === 'function') {
          try {
            existingCard.ui.remove();
            logger.debug`removed translation card for ${paraKey}`;
          } catch (error) {
            logger.error`failed to remove translation card for ${paraKey}: ${error}`;
          }
          cardUIs.delete(paraKey);
          // Clean up dataset
          delete container.dataset.paraIsTranslated;
          delete container.dataset.paraId;
        } else {
          logger.warn`existing card for ${paraKey} is invalid, cleaning up`;
          cardUIs.delete(paraKey);
        }
        return;
      }

      // Add new card
      const result = await sendMessage('translate', {
        sourceText: text,
        targetLanguage: 'zh-CN',
      });
      logger.debug`translated result ${result}`;

      // Mark container as translated
      container.dataset.paraIsTranslated = 'true';
      container.dataset.paraId = paraKey;

      try {
        const ui = await addParaCard(container, {
          text,
          loading: false,
          result: result.data || '',
          error: result.error || null,
        });

        // Store the UI instance for later removal
        if (ui && typeof ui.remove === 'function') {
          cardUIs.set(paraKey, { ui, container });
          logger.debug`added translation card for ${paraKey}`;
        } else {
          logger.error`failed to create valid UI for ${paraKey}`;
          // Clean up dataset if UI creation failed
          delete container.dataset.paraIsTranslated;
          delete container.dataset.paraId;
        }
      } catch (error) {
        logger.error`failed to add translation card for ${paraKey}: ${error}`;
        // Clean up dataset if card creation failed
        delete container.dataset.paraIsTranslated;
        delete container.dataset.paraId;
      }
    };

    const handleMouseOver = (ev: MouseEvent) => {
      const container = findClosestTextContainer(ev.target);
      if (container && isParagraphLike(extractReadableText(container))) {
        currentHoveredElement = ev.target as HTMLElement;
        // logger.debug`hovering over paragraph-like element`;
      }
    };

    const handleMouseOut = (ev: MouseEvent) => {
      // Only clear if mouse leaves the paragraph area
      const container = findClosestTextContainer(ev.target);
      if (container && currentHoveredElement) {
        const relatedContainer = findClosestTextContainer(ev.relatedTarget);
        if (!relatedContainer || relatedContainer !== container) {
          currentHoveredElement = null;
          // logger.debug`left paragraph area`;
        }
      }
    };

    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Shift' && !ev.repeat) {
        void toggleTranslateIfEligible();
      }
    };

    // Add hover event listeners to document
    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mouseout', handleMouseOut, { passive: true });
    window.addEventListener('keydown', handleKeyDown, { passive: true });
  },
});
