import { addParaCard } from '@/entrypoints/content/ui-manager';
import { createLogger } from '@/utils/logger';

import type { ParaCardProps } from '@/components/ParaCard.vue';
import type { ContentScriptContext, IntegratedContentScriptUi } from '#imports';
import type { App } from 'vue';

const logger = createLogger('card-ui');

/**
 * Represents a created ParaCard UI instance with its associated state.
 */
export interface CardUIInstance {
  /** The integrated UI instance */
  ui: IntegratedContentScriptUi<{ app: App; styleEl: HTMLStyleElement }>;
  /** The reactive state of the ParaCard */
  state: ParaCardProps;
}

/**
 * Creates a new ParaCard UI instance for the given container.
 *
 * @param ctx - WXT content script context
 * @param container - The HTML element to attach the card to
 * @returns Promise resolving to the created UI instance
 * @throws Error if UI creation fails
 */
export const createCardUI = async (
  ctx: ContentScriptContext,
  container: Element
): Promise<CardUIInstance> => {
  try {
    const { ui, state } = await addParaCard(ctx, container);
    logger.debug`Created ParaCard UI for container ${container.tagName}`;
    return { ui, state };
  } catch (error) {
    logger.error`Failed to create ParaCard UI: ${error}`;
    throw error;
  }
};
