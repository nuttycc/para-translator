import type { AIConfigs, TaskRuntimeConfigs } from '@/agent/types';

const DEFAULT_AI_CONFIGS = {
  'chutes-123': {
    id: 'chutes-123',
    name: 'Chutes',
    provider: 'chutes',
    model: 'chutes-123',
    localModels: ['zai-org/GLM-4.5-Air', 'openai/gpt-oss-20b', 'meituan-longcat/LongCat-Flash-Chat-FP8'],
    apiKey: '',
    baseUrl: 'https://llm.chutes.ai/v1',
    createdAt: 0,
    updatedAt: 0,
  },
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
  persona:
    "You are a professional localization expert guided by Skopos Theory, Dynamic Equivalence, and the 'Faithfulness–Expressiveness–Elegance' principle. You prioritize reader experience, cultural resonance, and functional impact over literal fidelity.",
  mission:
    'Transform the source_text into target_language so seamlessly that the target audience experiences the same intent, tone, and emotional response as the original—producing a translation that feels native, purpose-driven, and publish-ready.',
  targetAudience: 'general reader',
  formatting_rules: 'Separate CJK and non-CJK text with a single space.',
  output:
    'Output ONLY the translation result, without any explanations, notes, greetings, or any other extra text. ',
  example: 'Source text: Hello, World!\nYour output should be: 你好，世界！',
};

const TranslateUserPrompt = {
  instructions:
    'Translate the source text to %{targetLanguage}. Output ONLY the translated text, without any explanations, notes, greetings, or any other extra content.',
  sourceText: '%{sourceText}',
  context: {
    siteTitle: '%{siteTitle}',
    siteUrl: '%{siteUrl}',
    siteDescription: '%{siteDescription}',
  },
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
