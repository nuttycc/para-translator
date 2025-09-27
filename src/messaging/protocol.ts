// Messaging protocol definitions for content <-> background
// comments: Define message types and their data/return contracts

import type { AgentContext, AgentResponse, TaskType } from '@/agent/types';

// Protocol map consumed by defineExtensionMessaging
export interface ProtocolMap {
  agent(data: { context: AgentContext; taskType: TaskType }): AgentResponse;
  updateParaCardCSS(data: { css: string }): void;
}
