import { type IConfig, type IConfigList, type TaskRuntimeConfig } from '@/agent/types';

export const DEFAULT_AI_CONFIG_LIST: IConfigList = [
  {
    id: 'deepseek-123',
    provider: 'deepseek',
    model: 'deepseek-chat',
    localModels: ['deepseek-chat', 'deepseek-reasoner'],
    apiKey: '',
    baseUrl: 'https://api.deepseek.com/v1/',
    createdAt: -1,
    updatedAt: -1,
  },
  {
    id: 'glm-123',
    provider: 'glm',
    model: 'glm-4.5-flash',
    localModels: ['glm-4.5-flash'],
    apiKey: '',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4/',
    createdAt: -2,
    updatedAt: -2,
  },
  {
    id: 'groq-123',
    provider: 'groq',
    model: 'openai/gpt-oss-20b',
    localModels: ['openai/gpt-oss-20b', 'moonshotai/kimi-k2-instruct'],
    apiKey: '',
    baseUrl: 'https://api.groq.com/openai/v1',
    createdAt: -3,
    updatedAt: -3,
  },
];

export const DEFAULT_AI_CONFIG_MAP: Record<string, IConfig> = DEFAULT_AI_CONFIG_LIST.reduce(
  (map, config) => {
    map[config.id] = config;
    return map;
  },
  {} as Record<string, IConfig>
);

export const DefaultTaskConfig: TaskRuntimeConfig = {
  translate: {
    aiConfigId: 'groq-123',
    temperature: 0.7,
    prompt: {
      system:
        'You are a professional translator. Your task is to translate the source text into the target language.',
      user: 'Translate the following text into %{targetLanguage}: %{sourceText}',
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
};
