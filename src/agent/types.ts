// Types are now self-contained to avoid circular dependencies

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
  siteTitle?: string;
  siteUrl?: string;
}

export interface AIConfig {
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
export type AIConfigs = AIConfig[];

export interface AgentResult {
  ok: boolean;
  data?: string;
  error?: string;
}

export interface TaskExecutor {
  readonly taskType: TaskType;
  execute(context: AgentContext): Promise<AgentResult>;
}

export interface TranslatorTaskExecutor extends TaskExecutor {
  taskType: 'translate';
  execute(context: AgentContext): Promise<AgentResult>;
}

export interface ExplainTaskExecutor extends TaskExecutor {
  taskType: 'explain';
  execute(context: AgentContext): Promise<AgentResult>;
}

export interface LangAgentSpec {
  readonly taskTypes: typeof TASK_TYPES;

  perform(taskType: TaskType, context: AgentContext): Promise<AgentResult>;
}
