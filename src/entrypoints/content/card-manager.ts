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
 * Active cards indexed by a stable paragraph key. Each entry stores:
 * - `ui`: the ShadowRoot UI handle
 * - `container`: the host element
 * - `state`: the reactive ParaCard props to mutate as results arrive
 */
export const cardUIs = new Map<
  string,
  { ui: ShadowRootContentScriptUi<App>; container: HTMLElement; state: ParaCardProps }
>();

/**
 * Removes a translation card and cleans its associated resources safely.
 *
 * @param paraKey - Unique identifier for the paragraph/card.
 * @param removeUI - When true (default), also detach and unmount the UI.
 *
 * @remarks
 * - Idempotent: safe to call multiple times; exits if nothing to clean.
 * - Also clears `data-para-*` flags from the host container.
 */
export const cleanupParaCard = (paraKey: string, removeUI = true) => {
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
    container.removeAttribute('data-para-is-translated');
    container.removeAttribute('data-para-id');
    logger.debug`cleaned up dataset for para card ${paraKey}`;
  }
};

/**
 * If the current hover target is a paragraph-like container, toggles
 * a translation card in place:
 * - If a card exists for that paragraph, it is removed.
 * - If not, a loading card is added and an async translation is requested.
 *
 * @param ctx - Content script context from WXT
 * @param currentHoveredElement - The currently hovered element
 *
 * @remarks
 * - Guards against stale async results by checking `cardUIs` before applying updates.
 * - Stores the paragraph key in `data-para-id` to keep toggling stable.
 */
export const toggleParaCard = async (
  ctx: ContentScriptContext,
  currentHoveredElement: HTMLElement | null
) => {
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
  const paraKey = container.getAttribute('data-para-id') || crypto.randomUUID();

  // Set paraId immediately to prevent duplicate cards on quick toggles
  container.setAttribute('data-para-id', paraKey);

  // Toggle behavior: remove if exists, otherwise create and load
  if (cardUIs.has(paraKey)) {
    cleanupParaCard(paraKey);
    return;
  }

  try {
    // 1) Create/loading UI
    const { ui, state } = await addParaCard(ctx, container, { sourceText, loading: true });

    if (ui && typeof ui.remove === 'function') {
      cardUIs.set(paraKey, { ui, container, state });
      logger.debug`added para card for ${paraKey}`;
    } else {
      logger.error`failed to create valid UI for para card ${paraKey}`;
      return;
    }

    // 2) Request translation/explanation from the agent
    try {
      const documentMeta = getDocumentMeta();
      const context: AgentContext = {
        sourceText,
        sourceLanguage: 'auto',
        targetLanguage: 'zh-CN',
        siteTitle: documentMeta.title,
        siteUrl: window.location.href,
        siteDescription: documentMeta.description,
      };

      logger.debug`context ${{ context }}`;

      const response = await sendMessage('agent', { context, taskType: 'translate' });

      logger.debug`translated result ${response}`;

      // Ignore late results if the card was removed
      if (!cardUIs.has(paraKey)) {
        logger.debug`para card for ${paraKey} was removed during async operation, skipping result application`;
        return;
      }

      state.result = response.data;
      state.error = response.error;

      // Persist identity on the container for stable toggling
      container.setAttribute('data-para-is-translated', 'true');
      container.setAttribute('data-para-id', paraKey);
    } catch (err) {
      // Ensure UI exits loading and shows error
      state.error = err instanceof Error ? err.message : String(err);
    } finally {
      state.loading = false;
    }
  } catch (error) {
    logger.error`failed to add/update para card for ${paraKey}: ${error}`;
    // UI may not exist yet, skip removing
    cleanupParaCard(paraKey, false);
    // Clean up stale attributes even if cardUIs doesn't have an entry
    container.removeAttribute('data-para-id');
    container.removeAttribute('data-para-is-translated');
  }
};
