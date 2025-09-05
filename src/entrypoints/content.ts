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

  /**
   * Entry point for the content script.
   * Sets up hover/key listeners and manages the lifecycle of in-page
   * translation cards rendered inside a ShadowRoot.
   *
   * @param ctx - Runtime context provided by the extension framework.
   */
  main(ctx) {
    const logger = createLogger('content');

    /**
     * Factory that creates a Vue app instance rendering a `ParaCard`.
     * Uses the provided reactive `state` so external code can update the card
     * (e.g., finish loading, set result, or set error).
     *
     * @param state - Reactive state passed as props to `ParaCard`.
     * @returns The mounted (yet not attached) Vue `App` instance.
     */
    const createParaCardApp = (state: ParaCardProps): App =>
      createApp({
        components: {
          ParaCard,
        },
        setup() {
          return () => h(ParaCard, state);
        },
      });

    /**
     * Creates and mounts a ParaCard UI next to a text container.
     * The UI is rendered inside a ShadowRoot to isolate styles and uses a dark theme.
     *
     * @param container - Element that visually anchors the card inline.
     * @param initial - Optional initial state (e.g., `sourceText`, `loading`).
     * @returns A tuple with the mounted UI handle and the reactive state used by the card.
     *
     * @remarks
     * - The returned `state` object is meant to be mutated by the caller.
     * - The UI is mounted immediately; cleanup is handled elsewhere.
     */
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
          // Force dark theme for DaisyUI components in ShadowRoot
          mountContainer.setAttribute('data-theme', 'dark');

          const app = createParaCardApp(state);
          app.mount(mountContainer);

          // Track the Vue app for later unmount on removal
          uiAppMap.set(ui, app);

          logger.debug`mounted para card ${{
            containerTag: mountContainer.tagName,
            shadowRoot: shadow,
            shadowStyleSheets: shadow.styleSheets?.length,
            shadowHead: shadow.querySelector('head'),
            shadowBody: shadow.querySelector('body'),
          }}`;

          if (shadow.styleSheets) {
            [...shadow.styleSheets].forEach((sheet, index) => {
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

      // Make the UI visible in the page
      ui.mount();

      return { ui, state };
    };

    // --- Hover/Toggle feature state ---

    /**
     * Currently hovered element (used to find its closest text container).
     * Cleared when the pointer leaves the paragraph region.
     */
    let currentHoveredElement: HTMLElement | null = null;

    /**
     * Active cards indexed by a stable paragraph key. Each entry stores:
     * - `ui`: the ShadowRoot UI handle
     * - `container`: the host element
     * - `state`: the reactive ParaCard props to mutate as results arrive
     */
    let cardUIs = new Map<
      string,
      { ui: ShadowRootContentScriptUi<App>; container: HTMLElement; state: ParaCardProps }
    >();

    /**
     * Associates each UI handle with its Vue `App` instance, enabling
     * proper unmount during cleanup. Uses WeakMap so GC can reclaim entries.
     */
    const uiAppMap = new WeakMap<ShadowRootContentScriptUi<App>, App>();

    /**
     * Removes a translation card and cleans its associated resources safely.
     *
     * @param paraKey - Unique identifier for the paragraph/card.
     * @param removeUI - When true (default), also detach and unmount the UI.
     *
     * @remarks
     * - Idempotent: safe to call multiple times; exits if nothing to clean.
     * - Also clears `data-para-*` flags from the host container.
     */
    const cleanupTranslationCard = (paraKey: string, removeUI = true) => {
      const cardEntry = cardUIs.get(paraKey);
      if (!cardEntry) {
        logger.debug`no card found for cleanup: ${paraKey}`;
        return;
      }

      const { ui, container } = cardEntry;

      if (removeUI && ui && typeof ui.remove === 'function') {
        try {
          // Unmount the Vue app if we have it recorded
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

      cardUIs.delete(paraKey);

      if (container) {
        delete container.dataset.paraIsTranslated;
        delete container.dataset.paraId;
        logger.debug`cleaned up dataset for ${paraKey}`;
      }
    };

    /**
     * If the current hover target is a paragraph-like container, toggles
     * a translation card in place:
     * - If a card exists for that paragraph, it is removed.
     * - If not, a loading card is added and an async translation is requested.
     *
     * @remarks
     * - Guards against stale async results by checking `cardUIs` before applying updates.
     * - Stores the paragraph key in `data-para-id` to keep toggling stable.
     */
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

      // Stable paragraph key (persisted on the container once created)
      const paraKey = container.dataset.paraId || crypto.randomUUID();

      // Toggle behavior: remove if exists, otherwise create and load
      if (cardUIs.has(paraKey)) {
        cleanupTranslationCard(paraKey);
        return;
      }

      try {
        // 1) Create/loading UI
        const { ui, state } = await addParaCard(container, { sourceText, loading: true });

        if (ui && typeof ui.remove === 'function') {
          cardUIs.set(paraKey, { ui, container, state });
          logger.debug`added translation card for ${paraKey}`;
        } else {
          logger.error`failed to create valid UI for ${paraKey}`;
          return;
        }

        // 2) Request translation/explanation from the agent
        try {
          const context: AgentContext = {
            sourceText,
            targetLanguage: 'zh-CN',
            siteTitle: document.title,
            siteUrl: document.location.href,
          };
          logger.debug`context ${{ context }}`;

          const response = await sendMessage('agent', { context, taskType: 'explain' });
          logger.debug`translated result ${response}`;

          // Ignore late results if the card was removed
          if (!cardUIs.has(paraKey)) {
            logger.debug`card for ${paraKey} was removed during async operation, skipping result application`;
            return;
          }

          state.result = response.data;
          state.error = response.error;

          // Persist identity on the container for stable toggling
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
        // UI may not exist yet, skip removing
        cleanupTranslationCard(paraKey, false);
      }
    };

    /**
     * Tracks the hovered element if it belongs to a paragraph-like container.
     * Lightweight gate to avoid expensive work for non-paragraph nodes.
     *
     * @param ev - Mouse event bubbling from the document.
     */
    const handleMouseOver = (ev: MouseEvent) => {
      const container = findClosestTextContainer(ev.target);
      if (
        container &&
        isParagraphLike(extractReadableText(container)) &&
        ev.target instanceof HTMLElement
      ) {
        currentHoveredElement = ev.target;
        // logger.debug`hovering over paragraph-like element`;
      }
    };

    /**
     * Clears the `currentHoveredElement` when leaving the paragraph region.
     * Prevents accidental toggles outside of the intended text block.
     *
     * @param ev - Mouse event bubbling from the document.
     */
    const handleMouseOut = (ev: MouseEvent) => {
      const container = findClosestTextContainer(ev.target);
      if (container && currentHoveredElement) {
        const relatedContainer = findClosestTextContainer(ev.relatedTarget);
        if (!relatedContainer || relatedContainer !== container) {
          currentHoveredElement = null;
          // logger.debug`left paragraph area`;
        }
      }
    };

    /**
     * Global keydown handler for the toggle gesture.
     * Pressing **Shift** toggles the translation card for the currently hovered paragraph.
     *
     * @param ev - Keyboard event; only acts on non-repeated Shift key presses.
     */
    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Shift' && !ev.repeat) {
        void toggleTranslateIfEligible();
      }
    };

    // --- Event subscriptions (passive for perf) ---
    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mouseout', handleMouseOut, { passive: true });
    globalThis.addEventListener('keydown', handleKeyDown, { passive: true });
  },
});
