import type { AgentContext } from '@/agent/types';
import '@/assets/base.css';
import ParaCard, { type ParaCardProps } from '@/components/ParaCard.vue';
import { sendMessage } from '@/messaging';
import { createLogger } from '@/utils/logger';
import { extractReadableText, findClosestTextContainer, isParagraphLike } from '@/utils/paragraph';
import { createApp, type App, shallowReactive, h } from 'vue';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  main(ctx) {
    const logger = createLogger('content');

    const addParaCard = async (container: Element, initial: Partial<ParaCardProps> = {}) => {
      const state = shallowReactive<ParaCardProps>({
        sourceText: initial.sourceText ?? '',
        loading: initial.loading ?? true,
        translatedText: initial.translatedText ?? '',
        error: initial.error ?? null,
      });

      const ui = await createShadowRootUi(ctx, {
        name: 'para-card-ui',
        position: 'inline',
        anchor: container,
        onMount: (container, shadow) => {
          // Define how your UI will be mounted inside the container
          const app = createApp({
            // Render ParaCard with reactive state to ensure updates propagate
            setup: () => () => h(ParaCard, state),
          });
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

      // Return both UI and reactive state for later updates
      return { ui, state };
    };

    // Feature: Hover paragraph + Shift to toggle translation card
    let currentHoveredElement: HTMLElement | null = null;
    let cardUIs = new Map<
      string,
      { ui: ShadowRootContentScriptUi<App>; container: HTMLElement; state: ParaCardProps }
    >();

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

      const sourceText = extractReadableText(container);
      logger.debug`extracted text meta ${{ length: sourceText.length, preview: sourceText.slice(0, 80) }}`;

      if (!isParagraphLike(sourceText)) {
        logger.debug('skip: not paragraph-like');
        return;
      }

      // Generate unique key for this paragraph
      const paraKey = container.dataset.paraId || sourceText.slice(0, 100);

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

      // Add new card (mount loading UI first)
      try {
        const { ui, state } = await addParaCard(container, { sourceText, loading: true });

        // Store for later removal/updates
        if (ui && typeof ui.remove === 'function') {
          cardUIs.set(paraKey, { ui, container, state });
          logger.debug`added translation card for ${paraKey}`;
        } else {
          logger.error`failed to create valid UI for ${paraKey}`;
          return;
        }

        // Fetch translation result and update reactive state
        try {
          const context: AgentContext = {
            sourceText,
            targetLanguage: 'zh-CN',
            siteTitle: document.title,
            siteUrl: document.location.href,
          };
          logger.debug`context ${{ context }}`;
          const response = await sendMessage('translate', context);
          logger.debug`translated result ${response}`;

          state.translatedText = response.data || '';
          state.error = response.error || null;

          // Mark container as translated
          container.dataset.paraIsTranslated = 'true';
          container.dataset.paraId = paraKey;
        } catch (err) {
          // Ensure UI exits loading and shows error
          state.error = err instanceof Error ? err.message : String(err);
        } finally {
          state.loading = false;
        }
      } catch (error) {
        logger.error`failed to add/update translation card for ${paraKey}: ${error}`;
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
