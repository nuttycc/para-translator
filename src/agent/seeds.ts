import { type AIConfigs, type TaskRuntimeConfigs } from '@/agent/types';

const DEFAULT_AI_CONFIGS = {
  'deepseek-123': {
    id: 'deepseek-123',
    provider: 'deepseek',
    model: 'deepseek-chat',
    localModels: ['deepseek-chat', 'deepseek-reasoner'],
    apiKey: '',
    baseUrl: 'https://api.deepseek.com/v1/',
    createdAt: 0,
    updatedAt: 0,
  },
  'glm-123': {
    id: 'glm-123',
    provider: 'glm',
    model: 'glm-4.5-flash',
    localModels: ['glm-4.5-flash'],
    apiKey: '',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4/',
    createdAt: 0,
    updatedAt: 0,
  },
  'groq-123': {
    id: 'groq-123',
    provider: 'groq',
    model: 'openai/gpt-oss-20b',
    localModels: ['openai/gpt-oss-20b', 'moonshotai/kimi-k2-instruct'],
    apiKey: '',
    baseUrl: 'https://api.groq.com/openai/v1',
    createdAt: 0,
    updatedAt: 0,
  },
} as const satisfies AIConfigs;

const DEFAULT_TASK_RUNTIME_CONFIGS = {
  translate: {
    aiConfigId: 'groq-123',
    temperature: 0.7,
    prompt: {
      system:
        'You are a professional translator. Your task is to translate the source text into the target language.',
      user:
        'Translate the following text into %{targetLanguage}: %{sourceText} ' +
        '\nHere is some additional information about the source text: ' +
        '\nThe source text is from %{siteTitle} at %{siteUrl}.',
    },
  },
  explain: {
    aiConfigId: 'groq-123',
    temperature: 0.3,
    prompt: {
      system:
        'You are a professional Language teacher. Your task is to explain the source text in a way that is easy to understand for language learners.',
      user: 'Explain the following text in %{targetLanguage}: %{sourceText}',
    },
  },
} as const satisfies TaskRuntimeConfigs;

export const AGENT_SEEDS = {
  AI_CONFIGS: DEFAULT_AI_CONFIGS,
  TASK_RUNTIME_CONFIGS: DEFAULT_TASK_RUNTIME_CONFIGS,
};
