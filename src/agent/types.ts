// Types are now self-contained to avoid circular dependencies

export const TASK_TYPES = ['translate', 'explain'] as const;

export type TaskType = (typeof TASK_TYPES)[number];

export interface PromptUnit {
  system: string;
  user: string;
}

export interface RuntimeConfig {
  aiConfigId: string;
  temperature: number;
  prompt: PromptUnit;
}

// storage.local
export type TaskRuntimeConfig = Record<TaskType, RuntimeConfig>;

export interface AgentContext {
  sourceText: string;
  sourceLanguage?: string;
  targetLanguage: string;
  siteTitle?: string;
  siteUrl?: string;
}

export interface LangAgentSpec {
  readonly taskTypes: typeof TASK_TYPES;

  perform(taskType: TaskType, context: AgentContext): Promise<AgentResult>;
}

export interface IConfig {
  id: string;
  provider: string;
  model: string;
  localModels: string[];
  remoteModels?: string[];
  apiKey: string;
  baseUrl: string;
  createdAt: number;
  updatedAt: number;
}

// storage.local
export type IConfigList = IConfig[];

export interface AgentResult {
  ok: boolean;
  data?: string;
  error?: string;
}
