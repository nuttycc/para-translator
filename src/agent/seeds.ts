import type { AIConfigs, TaskRuntimeConfigs } from '@/agent/types';

const DEFAULT_AI_CONFIGS = {
  'openrouter-123': {
    id: 'openrouter-123',
    name: 'OpenRouter',
    provider: 'openrouter',
    model: 'x-ai/grok-4-fast:free',
    localModels: ['openai/gpt-4o', 'x-ai/grok-4-fast:free'],
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
  'siliconflow-123': {
    id: 'siliconflow-123',
    name: 'Siliconflow',
    provider: 'siliconflow',
    model: 'tencent/Hunyuan-MT-7B',
    localModels: ['tencent/Hunyuan-MT-7B'],
    apiKey: '',
    baseUrl: 'https://api.siliconflow.com/v1',
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

const TranslateUserPrompt = {
  instructions: 'Please translate the source text from %{sourceLanguage} to %{targetLanguage}.',
  sourceContext: {
    siteTitle: '%{siteTitle}',
    siteUrl: '%{siteUrl}',
    siteDescription: '%{siteDescription}',
  },
  sourceText: '%{sourceText}',
};

const ExplainSystemPrompt = {
  role: 'You are a master language deconstructor — trained to dissect sentences like a linguist, teach like a patient tutor, and illuminate grammar, structure, and vocabulary so learners truly *get it*.',
  mission:
    'Break down the provided source_text into its core linguistic components — explain grammar rules, sentence structure, key vocabulary, and common pitfalls — tailored to the learner’s level. Never assume prior knowledge.',

  learnerProfile: {
    nativeLanguage: '%{targetLanguage}',
    learningLanguage: '%{sourceLanguage}',
    level: 'intermediate', //['beginner', 'intermediate', 'advanced'],
  },

  focusAreas: ['grammar', 'structure', 'vocabulary'],

  constraints: [
    'explain in %{targetLanguage}',
    'keep explanation short and concise',
    'Keep at most 3 key points per focus area',
  ],
  style: ['prefer short sentences', 'prefer simple words', 'prefer clear examples'],

  output:
    'Output ONLY in clean, well-structured and concise Markdown. Use headings, bullet points, bold/italic, and code blocks for clarity. No greetings, no fluff.',
};

const DEFAULT_TASK_RUNTIME_CONFIGS = {
  translate: {
    aiConfigId: 'openrouter-123',
    temperature: 0.7,
    prompt: {
      system: JSON.stringify(TranslateSystemPrompt),
      user: JSON.stringify(TranslateUserPrompt),
    },
  },
  explain: {
    aiConfigId: 'openrouter-123',
    temperature: 0.7,
    prompt: {
      system: JSON.stringify(ExplainSystemPrompt),
      user: 'Can you explain the following sentence: <%{sourceText}>',
    },
  },
} as const satisfies TaskRuntimeConfigs;

export const AGENT_SEEDS = {
  AI_CONFIGS: DEFAULT_AI_CONFIGS,
  TASK_RUNTIME_CONFIGS: DEFAULT_TASK_RUNTIME_CONFIGS,
};
