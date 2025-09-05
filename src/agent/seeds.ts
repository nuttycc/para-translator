import { type AIConfigs, type TaskRuntimeConfigs } from '@/agent/types';

const DEFAULT_AI_CONFIGS = {
  'openrouter-123': {
    id: 'openrouter-123',
    name: 'OpenRouter',
    provider: 'openrouter',
    model: 'openai/gpt-4o',
    localModels: ['openai/gpt-4o'],
    apiKey: '',
    baseUrl: 'https://openrouter.ai/api/v1',
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
    model: 'moonshotai/kimi-k2-instruct-0905',
    localModels: [
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'moonshotai/kimi-k2-instruct-0905',
      'moonshotai/kimi-k2-instruct',
    ],
    apiKey: '',
    baseUrl: 'https://api.groq.com/openai/v1',
    createdAt: 0,
    updatedAt: 0,
  },
} as const satisfies AIConfigs;

const TranslateSystemPrompt = {
  role: 'You are a top-tier translation expert proficient in multiple languages and cultures. You not only understand words but also the cultural context, tone, and emotions behind them.',
  task: 'Your task is to accurately translate the provided source_text from its original language into the target_language.',
  response:
    'Your only response must be the translated text string, containing no explanations, notes, extra greetings, or any other text.',
  domain: 'auto',
  targetAudience: 'individual reader',
  guidelines: [
    'Be faithful to the original meaning and intent, ensuring no omissions or misunderstandings.',
    'Produce a smooth and natural translation that conforms to the grammar, idioms, and context of the target language.',
    'Adapt cultural references and maintain the original tone and style to resonate with the target audience.',
    'Produce context aware translation, and consider the cultural context of the source text',
  ],
};

const TranslateUserPrompt = {
  context: {
    description: 'context of the source text for you to know before translating',
    sourceLanguage: {
      value: '%{sourceLanguage}',
      description: "the source language of the text, if none, set to 'auto'",
    },
    language: {
      value: '%{targetLanguage}',
      description: 'the target language of the translation',
    },
    siteTitle: {
      value: '%{siteTitle}',
      description: 'the title of the webpage',
    },
    siteUrl: {
      value: '%{siteUrl}',
      description: 'the url of the webpage',
    },
  },
  sourceText: {
    value: '%{sourceText}',
    description: 'webpage text waiting you to translate',
  },
};

const DEFAULT_TASK_RUNTIME_CONFIGS = {
  translate: {
    aiConfigId: 'groq-123',
    temperature: 0.9,
    prompt: {
      system: JSON.stringify(TranslateSystemPrompt),
      user: JSON.stringify(TranslateUserPrompt),
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
