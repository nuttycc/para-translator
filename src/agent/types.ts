// Types are now self-contained to avoid circular dependencies

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 TASK TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const TASK_TYPES = ['translate', 'explain'] as const;

export type TaskType = (typeof TASK_TYPES)[number];

// ═══════════════════════════════════════════════════════════════════════════════
// 🧩 PROMPT UNIT
// ═══════════════════════════════════════════════════════════════════════════════

export interface PromptUnit {
  system: string;
  user: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⚙️ TASK RUNTIME CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface TaskRuntimeConfig {
  aiConfigId: string;
  temperature: number;
  prompt: PromptUnit;
}

// storage.local
export type TaskRuntimeConfigs = Record<TaskType, TaskRuntimeConfig>;

// ═══════════════════════════════════════════════════════════════════════════════
// 🤖 AGENT CONTEXT & RESPONSE
// ═══════════════════════════════════════════════════════════════════════════════

export interface AgentContext {
  sourceText: string;
  sourceLanguage?: string;
  targetLanguage: string;
  siteTitle?: string;
  siteUrl?: string;
}

export interface AgentResponse {
  ok: boolean;
  data?: string;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 AI CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface AIConfig {
  id: string;
  name: string;
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
export type AIConfigs = Record<string, AIConfig>;

// ═══════════════════════════════════════════════════════════════════════════════
// 🏃 TASK EXECUTORS
// ═══════════════════════════════════════════════════════════════════════════════

export interface TaskExecutor {
  readonly taskType: TaskType;
  runtimeConfig: TaskRuntimeConfig;
  execute(context: AgentContext): Promise<string>;
}

export interface TranslatorTaskExecutor extends TaskExecutor {
  readonly taskType: 'translate';
}

export interface ExplainTaskExecutor extends TaskExecutor {
  readonly taskType: 'explain';
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 LANGUAGE AGENT SPECIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface LangAgentSpec {
  readonly taskTypes: typeof TASK_TYPES;

  perform(taskType: TaskType, context: AgentContext): Promise<AgentResponse>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 EXECUTION RESULTS & HISTORY
// ═══════════════════════════════════════════════════════════════════════════════

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
