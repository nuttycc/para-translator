import type { AgentContext, AgentResponse } from '@/agent/types';

// Empty implementations as placeholders. Real logic lives in background service.
export async function handleTranslate(_data: AgentContext): Promise<AgentResponse> {
  // console.log used per project logging guideline; replace with real logic
  console.log('handleTranslate called', _data);
  return { ok: true, data: 'test' };
}


