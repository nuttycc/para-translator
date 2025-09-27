import { AGENT_CONTEXT_KEYS } from '@/agent/types';

import type { AgentContext, AgentContextKey } from '@/agent/types';

export const BUILTIN_REPLACEMENT_KEYS = AGENT_CONTEXT_KEYS;

function isAgentContextKey(key: string): key is AgentContextKey {
  return (AGENT_CONTEXT_KEYS as readonly string[]).includes(key);
}

export function renderTemplate(template: string, context: AgentContext): string {
  if (!template) return '';

  return template.replace(/%\{([a-zA-Z0-9_]+)\}/g, (match, key: string) => {
    if (!isAgentContextKey(key)) return match;

    const value = context[key];
    return String(value ?? '');
  });
}
