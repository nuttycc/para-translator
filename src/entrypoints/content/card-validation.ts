import { isEditable } from '@/entrypoints/content/content-utils';
import { getDocumentMeta } from '@/entrypoints/content/cache-manager';
import { extractReadableText, findClosestTextContainer } from '@/utils/paragraph';
import { createLogger } from '@/utils/logger';

import type { AgentContext } from '@/agent/types';
import { contentStore } from './content-utils';

const logger = createLogger('card-validation');

/**
 * Represents the validated context for a paragraph card operation.
 */
export interface ValidatedCardContext {
  /** The text container element */
  container: HTMLElement;
  /** The extracted readable text */
  sourceText: string;
  /** The unique paragraph identifier */
  paraKey: string;
  /** The agent context for translation tasks */
  agentContext: AgentContext;
}

/**
 * Validates the hovered element and extracts the necessary context for card creation.
 *
 * @param currentHoveredElement - The element currently under the cursor
 * @returns Validated context or null if validation fails
 */
export const validateAndExtractContext = (
  currentHoveredElement: HTMLElement | null
): ValidatedCardContext | null => {
  if (!currentHoveredElement) {
    logger.debug`Skip: no element currently hovered`;
    return null;
  }

  if (isEditable(currentHoveredElement) || isEditable(document.activeElement)) {
    logger.debug`Skip: input/textarea/contenteditable is focused or hovered`;
    return null;
  }

  const container = findClosestTextContainer(currentHoveredElement);
  if (!container) {
    logger.debug`Skip: no container found`;
    return null;
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

  const documentMeta = getDocumentMeta();
  const agentContext: AgentContext = {
    sourceText,
    sourceLanguage: 'auto',
    targetLanguage: contentStore?.targetLanguage ?? 'zh-CN',
    siteTitle: documentMeta.title,
    siteUrl: window.location.href,
    siteDescription: documentMeta.description,
  };

  return {
    container,
    sourceText,
    paraKey,
    agentContext,
  };
};
