import { createShadowRootUi, defineContentScript, type ShadowRootContentScriptUi } from '#imports';
import type { AgentContext } from '@/agent/types';
import '@/assets/base.css';
import ParaCard, { type ParaCardProps } from '@/components/ParaCard.vue';
import { sendMessage } from '@/messaging';
import { createLogger } from '@/utils/logger';
import { extractReadableText, findClosestTextContainer, isParagraphLike } from '@/utils/paragraph';
import { createApp, h, shallowReactive, type App } from 'vue';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  main(ctx) {
    const logger = createLogger('content');

    // Component factory for creating reusable ParaCard instances
    // Note: Each call still creates a new Vue app instance, but reuses the ParaCard component definition
    const createParaCardApp = (state: ParaCardProps): App => {
      return createApp({
        components: {
          ParaCard, // Same ParaCard definition reused across all instances
        },
        setup() {
          return () => h(ParaCard, state);
        },
      });
    };

    const addParaCard = async (container: Element, initial: Partial<ParaCardProps> = {}) => {
      const state = shallowReactive<ParaCardProps>({
        sourceText: initial.sourceText,
        loading: initial.loading ?? true,
        result: initial.result,
        error: initial.error,
      });

      const ui = await createShadowRootUi(ctx, {
        name: 'para-card-ui',
        position: 'inline',
        anchor: container,
        onMount: (mountContainer, shadow) => {
          // Create a ParaCard app instance using the factory
          const app = createParaCardApp(state);
          app.mount(mountContainer);

          // Store the app instance for later cleanup
          uiAppMap.set(ui as ShadowRootContentScriptUi<App>, app);

          // Debug CSS injection
          logger.debug`mounted para card ${{
            containerTag: mountContainer.tagName,
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
          if (app && typeof app.unmount === 'function') {
            app.unmount();
          }
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

    // WeakMap to associate UI instances with their Vue app instances for cleanup
    const uiAppMap = new WeakMap<ShadowRootContentScriptUi<App>, App>();

    /**
     * Centralized cleanup function for translation cards to prevent race conditions
     * @param paraKey - The unique identifier for the paragraph card
     * @param removeUI - Whether to remove the UI component (default: true)
     */
    const cleanupTranslationCard = (paraKey: string, removeUI = true) => {
      const cardEntry = cardUIs.get(paraKey);
      if (!cardEntry) {
        logger.debug`no card found for cleanup: ${paraKey}`;
        return;
      }

      const { ui, container } = cardEntry;

      // Remove UI if requested and available
      if (removeUI && ui && typeof ui.remove === 'function') {
        try {
          // Get the app instance from WeakMap and unmount it properly
          const app = uiAppMap.get(ui);
          if (app && typeof app.unmount === 'function') {
            app.unmount();
            uiAppMap.delete(ui);
            logger.debug`unmounted Vue app for ${paraKey}`;
          }

          ui.remove();
          logger.debug`removed translation card UI for ${paraKey}`;
        } catch (error) {
          logger.error`failed to remove translation card UI for ${paraKey}: ${error}`;
        }
      }

      // Remove from map
      cardUIs.delete(paraKey);

      // Clean up dataset attributes
      if (container) {
        delete container.dataset.paraIsTranslated;
        delete container.dataset.paraId;
        logger.debug`cleaned up dataset for ${paraKey}`;
      }
    };

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
      const paraKey = container.dataset.paraId || crypto.randomUUID();

      // Check if card already exists - toggle logic
      if (cardUIs.has(paraKey)) {
        // Remove existing card using centralized cleanup
        cleanupTranslationCard(paraKey);
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
          const response = await sendMessage('agent', {context, taskType: 'explain'});
          logger.debug`translated result ${response}`;

          // Check if card is still active before applying results to avoid stale data
          if (!cardUIs.has(paraKey)) {
            logger.debug`card for ${paraKey} was removed during async operation, skipping result application`;
            return;
          }

          state.result = response.data;
          state.error = response.error;

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
        // Clean up using centralized function (without UI removal since UI wasn't created)
        cleanupTranslationCard(paraKey, false);
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
