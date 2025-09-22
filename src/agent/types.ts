import { z } from 'zod';

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

export const AgentContextSchema = z.object({
  sourceText: z.string(),
  sourceLanguage: z.string().optional().default('auto'),
  targetLanguage: z.string(),
  siteTitle: z.string(),
  siteUrl: z.string(),
  siteDescription: z.string().optional().nullable(),
});

export type AgentContext = z.infer<typeof AgentContextSchema>;

export const AGENT_CONTEXT_KEYS = AgentContextSchema.keyof().options satisfies ReadonlyArray<
  keyof AgentContext
>;

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

export interface AgentExecutionResult {
  id: string;

  timestamp: number;

  taskType: TaskType;

  context: AgentContext;

  result: string;

  aiConfigId: string;

  duration?: number;

  metadata?: {
    provider?: string;
    model?: string;
    temperature?: number;
    resultLength?: number;
  };
}

// storage.local
export type AgentExecutionResults = AgentExecutionResult[];

export interface HistoryData {
  id: string;
  context: AgentContext;
  translation: string | null;
  explanation: string | null;
  timestamp: number;
}
