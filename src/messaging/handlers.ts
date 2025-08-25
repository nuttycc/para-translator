import { getLangAgent } from '@/agent/agent';
import type { AgentContext, AgentResponse } from '@/agent/types';

// Empty implementations as placeholders. Real logic lives in background service.
export async function handleTranslate(context: AgentContext): Promise<AgentResponse> {
  // console.log used per project logging guideline; replace with real logic
  console.log('handleTranslate called', context);

  const langAgent = await getLangAgent();

  const result = await langAgent.perform('translate', context);

  return result;
}
