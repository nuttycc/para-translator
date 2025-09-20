import { createIntegratedUi } from '#imports';
import { createPinia, setActivePinia } from 'pinia';
import { createApp, h, reactive, toRaw, watch } from 'vue';

import paraCardCSS from '@/assets/ParaCard.css?inline';
import ParaCard from '@/components/ParaCard.vue';
import { useParaHistoryStore } from '@/stores';
import { createLogger } from '@/utils/logger';

import type { ParaCardProps } from '@/components/ParaCard.vue';
import type { ContentScriptContext, IntegratedContentScriptUi } from '#imports';
import type { App } from 'vue';

const logger = createLogger('ui-manager');

// Single shared Pinia instance for all card apps
const sharedPinia = createPinia();
// Activate Pinia before any store is used outside Vue components
setActivePinia(sharedPinia);

// Reuse a single history store instance
const history = useParaHistoryStore();

/**
 * Maps each UI handle to its Vue `App` for proper teardown.
 * WeakMap enables garbage collection when a UI is removed.
 */
export const uiAppMap = new WeakMap<
  IntegratedContentScriptUi<{ app: App; styleEl: HTMLStyleElement }>,
  App
>();

/**
 * Tracks watcher/side-effect stop functions per UI for cleanup
 * when a card is removed.
 */
const uiCleanupMap = new WeakMap<
  IntegratedContentScriptUi<{ app: App; styleEl: HTMLStyleElement }>,
  Array<() => void>
>();

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

export const addParaCard = async (
  ctx: ContentScriptContext,
  container: Element
): Promise<{
  ui: IntegratedContentScriptUi<{ app: App; styleEl: HTMLStyleElement }>;
  state: ParaCardProps;
}> => {
  const state = reactive<ParaCardProps>(createInitialParaCardState());

  const cleanupHandles: Array<() => void> = [];

  const stopHistoryWatcher = watch([() => state.translation, () => state.explanation], async () => {
    await history.upsert(toRaw(state));
  });
  cleanupHandles.push(stopHistoryWatcher);

  const ui = createIntegratedUi(ctx, {
    position: 'inline',
    anchor: container,
    onMount: (mountContainer: HTMLElement) => {
      // const theme = getPreferredTheme();
      // mountContainer.setAttribute('data-theme', theme);

      const styleEl = document.createElement('style');
      styleEl.id = `para-card-style-${state.id}`;
      styleEl.textContent = paraCardCSS;
      document.head.appendChild(styleEl);

      const app = createParaCardApp(state);
      app.use(sharedPinia);
      app.mount(mountContainer);

      uiAppMap.set(ui, app);

      logger.debug`mounted para card ${{
        containerTag: mountContainer.tagName,
        isConnected: mountContainer.isConnected,
      }}`;

      return { app, styleEl };
    },
    onRemove: (mounted: { app: App; styleEl: HTMLStyleElement } | undefined) => {
      if (!mounted) return;

      const { app, styleEl } = mounted;
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
      if (styleEl && styleEl.parentNode) {
        styleEl.remove();
      }
      uiAppMap.delete(ui);
    },
  });

  uiCleanupMap.set(ui, cleanupHandles);

  ui.mount();

  return { ui, state };
};
