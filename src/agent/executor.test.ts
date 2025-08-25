/**
 * Tests for TranslateExecutor (Jest)
 * Framework: Jest (jest.mock/jest.fn, expect, describe/it)
 *
 * This suite focuses on:
 *  - init(): reads persisted runtime configs and watches for changes
 *  - execute(): happy path, missing AI config, missing API key, empty OpenAI response, and OpenAI error
 *  - Verifies OpenAI client is constructed with expected parameters and prompts are rendered via renderTemplate
 */

import { jest } from '@jest/globals';

// Import the SUT (TranslateExecutor). Adjust path if needed.
import { TranslateExecutor } from './executor';

// --- Mocks ---

// Mock logger
jest.unstable_mockModule('@/utils/logger', () => ({
  createLogger: jest.fn(() => ({
    error: jest.fn(),
  })),
}));

// Mock template rendering
const renderTemplateMock = jest.fn((tmpl: string, ctx: any) => {
  return tmpl
    .replace(/\{\{\s*input\s*\}\}/g, String(ctx?.input ?? ''))
    .replace(/\{\{\s*lang\s*\}\}/g, String(ctx?.lang ?? ''));
});
jest.unstable_mockModule('@/utils/template', () => ({
  renderTemplate: renderTemplateMock,
}));

// Mock agent storage
type Watcher<T> = (cfg: T | undefined) => void;
let taskConfigWatcher: Watcher<any> | null = null;

const defaultTranslateRuntimeConfig = {
  aiConfigId: 'openai-default',
  temperature: 0.2,
  prompt: {
    system: 'You are a translator to {{lang}}.',
    user: 'Translate: {{input}}',
  },
};

let agentTaskConfigsValue: any = undefined;
let agentAIConfigsValue: any = {
  'openai-default': {
    baseUrl: 'https://api.openai.example/v1',
    apiKey: 'sk-test',
    model: 'gpt-4o-mini',
  },
};

const agentStorageMock = {
  taskConfigs: {
    getValue: jest.fn(async () => agentTaskConfigsValue),
    watch: jest.fn((fn: Watcher<any>) => {
      taskConfigWatcher = fn;
    }),
  },
  aiConfigs: {
    getValue: jest.fn(async () => agentAIConfigsValue),
  },
};
jest.unstable_mockModule('./storage', () => ({
  agentStorage: agentStorageMock,
}));

// Mock seeds
jest.unstable_mockModule('./seeds', () => ({
  AGENT_SEEDS: {
    TASK_RUNTIME_CONFIGS: {
      translate: defaultTranslateRuntimeConfig,
    },
  },
}));

// Mock OpenAI
const createResponse = (content: string) => ({
  choices: [{ message: { content } }],
});
const chatCompletionsCreate = jest.fn(async () => createResponse('OK'));
const OpenAIConstructor = jest.fn().mockImplementation((_cfg: any) => ({
  chat: { completions: { create: chatCompletionsCreate } },
}));
jest.unstable_mockModule('openai', () => ({
  OpenAI: OpenAIConstructor,
}));

// Now, after setting up ESM mocks, dynamically import testing APIs and SUT
const { describe, it, expect, beforeEach, afterEach } = await import('@jest/globals');
const { createLogger } = await import('@/utils/logger');

const freshExecutor = async () => {
  const mod = await import('./executor');
  const ex = new mod.TranslateExecutor();
  if ((ex as any).init) {
    await (ex as any).init();
  }
  return ex;
};

const resetState = () => {
  agentTaskConfigsValue = undefined;
  agentAIConfigsValue = {
    'openai-default': {
      baseUrl: 'https://api.openai.example/v1',
      apiKey: 'sk-test',
      model: 'gpt-4o-mini',
    },
  };
  renderTemplateMock.mockClear();
  chatCompletionsCreate.mockClear();
  (OpenAIConstructor as any).mockClear();
  agentStorageMock.taskConfigs.getValue.mockClear();
  agentStorageMock.taskConfigs.watch.mockClear();
  agentStorageMock.aiConfigs.getValue.mockClear();
  (createLogger as any).mockClear?.();
};

beforeEach(() => {
  jest.useFakeTimers();
  resetState();
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe('TranslateExecutor.init', () => {
  it('loads runtime config from storage when available; otherwise uses default seeds', async () => {
    // Case A: No stored config => uses seeds
    let ex = await freshExecutor();
    expect(agentStorageMock.taskConfigs.getValue).toHaveBeenCalledTimes(1);
    expect((ex as any).runtimeConfig).toEqual(defaultTranslateRuntimeConfig);

    // Case B: Stored config exists and overrides seeds
    const custom = {
      ...defaultTranslateRuntimeConfig,
      temperature: 0.9,
      prompt: { system: 'S', user: 'U' },
    };
    agentTaskConfigsValue = { translate: custom };
    ex = await freshExecutor();
    expect((ex as any).runtimeConfig).toEqual(custom);
  });

  it('subscribes to storage.watch and updates runtimeConfig on changes', async () => {
    const ex = await freshExecutor();
    expect(agentStorageMock.taskConfigs.watch).toHaveBeenCalledTimes(1);
    const nextCfg = {
      ...defaultTranslateRuntimeConfig,
      temperature: 0.55,
      prompt: { system: 'SYS', user: 'USR' },
    };
    taskConfigWatcher?.({ translate: nextCfg });
    expect((ex as any).runtimeConfig).toEqual(nextCfg);
    const unchanged = (ex as any).runtimeConfig;
    taskConfigWatcher?.({ other: { foo: 'bar' } as any });
    expect((ex as any).runtimeConfig).toBe(unchanged);
  });
});

describe('TranslateExecutor.execute', () => {
  it('returns ok=true with model content on happy path and renders prompts with context', async () => {
    const ex = await freshExecutor();
    chatCompletionsCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'Translated text' } }],
    });

    const ctx = { input: 'Hello', lang: 'es' };
    const result = await ex.execute(ctx as any);

    expect(renderTemplateMock).toHaveBeenCalledTimes(2);
    expect(renderTemplateMock).toHaveBeenNthCalledWith(
      1,
      defaultTranslateRuntimeConfig.prompt.system,
      ctx
    );
    expect(renderTemplateMock).toHaveBeenNthCalledWith(
      2,
      defaultTranslateRuntimeConfig.prompt.user,
      ctx
    );

    expect(OpenAIConstructor).toHaveBeenCalledWith({
      baseURL: 'https://api.openai.example/v1',
      apiKey: 'sk-test',
      dangerouslyAllowBrowser: true,
    });

    expect(chatCompletionsCreate).toHaveBeenCalledWith({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a translator to es.' },
        { role: 'user', content: 'Translate: Hello' },
      ],
      temperature: defaultTranslateRuntimeConfig.temperature,
    });

    expect(result).toEqual({ ok: true, data: 'Translated text' });
  });

  it('returns error when AI config not found', async () => {
    agentAIConfigsValue = {
      'another-id': { baseUrl: 'x', apiKey: 'y', model: 'z' },
    };
    const ex = await freshExecutor();
    const res = await ex.execute({} as any);
    expect(res).toEqual({ ok: false, error: 'AI config not found' });
    expect(OpenAIConstructor).not.toHaveBeenCalled();
  });

  it('returns error when API key is not set', async () => {
    agentAIConfigsValue = {
      'openai-default': { baseUrl: 'https://api', apiKey: '', model: 'm' },
    };
    const ex = await freshExecutor();
    const res = await ex.execute({} as any);
    expect(res).toEqual({ ok: false, error: 'API key is not set' });
    expect(OpenAIConstructor).not.toHaveBeenCalled();
  });

  it('returns error when OpenAI returns empty or whitespace-only message', async () => {
    const ex = await freshExecutor();

    chatCompletionsCreate.mockResolvedValueOnce({ choices: [{ message: { content: '' } }] });
    let res = await ex.execute({} as any);
    expect(res).toEqual({ ok: false, error: 'empty response' });

    chatCompletionsCreate.mockResolvedValueOnce({ choices: [{ message: { content: '   ' } }] });
    res = await ex.execute({} as any);
    expect(res).toEqual({ ok: false, error: 'empty response' });
  });

  it('handles OpenAI errors by logging and returning ok=false with message', async () => {
    const ex = await freshExecutor();

    const err = new Error('network down');
    chatCompletionsCreate.mockRejectedValueOnce(err);

    const res = await ex.execute({ input: 'Hello', lang: 'fr' } as any);
    expect(res.ok).toBe(false);
    expect((res as any).error).toBe('network down');

    const logger = (createLogger as any).mock.results[0].value;
    expect(logger.error).toHaveBeenCalledWith('execute', { error: err });
  });
});