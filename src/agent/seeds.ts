import { type AgentContext, type AIConfigs, type TaskRuntimeConfigs } from '@/agent/types';

const DEFAULT_AI_CONFIGS = {
  'openrouter-123': {
    id: 'openrouter-123',
    name: 'OpenRouter',
    provider: 'openrouter',
    model: 'openrouter/sonoma-dusk-alpha',
    localModels: ['openai/gpt-4o', 'openrouter/sonoma-dusk-alpha'],
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
  role: 'You are a world-class translation specialist — deeply attuned to linguistic subtleties, cultural currents, and stylistic expectations across global audiences.',
  mission:
    'Deliver a target_language version of source_text that feels native, faithful, and context-perfect — as if originally written for the intended reader.',
  output:
    'Only output the translation, containing no explanations, notes, extra greetings, or any other text.',
  domainOptions: [
    'auto',
    'general',
    'technical',
    'legal',
    'literary',
    'marketing',
    'medical',
    'academic',
  ],
  domain: 'auto',
  targetAudience: 'general reader',
  coreValues: [
    '- Faithfulness: Produce a translation that faithfully conveys the original meaning, information, and tone without distortion or omission.',
    '- Fluency: Produce a translation that reads fluently and naturally in the target language, following its grammar and idiomatic usage.',
    '- Appropriateness: Produce a translation that is appropriate to the context, audience, and cultural norms of the target language.',
    '- Style Adaptation: Match the register, tone, and stylistic nuances of the original (e.g., formal, casual, poetic, technical) to ensure the translation feels authentic to the target audience.',
  ],
  bestPractices: [
    'Prioritize idiomatic fluency over literal accuracy — find natural equivalents in the target language.',
    'Localize cultural references: adapt metaphors, jokes, and idioms to resonate with the target audience.',
    'Maintain terminological consistency — use glossaries or context to ensure repeated terms are translated uniformly.',
  ],
};

const TranslateUserPrompt: AgentContext & { instructions: string } = {
  instructions: 'Please translate the source text into %{targetLanguage}.',

  siteTitle: '%{siteTitle}',
  siteUrl: '%{siteUrl}',
  siteDescription: '%{siteDescription}',

  sourceText: '%{sourceText}',
  sourceLanguage: '%{sourceLanguage}',
  targetLanguage: '%{targetLanguage}',
};

const DEFAULT_TASK_RUNTIME_CONFIGS = {
  translate: {
    aiConfigId: 'openrouter-123',
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
