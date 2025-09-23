import { createIntegratedUi } from '#imports';
import { createPinia, setActivePinia } from 'pinia';
import { createApp, h, reactive } from 'vue';

import paraCardCSS from '@/assets/ParaCard.css?inline';
import ParaCard from '@/components/ParaCard.vue';
import { appearanceStorage } from '@/stores/appearance';
import { createLogger } from '@/utils/logger';

import type { ParaCardProps } from '@/components/ParaCard.vue';
import type { ContentScriptContext, IntegratedContentScriptUi } from '#imports';
import type { App } from 'vue';

const logger = createLogger('ui-manager');

let sharedStyleEl: HTMLStyleElement | null = null;
let sharedStyleRefCount = 0;

const ensureSharedStyleElement = (): { styleEl: HTMLStyleElement; unwatchStyle: () => void } => {
  if (sharedStyleEl && document.head.contains(sharedStyleEl)) {
    return { styleEl: sharedStyleEl, unwatchStyle: () => {} };
  }

  const styleEl = document.createElement('style');
  styleEl.id = 'para-card-style';

  appearanceStorage.getValue().then((newValue) => {
    styleEl.textContent = newValue?.paraCardCSS ?? paraCardCSS;
    return undefined;
  }).catch(() => {
    // Ignore errors during initial style setup
  });

  const unwatchStyle = appearanceStorage.watch((newValue) => {
    styleEl.textContent = newValue?.paraCardCSS ?? paraCardCSS;
  });

  document.head.appendChild(styleEl);
  sharedStyleEl = styleEl;
  return { styleEl, unwatchStyle };
};

const sharedPinia = createPinia();
setActivePinia(sharedPinia);

export const uiAppMap = new WeakMap<
  IntegratedContentScriptUi<{ app: App; styleEl: HTMLStyleElement }>,
  App
>();

const uiCleanupMap = new WeakMap<
  IntegratedContentScriptUi<{ app: App; styleEl: HTMLStyleElement }>,
  Array<() => void>
>();

const createInitialParaCardState = (): ParaCardProps => ({
  sourceText: '',
  translation: '',
  explanation: '',
});

export const createParaCardApp = (state: ParaCardProps): App =>
  createApp({
    components: {
      ParaCard,
    },
    setup() {
      return () => h(ParaCard, state);
    },
  });

const mountParaCard = (
  ui: IntegratedContentScriptUi<{ app: App; styleEl: HTMLStyleElement }>,
  state: ParaCardProps,
  mountContainer: HTMLElement
) => {
  const { styleEl, unwatchStyle } = ensureSharedStyleElement();
  sharedStyleRefCount += 1;

  const app = createParaCardApp(state);
  app.use(sharedPinia);
  app.mount(mountContainer);

  uiAppMap.set(ui, app);

  logger.debug`mounted para card ${{
    containerTag: mountContainer.tagName,
    isConnected: mountContainer.isConnected,
  }}`;

  return { app, styleEl, unwatchStyle };
};

const cleanupParaCard = (
  ui: IntegratedContentScriptUi<{ app: App; styleEl: HTMLStyleElement }>,
  mounted: { app: App; styleEl: HTMLStyleElement; unwatchStyle: () => void } | undefined
) => {
  if (!mounted) return;

  const { app, unwatchStyle } = mounted;

  const handles = uiCleanupMap.get(ui);
  if (handles) {
    handles.forEach((stop) => {
      stop();
    });
  }
  uiCleanupMap.delete(ui);

  app.unmount();

  if (sharedStyleRefCount > 0) {
    sharedStyleRefCount -= 1;
  }
  if (sharedStyleRefCount === 0 && sharedStyleEl) {
    unwatchStyle();
    sharedStyleEl.remove();
    sharedStyleEl = null;
  }
  uiAppMap.delete(ui);
};

export const addParaCard = async (
  ctx: ContentScriptContext,
  container: Element
): Promise<{
  ui: IntegratedContentScriptUi<{ app: App; styleEl: HTMLStyleElement }>;
  state: ParaCardProps;
}> => {
  const state = reactive<ParaCardProps>(createInitialParaCardState());
  const cleanupHandles: Array<() => void> = [];

  const ui: IntegratedContentScriptUi<{ app: App; styleEl: HTMLStyleElement }> = createIntegratedUi(ctx, {
    position: 'inline',
    anchor: container,
    onMount: (mountContainer: HTMLElement) => mountParaCard(ui, state, mountContainer),
    onRemove: (mounted) => {
      cleanupParaCard(ui, mounted);
    },
  });

  uiCleanupMap.set(ui, cleanupHandles);
  ui.mount();

  return { ui, state };
};
