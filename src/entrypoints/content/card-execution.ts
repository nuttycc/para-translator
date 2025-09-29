import { DISABLED_EXPLANATION } from '@/constant';
import { sendMessage } from '@/messaging';
import { createLogger } from '@/utils/logger';

import type { AgentContext } from '@/agent/types';
import type { ParaCardProps } from '@/components/ParaCard.vue';

const logger = createLogger('card-execution');

/**
 * Represents an error that occurred during card execution.
 */
export interface CardExecutionError {
  /** The type of task that failed */
  type: 'translate' | 'explain';
  /** The error message */
  message: string;
}

/**
 * Executes translation and explanation tasks for a ParaCard.
 *
 * @param paraKey - Unique identifier for the paragraph/card
 * @param state - The reactive state of the ParaCard
 * @param context - The agent context containing translation parameters
 * @param isCardStillActive - Function to check if the card is still active
 */
export const executeCardTasks = async (
  paraKey: string,
  state: ParaCardProps,
  context: AgentContext,
  isCardStillActive: () => boolean
): Promise<void> => {
  // Set the source text immediately
  state.sourceText = context.sourceText;

  try {
    // Execute translation task
    await executeTranslationTask(paraKey, state, context, isCardStillActive);

    // Execute explanation task if enabled
    if (!DISABLED_EXPLANATION) {
      await executeExplanationTask(paraKey, state, context, isCardStillActive);
    }
  } catch (error) {
    // Handle any unexpected errors during task execution
    if (isCardStillActive()) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      state.error = { type: 'explain', message: errorMessage };
      logger.error`Unexpected error during card execution for ${paraKey}: ${errorMessage}`;
    }
  }
};

/**
 * Executes the translation task for a ParaCard.
 */
const executeTranslationTask = async (
  paraKey: string,
  state: ParaCardProps,
  context: AgentContext,
  isCardStillActive: () => boolean
): Promise<void> => {
  try {
    const translateResponse = await sendMessage('agent', {
      context,
      taskType: 'translate'
    });

    if (!isCardStillActive()) return;

    if (translateResponse.ok) {
      logger.debug`Translate response: ${translateResponse.data.slice(0, 20)}`;
      state.translation = translateResponse.data;
    } else {
      throw new Error(translateResponse.error);
    }
  } catch (error) {
    if (!isCardStillActive()) return;

    const errorMessage = error instanceof Error ? error.message : String(error);
    state.error = {
      type: 'translate',
      message: errorMessage,
    };
    logger.error`Translation failed for ${paraKey}: ${errorMessage}`;
  }
};

/**
 * Executes the explanation task for a ParaCard.
 */
const executeExplanationTask = async (
  paraKey: string,
  state: ParaCardProps,
  context: AgentContext,
  isCardStillActive: () => boolean
): Promise<void> => {
  try {
    const explanationResponse = await sendMessage('agent', {
      context,
      taskType: 'explain'
    });

    if (!isCardStillActive()) return;

    if (explanationResponse.ok) {
      logger.debug`Explanation response: ${explanationResponse.data.slice(0, 20)}`;
      state.explanation = explanationResponse.data;
    } else {
      throw new Error(explanationResponse.error);
    }
  } catch (error) {
    if (!isCardStillActive()) return;

    // Preserve existing translation result if explanation fails
    if (!state.error) {
      state.error = {
        type: 'explain',
        message: error instanceof Error ? error.message : String(error),
      };
    }
    logger.error`Explanation failed for ${paraKey}: ${error}`;
  }
};
