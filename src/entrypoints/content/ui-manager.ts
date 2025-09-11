import {
  createShadowRootUi,
  type ContentScriptContext,
  type ShadowRootContentScriptUi,
} from '#imports';

import { createPinia, setActivePinia } from 'pinia';
import { createApp, h, reactive, toRaw, watch, type App } from 'vue';

import ParaCard, { type ParaCardProps } from '@/components/ParaCard.vue';
import { useHistoryStore } from '@/stores/history';
import { createLogger } from '@/utils/logger';

const logger = createLogger('ui-manager');

const getPreferredTheme = (): 'dark' | 'light' => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Single shared Pinia instance for all card apps
const sharedPinia = createPinia();
// Activate Pinia before any store is used outside Vue components
setActivePinia(sharedPinia);

// Reuse a single history store instance
const history = useHistoryStore();

/**
 * Maps each UI handle to its Vue `App` for proper teardown.
 * WeakMap enables garbage collection when a UI is removed.
 */
export const uiAppMap = new WeakMap<ShadowRootContentScriptUi<App>, App>();

/**
 * Tracks watcher/side-effect stop functions per UI for cleanup
 * when a card is removed.
 */
const uiCleanupMap = new WeakMap<ShadowRootContentScriptUi<App>, Array<() => void>>();

/**
 * Produces a fresh initial state for a `ParaCard`.
 * Centralizes defaults to keep them auditable.
 */
const createInitialParaCardState = (): ParaCardProps => ({
  id: crypto.randomUUID(),
  timestamp: Date.now(),
  context: {
    sourceText: '',
    sourceLanguage: '',
    targetLanguage: '',
    siteTitle: '',
    siteUrl: '',
    siteDescription: '',
  },
  sourceText: '',
  translation: '',
  explanation: '',
});

/**
 * Creates a Vue app that renders a ParaCard component.
 *
 * @param state - Reactive state passed as props to the ParaCard.
 * @returns The created Vue app instance (not yet mounted).
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
 * Creates and mounts a ParaCard UI near a text container.
 * Uses ShadowRoot for style isolation and system theme detection.
 *
 * @param ctx - Content script context from WXT.
 * @param container - Element that anchors the inline card.
 * @returns The mounted UI handle and its reactive state.
 *
 * @remarks The returned state is mutable for external updates.
 */
export const addParaCard = async (
  ctx: ContentScriptContext,
  container: Element
): Promise<{ ui: ShadowRootContentScriptUi<App>; state: ParaCardProps }> => {
  const state = reactive<ParaCardProps>(createInitialParaCardState());

  const cleanupHandles: Array<() => void> = [];

  const stopHistoryWatcher = watch([() => state.translation, () => state.explanation], async () => {
    await history.upsert(toRaw(state));
  });
  cleanupHandles.push(stopHistoryWatcher);

  const ui = await createShadowRootUi(ctx, {
    name: 'para-card-ui',
    position: 'inline',
    inheritStyles: false,
    anchor: container,
    onMount: (mountContainer, shadow) => {
      const theme = getPreferredTheme();
      mountContainer.setAttribute('data-theme', theme);

      const app = createParaCardApp(state);
      app.use(sharedPinia);
      app.mount(mountContainer);

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
      const handles = uiCleanupMap.get(ui);
      if (handles && Array.isArray(handles)) {
        for (const stop of handles) {
          stop();
        }
      }
      uiCleanupMap.delete(ui);
      if (app && typeof app.unmount === 'function') {
        app.unmount();
      }
      uiAppMap.delete(ui);
    },
  });

  uiCleanupMap.set(ui, cleanupHandles);

  ui.mount();

  return { ui, state };
};
