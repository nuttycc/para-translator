import {
  createShadowRootUi,
  type ContentScriptContext,
  type ShadowRootContentScriptUi,
} from '#imports';

import { createApp, h, shallowReactive, type App } from 'vue';

import ParaCard, { type ParaCardProps } from '@/components/ParaCard.vue';
import { createLogger } from '@/utils/logger';

const logger = createLogger('ui-manager');

/**
 * Associates each UI handle with its Vue `App` instance, enabling
 * proper unmount during cleanup. Uses WeakMap so GC can reclaim entries.
 */
export const uiAppMap = new WeakMap<ShadowRootContentScriptUi<App>, App>();

/**
 * Factory that creates a Vue app instance rendering a `ParaCard`.
 * Uses the provided reactive `state` so external code can update the card
 * (e.g., finish loading, set result, or set error).
 *
 * @param state - Reactive state passed as props to `ParaCard`.
 * @returns The mounted (yet not attached) Vue `App` instance.
 */
export const createParaCardApp = (state: ParaCardProps): App =>
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
 * @param ctx - Content script context from WXT
 * @param container - Element that visually anchors the card inline.
 * @param initial - Optional initial state (e.g., `sourceText`, `loading`).
 * @returns A tuple with the mounted UI handle and the reactive state used by the card.
 *
 * @remarks
 * - The returned `state` object is meant to be mutated by the caller.
 * - The UI is mounted immediately; cleanup is handled elsewhere.
 */
export const addParaCard = async (
  ctx: ContentScriptContext,
  container: Element,
  initial: Partial<ParaCardProps> = {}
) => {
  const state = shallowReactive<ParaCardProps>({
    sourceText: initial.sourceText,
    loading: initial.loading ?? true,
    result: initial.result,
    error: initial.error,
  });

  const ui = await createShadowRootUi(ctx, {
    name: 'para-card-ui',
    position: 'inline',
    inheritStyles: false,
    anchor: container,
    onMount: (mountContainer, shadow) => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      mountContainer.setAttribute('data-theme', prefersDark ? 'dark' : 'light');

      const app = createParaCardApp(state);
      app.mount(mountContainer);

      // Track the Vue app for later unmount on removal
      uiAppMap.set(ui, app);

      logger.debug`mounted para card ${{
        containerTag: mountContainer.tagName,
        shadowRoot: shadow,
        shadowStyleSheets: shadow.styleSheets,
        shadowHead: shadow.querySelector('head'),
        shadowBody: shadow.querySelector('body'),
      }}`;

      return app;
    },
    onRemove: (app) => {
      if (app && typeof app.unmount === 'function') {
        app.unmount();
      }
      // Clean up the app reference from the map
      uiAppMap.delete(ui);
    },
  });

  ui.mount();

  return { ui, state };
};
