import { type AIConfigs, type TaskRuntimeConfigs } from '@/agent/types';

const DEFAULT_AI_CONFIGS = {
  'deepseek-123': {
    id: 'deepseek-123',
    name: 'DeepSeek',
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
    name: 'GLM',
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
    name: 'Groq',
    provider: 'groq',
    model: 'openai/gpt-oss-120b',
    localModels: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'moonshotai/kimi-k2-instruct'],
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
        'You are a professional translator. Your task is to translate the source text into the target language.' +
        '\nYou should refer to the additional context information about the source text to translate it correctly.' +
        '\nRestrictions: Only return the translated text string, no other explanation, note or anything else.',
      user:
        'Here is some the context for your should know before translating: ' +
        '\n```json' +
        '\n{ name: "siteTitle", value: "%{siteTitle}", description: "this is the title of the website"}' +
        '\n{ name: "siteUrl", value: "%{siteUrl}", description: "this is the url of the website"}' +
        '\n```' +
        '\nNow translate the following text into %{targetLanguage}.' +
        '\n```json' +
        '\n {"name": "sourceText", "value": "%{sourceText}", "description": "text waiting to be translated"}' +
        '\n```' +
        '\nRestrictions: Only return the translated text string, no other explanation, note or anything else.',
    },
  },
  explain: {
    aiConfigId: 'groq-123',
    temperature: 0.7,
    prompt: {
      system:
        '#You are Elizabeth Davis, a professional Language teacher. Your task is to explain the source text in a way that is easy to understand for user.' +
        '\n##Restrictions: ' +
        '\n1.Response-Style: ["respond in the user native language %{targetLanguage}", "respond in concise", "explain with concrete examples", "easily readable in markdown"]' +
        '\n2.Response-Format: json format.' +
        '\nResponse-Format-Example:' +
        '\n```json' +
        '{' +
        '"translatedText": "contextual %{targetLanguage} translation of the source text, should be natural and fluent. only the translated text, no other explanation, note or anything else."},' +
        '"grammar": "contextual explanation of the 3 key grammars(syntaxes) of the source text. should be structured and written in markdown"},' +
        '"vocabulary": "contextual explanation of 3 key vocabularies at or above the intermediate level, like a dictionary(dictionary.cambridge.org). should be structured and written in markdown."}' +
        '}' +
        '\n```' +
        '##Context of the source text: ' +
        '\n```json' +
        '{' +
        '\n "siteTitle": {"value": "%{siteTitle}", "description": "this is the title of the website"},' +
        '\n "siteUrl": {"value": "%{siteUrl}", "description": "this is the url of the website"}' +
        '}' +
        '\n```' +
        '##Profile of the user: ' +
        '\n```json' +
        '{' +
        ' "nativeLanguage": {"value": "%{firstLanguage}", "description": "this is the native language of the user"}' +
        '}' +
        '\n```',
      user: 'Professor Davis, can you explain the following sentence in %{targetLanguage}: <%{sourceText}>',
    },
  },
} as const satisfies TaskRuntimeConfigs;

export const AGENT_SEEDS = {
  AI_CONFIGS: DEFAULT_AI_CONFIGS,
  TASK_RUNTIME_CONFIGS: DEFAULT_TASK_RUNTIME_CONFIGS,
};
