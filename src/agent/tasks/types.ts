import type { AgentContext, TaskRuntimeConfig } from '@/agent/types';
import type { OpenAI } from 'openai';

export interface OpenAIClient {
  openai: OpenAI;
  model: string;
}

export interface TaskRunner {
  run(context: AgentContext, config: TaskRuntimeConfig, client: OpenAIClient): Promise<string>;
}
