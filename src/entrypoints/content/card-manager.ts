import { DISABLED_EXPLANATION } from '@/constant';
import { getDocumentMeta } from '@/entrypoints/content/cache-manager';
import { isEditable } from '@/entrypoints/content/content-utils';
import { addParaCard, cleanupVueAppAndStyles } from '@/entrypoints/content/ui-manager';
import { sendMessage } from '@/messaging';
import { createLogger } from '@/utils/logger';
import { extractReadableText, findClosestTextContainer } from '@/utils/paragraph';

import type { AgentContext } from '@/agent/types';
import type { ParaCardProps } from '@/components/ParaCard.vue';
import type { ContentScriptContext, IntegratedContentScriptUi } from '#imports';
import type { App } from 'vue';

import { contentStore } from './content-utils';

const logger = createLogger('card-manager');

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

  try {
    cleanupVueAppAndStyles(ui);
    logger.debug`Cleaned up Vue app and styles for ${paraKey}`;
  } catch (error) {
    logger.error`Failed to cleanup Vue resources for ${paraKey}: ${error}`;
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
 * Constructs the context object required by the translation agent.
 * Provides document metadata and user preferences to inform translation quality.
 */
const buildAgentContext = (
  sourceText: string,
  documentMeta: { title: string; description: string }
): AgentContext => ({
  sourceText,
  sourceLanguage: 'auto',
  targetLanguage: contentStore?.targetLanguage ?? 'zh-CN',
  siteTitle: documentMeta.title,
  siteUrl: window.location.href,
  siteDescription: documentMeta.description,
});

/**
 * Manages the lifecycle of translation cards based on user interaction.
 * Prevents interference with user input by avoiding cards on editable elements.
 * Uses stable paragraph identifiers to maintain card state across DOM changes.
 *
 * @param ctx - WXT content script context
 * @param currentHoveredElement - The element currently under the cursor
 *
 * @remarks
 * - Guards against stale async results by verifying presence in `cardUIs`
 * - Persists the paragraph key in `data-para-id` for stable toggling
 */
export const toggleParaCard = async (
  ctx: ContentScriptContext,
  currentHoveredElement: HTMLElement | null
): Promise<void> => {
  if (!currentHoveredElement) {
    logger.debug`Skip: no element currently hovered`;
    return;
  }

  if (isEditable(currentHoveredElement) || isEditable(document.activeElement)) {
    logger.debug`Skip: input/textarea/contenteditable is focused or hovered`;
    return;
  }

  const container = findClosestTextContainer(currentHoveredElement);
  if (!container) {
    logger.debug`Skip: no container found`;
    return;
  }

  logger.debug`Found text container ${{
    hoveredElement: currentHoveredElement.tagName,
    containerTag: container.tagName,
  }}`;

  const sourceText = extractReadableText(container);
  logger.debug`Extracted text meta ${{ length: sourceText.length, preview: sourceText.slice(0, 80) }}`;

  const existingKey = container.getAttribute('data-para-id');
  const paraKey = existingKey && existingKey.trim().length > 0 ? existingKey : crypto.randomUUID();

  container.setAttribute('data-para-id', paraKey);

  if (cardUIs.has(paraKey)) {
    cleanupParaCard(paraKey);
    return;
  }

  try {
    const { ui, state } = await addParaCard(ctx, container);

    if (ui && typeof ui.remove === 'function') {
      cardUIs.set(paraKey, { ui, container, state });
      logger.debug`Added para card for ${paraKey}`;
    } else {
      logger.error`Failed to create valid UI for para card ${paraKey}`;
      container.removeAttribute('data-para-id');
      return;
    }

    try {
      const documentMeta = getDocumentMeta();
      const context: AgentContext = buildAgentContext(sourceText, documentMeta);

      state.sourceText = sourceText;

      sendMessage('agent', { context, taskType: 'translate' })
        .then((translateResponse) => {
          if (!cardUIs.has(paraKey)) return;
          if (translateResponse.ok) {
            logger.debug`Translate response: ${translateResponse.data.slice(0, 20)}`;
            state.translation = translateResponse.data;
          } else {
            throw new Error(translateResponse.error);
          }
          return;
        })
        .catch((error) => {
          if (!cardUIs.has(paraKey)) return;
          state.error = {
            type: 'translate',
            message: error instanceof Error ? error.message : String(error),
          };
          logger.error`${paraKey} ${error}`;
          return;
        });

      if (!DISABLED_EXPLANATION) {
        sendMessage('agent', { context, taskType: 'explain' })
          .then((explanationResponse) => {
            if (!cardUIs.has(paraKey)) return;
            if (explanationResponse.ok) {
              logger.debug`explanationResponse.data: ${explanationResponse.data.slice(0, 20)}`;
              state.explanation = explanationResponse.data;
            } else {
              throw new Error(explanationResponse.error);
            }
            return;
          })
          .catch((error) => {
            if (!cardUIs.has(paraKey)) return;
            state.error = {
              type: 'explain',
              message: error instanceof Error ? error.message : String(error),
            };
            logger.error`${paraKey} ${error}`;
            return;
          });
      }

      if (!cardUIs.has(paraKey)) {
        return;
      }
    } catch (err) {
      state.error = { type: 'explain', message: err instanceof Error ? err.message : String(err) };
    }
  } catch (error) {
    logger.error`failed to add/update para card for ${paraKey}: ${error}`;
    cleanupParaCard(paraKey, false);
    container.removeAttribute('data-para-id');
  }
};
