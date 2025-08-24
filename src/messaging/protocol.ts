// Messaging protocol definitions for content <-> background
// comments: Define message types and their data/return contracts

import type { AgentContext, AgentResponse } from '@/agent/types';

// Protocol map consumed by defineExtensionMessaging
export interface MessagingProtocol {
  translate(context: AgentContext): AgentResponse;
}
