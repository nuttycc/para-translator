import type { ContentScriptContext, ShadowRootContentScriptUi } from '#imports';

import type { App } from 'vue';

import type { AgentContext } from '@/agent/types';
import type { ParaCardProps } from '@/components/ParaCard.vue';
import { getDocumentMeta } from '@/entrypoints/content/cache-manager';
import { isEditable } from '@/entrypoints/content/content-utils';
import { addParaCard } from '@/entrypoints/content/ui-manager';
import { sendMessage } from '@/messaging';
import { createLogger } from '@/utils/logger';
import { extractReadableText, findClosestTextContainer, isParagraphLike } from '@/utils/paragraph';

const logger = createLogger('card-manager');

/**
 * Live translation cards keyed by a stable paragraph identifier.
 * Each map entry contains:
 * - `ui`: ShadowRoot UI handle
 * - `container`: host element for the card
 * - `state`: reactive `ParaCard` props mutated as results arrive
 */
interface ParaCardEntry {
  ui: ShadowRootContentScriptUi<App>;
  container: HTMLElement;
  state: ParaCardProps;
}

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
    logger.debug`no para card found for cleanup: ${paraKey}`;
    return;
  }

  const { ui, container } = cardEntry;

  if (removeUI && ui && typeof ui.remove === 'function') {
    try {
      ui.remove();
      logger.debug`removed para card UI for ${paraKey}`;
    } catch (error) {
      logger.error`failed to remove para card UI for ${paraKey}: ${error}`;
    }
  }

  cardUIs.delete(paraKey);

  if (container) {
    container.removeAttribute('data-para-id');
    logger.debug`cleaned up dataset for para card ${paraKey}`;
  }
};

const buildAgentContext = (
  sourceText: string,
  documentMeta: { title: string; description: string }
): AgentContext => ({
  sourceText,
  sourceLanguage: 'auto',
  targetLanguage: 'zh-CN',
  siteTitle: documentMeta.title,
  siteUrl: window.location.href,
  siteDescription: documentMeta.description,
});

/**
 * Toggle a translation card for the currently hovered paragraph-like container.
 * - If a card already exists for the container, remove it.
 * - Otherwise, create a loading card and request async results.
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
    logger.debug`skip: no element currently hovered`;
    return;
  }

  if (isEditable(currentHoveredElement) || isEditable(document.activeElement)) {
    logger.debug`skip: input/textarea/contenteditable is focused or hovered`;
    return;
  }

  const container = findClosestTextContainer(currentHoveredElement);
  if (!container) {
    logger.debug`skip: no container found`;
    return;
  }

  logger.debug`hovered text container ${{
    containerTag: container.tagName,
  }}`;

  const sourceText = extractReadableText(container);
  logger.debug`extracted text meta ${{ length: sourceText.length, preview: sourceText.slice(0, 80) }}`;

  if (!isParagraphLike(sourceText)) {
    logger.debug`skip: not paragraph-like`;
    return;
  }

  // Stable paragraph key (persisted on the container once created)
  const existingKey = container.getAttribute('data-para-id');
  const paraKey = existingKey && existingKey.trim().length > 0 ? existingKey : crypto.randomUUID();

  // Persist immediately to prevent duplicate cards on rapid toggles
  container.setAttribute('data-para-id', paraKey);

  // Toggle behavior: remove if exists; otherwise create and load
  if (cardUIs.has(paraKey)) {
    cleanupParaCard(paraKey);
    return;
  }

  try {
    // 1) Create loading UI
    const { ui, state } = await addParaCard(ctx, container);

    if (ui && typeof ui.remove === 'function') {
      cardUIs.set(paraKey, { ui, container, state });
      logger.debug`added para card for ${paraKey}`;
    } else {
      logger.error`failed to create valid UI for para card ${paraKey}`;
      container.removeAttribute('data-para-id');
      return;
    }

    // 2) Request translation and explanation from the agent
    try {
      const documentMeta = getDocumentMeta();
      const context: AgentContext = buildAgentContext(sourceText, documentMeta);

      state.context = context;
      state.sourceText = sourceText;

      sendMessage('agent', { context, taskType: 'translate' })
        .then((translateResponse) => {
          if (!cardUIs.has(paraKey)) return;
          if (!translateResponse.data) {
            throw new Error(`${translateResponse.error}`);
          }
          logger.debug`translateResponse.data: ${translateResponse.data.slice(0, 20)}`;
          state.translation = translateResponse.data;
          return;
        })
        .catch((error) => {
          if (!cardUIs.has(paraKey)) return;
          state.error = error instanceof Error ? error.message : String(error);
          logger.error`${paraKey} ${error}`;
          return;
        });

      sendMessage('agent', { context, taskType: 'explain' })
        .then((explanationResponse) => {
          if (!cardUIs.has(paraKey)) return;
          if (!explanationResponse.data || explanationResponse.error) {
            throw new Error(`${explanationResponse.error}`);
          }
          logger.debug`explanationResponse.data: ${explanationResponse.data.slice(0, 20)}`;
          state.explanation = explanationResponse.data;
          return;
        })
        .catch((error) => {
          if (!cardUIs.has(paraKey)) return;
          state.error = error instanceof Error ? error.message : String(error);
          logger.error`${paraKey} ${error}`;
          return;
        });

      // Ignore late results if the card was removed during async work
      if (!cardUIs.has(paraKey)) {
        return;
      }

      container.setAttribute('data-para-id', paraKey);
    } catch (err) {
      state.error = err instanceof Error ? err.message : String(err);
    }
  } catch (error) {
    logger.error`failed to add/update para card for ${paraKey}: ${error}`;
    // UI may not exist yet, skip removing
    cleanupParaCard(paraKey, false);
    // Clean up stale attributes even if cardUIs doesn't have an entry
    container.removeAttribute('data-para-id');
  }
};
