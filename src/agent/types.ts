import type { ChatCompletion } from 'openai/resources/index.mjs';

export const TASK_TYPES = ['translate', 'explain'] as const;

export type TaskType = (typeof TASK_TYPES)[number];

export interface PromptUnit {
  system: string;
  user: string;
}

export interface TaskRuntimeConfig {
  aiConfigId: string;
  temperature: number;
  prompt: PromptUnit;
}

// storage.local
export type TaskRuntimeConfigs = Record<TaskType, TaskRuntimeConfig>;

export interface AgentContext {
  sourceText: string;
  sourceLanguage?: string;
  targetLanguage: string;
  siteTitle: string;
  siteUrl: string;
  siteDescription?: string | null;
}

export const AGENT_CONTEXT_KEYS = [
  'sourceText',
  'sourceLanguage',
  'targetLanguage',
  'siteTitle',
  'siteUrl',
  'siteDescription',
] as const;

export type AgentContextKey = (typeof AGENT_CONTEXT_KEYS)[number];

export type AgentResponse =
  | {
      ok: true;
      data: string;
    }
  | {
      ok: false;
      error: string;
    };

export interface AIConfig {
  id: string;
  name: string;
  provider: string;
  model: string;
  isRemoteModel?: boolean;
  localModels: string[];
  remoteModels?: string[];
  apiKey: string;
  baseUrl: string;
  createdAt: number;
  updatedAt: number;
}

// storage.local
export type AIConfigs = Record<string, AIConfig>;

export interface LangAgentSpec {
  readonly taskTypes: typeof TASK_TYPES;

  perform(taskType: TaskType, context: AgentContext): Promise<AgentResponse>;
}

// storage.local
export interface AgentExecutionResult {
  id: string;

  timestamp: number;

  taskType: TaskType;

  context: AgentContext;

  response: ChatCompletion;

  aiConfigId: string;
}

export type AgentExecutionResults = AgentExecutionResult[];
