import { executeCardTasks } from './execution';
import { isCardActive, manageCardLifecycle } from './lifecycle';
import { addParaCard } from './ui/vue-app';
import { validateAndExtractContext } from './validation';

import type { ContentScriptContext } from '#imports';

/**
 * Manages the lifecycle of translation cards based on user interaction.
 * Prevents interference with user input by avoiding cards on editable elements.
 * Uses stable paragraph identifiers to maintain card state across DOM changes.
 *
 * @param ctx - WXT content script context
 * @param currentHoveredElement - The element currently under the cursor
 *
 * @remarks
 * - Guards against stale async results by verifying presence in card registry
 * - Persists the paragraph key in `data-para-id` for stable toggling
 */
export const toggleParaCard = async (
  ctx: ContentScriptContext,
  currentHoveredElement: HTMLElement | null
): Promise<void> => {
  // Validate the hovered element and extract necessary context
  const context = validateAndExtractContext(currentHoveredElement);
  if (!context) {
    return;
  }

  const { container, paraKey, agentContext } = context;

  // Manage card lifecycle (create new or cleanup existing)
  await manageCardLifecycle(ctx, paraKey, container, async () => {
    // Create the UI for the card
    const { ui, state } = await addParaCard(ctx, container);

    // Execute translation and explanation tasks
    executeCardTasks(paraKey, state, agentContext, () => isCardActive(paraKey));

    return { ui, state };
  });
};
