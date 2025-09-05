import { getLangAgent } from '@/agent/agent';
import type { AgentContext, AgentResponse, TaskType } from '@/agent/types';

/**
 * Delegates a translation request to the background language agent and returns its response.
 *
 * @param context - Context for the translation operation (input text, target language, and related metadata).
 * @returns The agent's response for the translation operation.
 */
export async function handleAgent(data: {
  context: AgentContext;
  taskType: TaskType;
}): Promise<AgentResponse> {
  const langAgent = await getLangAgent();

  const result = await langAgent.perform(data.taskType, data.context);

  return result;
}
