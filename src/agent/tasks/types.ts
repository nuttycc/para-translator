import type { AgentContext, TaskRuntimeConfig } from '@/agent/types';
import type { OpenAI } from 'openai';
import type { ChatCompletion } from 'openai/resources/index.mjs';

export interface OpenAIClient {
  openai: OpenAI;
  model: string;
}

export interface TaskRunner {
  run(
    context: AgentContext,
    config: TaskRuntimeConfig,
    client: OpenAIClient
  ): Promise<ChatCompletion>;
}
