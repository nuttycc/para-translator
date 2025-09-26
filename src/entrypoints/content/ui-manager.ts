import { createIntegratedUi } from '#imports';
import { createPinia, setActivePinia } from 'pinia';
import { createApp, h, reactive } from 'vue';

import paraCardCSS from '@/assets/ParaCard.css?inline';
import ParaCard from '@/components/ParaCard.vue';
import { createLogger } from '@/utils/logger';

import type { ParaCardProps } from '@/components/ParaCard.vue';
import type { ContentScriptContext, IntegratedContentScriptUi } from '#imports';
import type { App } from 'vue';

import { contentStore } from './content-utils';

const logger = createLogger('ui-manager');

let sharedStyleEl: HTMLStyleElement | null = null;
let sharedStyleRefCount = 0;

const ensureSharedStyleElement = (): { styleEl: HTMLStyleElement } => {
  if (sharedStyleEl && document.head.contains(sharedStyleEl)) {
    return { styleEl: sharedStyleEl };
  }

  const styleEl = document.createElement('style');
  styleEl.id = 'para-card-style';

  styleEl.textContent = contentStore?.paraCardCSS ?? paraCardCSS;

  document.head.appendChild(styleEl);
  sharedStyleEl = styleEl;
  return { styleEl };
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
  const { styleEl } = ensureSharedStyleElement();
  sharedStyleRefCount += 1;

  const app = createParaCardApp(state);
  app.use(sharedPinia);
  app.mount(mountContainer);

  uiAppMap.set(ui, app);

  logger.debug`mounted para card ${{
    containerTag: mountContainer.tagName,
    isConnected: mountContainer.isConnected,
  }}`;

  return { app, styleEl };
};

const cleanupParaCard = (
  ui: IntegratedContentScriptUi<{ app: App; styleEl: HTMLStyleElement }>,
  mounted: { app: App; styleEl: HTMLStyleElement } | undefined
) => {
  if (!mounted) return;

  const { app } = mounted;

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

  const ui: IntegratedContentScriptUi<{ app: App; styleEl: HTMLStyleElement }> = createIntegratedUi(
    ctx,
    {
      position: 'inline',
      anchor: container,
      onMount: (mountContainer: HTMLElement) => mountParaCard(ui, state, mountContainer),
      onRemove: (mounted) => {
        cleanupParaCard(ui, mounted);
      },
    }
  );

  uiCleanupMap.set(ui, cleanupHandles);
  ui.mount();

  return { ui, state };
};
