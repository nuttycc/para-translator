import { cleanupVueAppAndStyles } from '@/entrypoints/content/ui-manager';
import { createLogger } from '@/utils/logger';

import type { ParaCardProps } from '@/components/ParaCard.vue';
import type { ContentScriptContext, IntegratedContentScriptUi } from '#imports';
import type { App } from 'vue';

const logger = createLogger('card-lifecycle');

/**
 * Tracks active translation cards to manage their lifecycle and prevent memory leaks.
 * Each entry associates a paragraph with its UI components for coordinated cleanup.
 */
interface ParaCardEntry {
  ui: IntegratedContentScriptUi<{ app: App; styleEl: HTMLStyleElement }>;
  container: HTMLElement;
  state: ParaCardProps;
}

// Global registry of active cards for coordinated cleanup and state management
export const cardUIs = new Map<string, ParaCardEntry>();

/**
 * Checks if a card with the given key is still active.
 *
 * @param paraKey - Unique paragraph/card identifier
 * @returns true if the card exists and is active
 */
export const isCardActive = (paraKey: string): boolean => {
  return cardUIs.has(paraKey);
};

/**
 * Registers a new ParaCard in the global registry.
 *
 * @param paraKey - Unique paragraph/card identifier
 * @param ui - The integrated UI instance
 * @param container - The container element
 * @param state - The ParaCard state
 */
export const registerCard = (
  paraKey: string,
  ui: IntegratedContentScriptUi<{ app: App; styleEl: HTMLStyleElement }>,
  container: HTMLElement,
  state: ParaCardProps
): void => {
  cardUIs.set(paraKey, { ui, container, state });
  logger.debug`Registered ParaCard for ${paraKey}`;
};

/**
 * Remove a card and clean up its associated resources.
 *
 * @param paraKey - Unique paragraph/card identifier
 * @param removeUI - Also detach/unmount the UI (default: true)
 *
 * @remarks
 * - Idempotent: safe to call multiple times; no-ops if missing
 * - Clears the `data-para-id` attribute on the host container
 */
export const cleanupParaCard = (paraKey: string, removeUI = true): void => {
  const cardEntry = cardUIs.get(paraKey);
  if (!cardEntry) {
    logger.debug`No para card found for cleanup: ${paraKey}`;
    return;
  }

  const { ui, container } = cardEntry;

  if (removeUI) {
    try {
      cleanupVueAppAndStyles(ui);
      logger.debug`Cleaned up Vue app and styles for ${paraKey}`;
    } catch (error) {
      logger.error`Failed to cleanup Vue resources for ${paraKey}: ${error}`;
    }
  }

  if (removeUI && ui && typeof ui.remove === 'function') {
    try {
      ui.remove();
      logger.debug`Removed para card UI for ${paraKey}`;
    } catch (error) {
      logger.error`Failed to remove para card UI for ${paraKey}: ${error}`;
    }
  }

  cardUIs.delete(paraKey);

  if (container) {
    container.removeAttribute('data-para-id');
    logger.debug`Cleaned up dataset for para card ${paraKey}`;
  }
};

/**
 * Manages the lifecycle of a ParaCard, either creating a new one or cleaning up an existing one.
 *
 * @param ctx - WXT content script context
 * @param paraKey - Unique paragraph identifier
 * @param container - The container element
 * @param createCardFn - Function to create the card UI if it doesn't exist
 * @returns Promise that resolves when the operation is complete
 */
export const manageCardLifecycle = async (
  ctx: ContentScriptContext,
  paraKey: string,
  container: HTMLElement,
  createCardFn: () => Promise<{ ui: IntegratedContentScriptUi<{ app: App; styleEl: HTMLStyleElement }>; state: ParaCardProps }>
): Promise<void> => {
  // If card already exists, clean it up (toggle behavior)
  if (cardUIs.has(paraKey)) {
    cleanupParaCard(paraKey);
    return;
  }

  try {
    const { ui, state } = await createCardFn();

    if (ui && typeof ui.remove === 'function') {
      registerCard(paraKey, ui, container, state);
    } else {
      logger.error`Failed to create valid UI for para card ${paraKey}`;
      container.removeAttribute('data-para-id');
    }
  } catch (error) {
    logger.error`Failed to manage card lifecycle for ${paraKey}: ${error}`;
    cleanupParaCard(paraKey, false);
    container.removeAttribute('data-para-id');
  }
};
