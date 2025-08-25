import { getLangAgent } from '@/agent/agent';
import type { AgentContext, AgentResponse } from '@/agent/types';

/**
 * Delegates a translation request to the background language agent and returns its response.
 *
 * @param context - Context for the translation operation (input text, target language, and related metadata).
 * @returns The agent's response for the translation operation.
 */
export async function handleTranslate(context: AgentContext): Promise<AgentResponse> {
  // console.log used per project logging guideline; replace with real logic
  console.log('handleTranslate called', context);

  const langAgent = await getLangAgent();

  const result = await langAgent.perform('translate', context);

  return result;
}
