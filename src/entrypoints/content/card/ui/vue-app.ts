import { createIntegratedUi } from '#imports';
import { createPinia, setActivePinia } from 'pinia';
import { createApp, h, reactive } from 'vue';

import { createLogger } from '@/utils/logger';

import { decrementStyleRefCount, ensureSharedStyleElement, incrementStyleRefCount } from './style-manager';

import type { ParaCardProps } from '@/components/ParaCard.vue';
import type { ContentScriptContext, IntegratedContentScriptUi } from '#imports';
import type { App } from 'vue';

// Preload the ParaCard component to make mounting synchronous
let paraCardComponent: unknown = null;
const preloadParaCardComponent = async () => {
  if (!paraCardComponent) {
    const { default: component } = await import('@/components/ParaCard.vue');
    paraCardComponent = component;
  }
  return paraCardComponent;
};

const logger = createLogger('vue-app');

const sharedPinia = createPinia();
setActivePinia(sharedPinia);

// WeakMap prevents memory leaks - automatically garbage collects when UI instances are removed
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

export const createParaCardApp = (state: ParaCardProps): App => {
  const ParaCard = paraCardComponent;
  if (!ParaCard) {
    throw new Error('ParaCard component not preloaded. Call preloadParaCardComponent() first.');
  }

  return createApp({
    components: {
      ParaCard,
    },
    setup() {
      return () => h(ParaCard, state);
    },
  });
};

const mountParaCard = (
  ui: IntegratedContentScriptUi<{ app: App; styleEl: HTMLStyleElement }>,
  state: ParaCardProps,
  mountContainer: HTMLElement
): { app: App; styleEl: HTMLStyleElement } => {
  const { styleEl } = ensureSharedStyleElement();
  incrementStyleRefCount();

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

/**
 * Clean up Vue app and shared styles for a given UI instance
 * @param ui - The integrated UI instance to clean up
 */
export const cleanupVueAppAndStyles = (
  ui: IntegratedContentScriptUi<{ app: App; styleEl: HTMLStyleElement }>
) => {
  const app = uiAppMap.get(ui);
  if (!app) return;

  // Execute cleanup handles before unmounting
  const handles = uiCleanupMap.get(ui);
  if (handles) {
    handles.forEach((stop) => stop());
  }
  uiCleanupMap.delete(ui);

  app.unmount();

  // Manage shared style element lifecycle
  decrementStyleRefCount();

  uiAppMap.delete(ui);
};

export const addParaCard = async (
  ctx: ContentScriptContext,
  container: Element
): Promise<{
  ui: IntegratedContentScriptUi<{ app: App; styleEl: HTMLStyleElement }>;
  state: ParaCardProps;
}> => {
  // Preload the component to ensure synchronous mounting
  await preloadParaCardComponent();

  const state = reactive<ParaCardProps>(createInitialParaCardState());
  const cleanupHandles: Array<() => void> = [];

  const ui: IntegratedContentScriptUi<{ app: App; styleEl: HTMLStyleElement }> = createIntegratedUi(
    ctx,
    {
      position: 'inline',
      anchor: container,
      onMount: (mountContainer: HTMLElement): { app: App; styleEl: HTMLStyleElement } => {
        try {
          return mountParaCard(ui, state, mountContainer);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.error`Failed to mount ParaCard: ${errorMessage}`;
          throw error;
        }
      },
      onRemove: () => {
        // Cleanup handled by business layer - callback kept for WXT compatibility
        logger.debug`WXT UI removed - cleanup handled by business layer`;
      },
    }
  );

  uiCleanupMap.set(ui, cleanupHandles);
  ui.mount();

  return { ui, state };
};
