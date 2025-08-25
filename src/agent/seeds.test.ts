/**
 * Unit tests for AGENT_SEEDS
 *
 * Test framework note:
 * - These tests use Jest/Vitest-compatible global APIs: describe, it/test, expect.
 * - No framework-specific imports are used, so they should run under either Jest or Vitest.
 *
 * Scope:
 * - Focused on validating the exported public surface: AGENT_SEEDS.AI_CONFIGS and AGENT_SEEDS.TASK_RUNTIME_CONFIGS.
 * - Covers structure, expected values (per diff), referential integrity, placeholder presence, and edge constraints.
 */

/* Helper utilities for assertions */
function expectPlaceholders(template: string, placeholders: string[]) {
  for (const ph of placeholders) {
    expect(template).toContain(`%{${ph}}`);
  }
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function expectArrayOfStrings(arr: unknown) {
  expect(Array.isArray(arr)).toBe(true);
  for (const item of arr as unknown[]) {
    expect(typeof item).toBe('string');
  }
}

describe('AGENT_SEEDS integrity', () => {
  it('exposes AI_CONFIGS and TASK_RUNTIME_CONFIGS objects', () => {
    // Prefer local binding if the snippet defined AGENT_SEEDS in this file.
    // If this file only contains tests, ensure the project exports AGENT_SEEDS from src/agent/seeds.ts
    // and consider importing it here. We avoid static imports to keep compatibility with either case.
    expect(typeof AGENT_SEEDS).toBe('object');
    expect(AGENT_SEEDS).toHaveProperty('AI_CONFIGS');
    expect(AGENT_SEEDS).toHaveProperty('TASK_RUNTIME_CONFIGS');
  });
});

describe('AGENT_SEEDS.AI_CONFIGS', () => {
  const configs = (AGENT_SEEDS as any).AI_CONFIGS as Record<string, any>;

  it('contains expected config ids', () => {
    expect(Object.keys(configs)).toEqual(
      expect.arrayContaining(['deepseek-123', 'glm-123', 'groq-123'])
    );
  });

  it('each config has required shape and defaults', () => {
    for (const [id, cfg] of Object.entries(configs)) {
      // Required keys exist
      expect(cfg).toHaveProperty('id', id);
      expect(cfg).toHaveProperty('provider');
      expect(cfg).toHaveProperty('model');
      expect(cfg).toHaveProperty('localModels');
      expect(cfg).toHaveProperty('apiKey', '');
      expect(cfg).toHaveProperty('baseUrl');
      expect(cfg).toHaveProperty('createdAt', 0);
      expect(cfg).toHaveProperty('updatedAt', 0);

      // Types and ranges
      expect(isNonEmptyString(cfg.provider)).toBe(true);
      expect(isNonEmptyString(cfg.model)).toBe(true);
      expect(isNonEmptyString(cfg.baseUrl)).toBe(true);
      expect(cfg.baseUrl.startsWith('http')).toBe(true);

      // localModels validity
      expectArrayOfStrings(cfg.localModels);
      expect(cfg.localModels.length).toBeGreaterThan(0);
      // model must be included in localModels
      expect(cfg.localModels).toEqual(expect.arrayContaining([cfg.model]));
      // no duplicate local models
      const unique = new Set(cfg.localModels);
      expect(unique.size).toBe(cfg.localModels.length);
    }
  });

  describe('deepseek-123', () => {
    const cfg = (configs as any)['deepseek-123'];
    it('matches expected fields', () => {
      expect(cfg).toMatchObject({
        id: 'deepseek-123',
        provider: 'deepseek',
        model: 'deepseek-chat',
        apiKey: '',
        baseUrl: 'https://api.deepseek.com/v1/',
        createdAt: 0,
        updatedAt: 0,
      });
    });
    it('has required local models', () => {
      expect(cfg.localModels).toEqual(
        expect.arrayContaining(['deepseek-chat', 'deepseek-reasoner'])
      );
    });
  });

  describe('glm-123', () => {
    const cfg = (configs as any)['glm-123'];
    it('matches expected fields', () => {
      expect(cfg).toMatchObject({
        id: 'glm-123',
        provider: 'glm',
        model: 'glm-4.5-flash',
        apiKey: '',
        baseUrl: 'https://open.bigmodel.cn/api/paas/v4/',
        createdAt: 0,
        updatedAt: 0,
      });
    });
    it('has required local models', () => {
      expect(cfg.localModels).toEqual(
        expect.arrayContaining(['glm-4.5-flash'])
      );
    });
  });

  describe('groq-123', () => {
    const cfg = (configs as any)['groq-123'];
    it('matches expected fields', () => {
      expect(cfg).toMatchObject({
        id: 'groq-123',
        provider: 'groq',
        model: 'openai/gpt-oss-20b',
        apiKey: '',
        baseUrl: 'https://api.groq.com/openai/v1',
        createdAt: 0,
        updatedAt: 0,
      });
    });
    it('has required local models', () => {
      expect(cfg.localModels).toEqual(
        expect.arrayContaining(['openai/gpt-oss-20b', 'moonshotai/kimi-k2-instruct'])
      );
    });
  });
});

describe('AGENT_SEEDS.TASK_RUNTIME_CONFIGS', () => {
  const tasks = (AGENT_SEEDS as any).TASK_RUNTIME_CONFIGS as Record<string, any>;
  const configs = (AGENT_SEEDS as any).AI_CONFIGS as Record<string, any>;

  it('contains expected tasks', () => {
    expect(Object.keys(tasks)).toEqual(
      expect.arrayContaining(['translate', 'explain'])
    );
  });

  it('each task references an existing AI config and has valid temperature', () => {
    for (const [taskName, task] of Object.entries(tasks)) {
      expect(task).toHaveProperty('aiConfigId');
      expect(task).toHaveProperty('temperature');
      expect(task).toHaveProperty('prompt');
      expect(typeof task.prompt).toBe('object');
      expect(task.prompt).toHaveProperty('system');
      expect(task.prompt).toHaveProperty('user');

      // reference integrity
      expect(configs).toHaveProperty(task.aiConfigId);

      // temperature constraints: 0.0 <= t <= 1.0
      expect(typeof task.temperature).toBe('number');
      expect(Number.isNaN(task.temperature)).toBe(false);
      expect(task.temperature).toBeGreaterThanOrEqual(0);
      expect(task.temperature).toBeLessThanOrEqual(1);
    }
  });

  describe('translate task', () => {
    const t = (tasks as any).translate;
    it('matches expected aiConfigId and temperature', () => {
      expect(t.aiConfigId).toBe('groq-123');
      expect(t.temperature).toBeCloseTo(0.7, 5);
    });
    it('has required placeholders in user prompt', () => {
      const user = t.prompt.user as string;
      expect(isNonEmptyString(user)).toBe(true);
      expect(user.startsWith('Translate the following text into')).toBe(true);
      expectPlaceholders(user, ['targetLanguage', 'sourceText', 'siteTitle', 'siteUrl']);
      // sanity: includes additional info lines per diff
      expect(user).toContain('Here is some additional information');
    });
    it('system prompt conveys translator role', () => {
      const sys = t.prompt.system as string;
      expect(sys).toContain('professional translator');
      expect(sys).toContain('translate the source text');
    });
  });

  describe('explain task', () => {
    const e = (tasks as any).explain;
    it('matches expected aiConfigId and temperature', () => {
      expect(e.aiConfigId).toBe('groq-123');
      expect(e.temperature).toBeCloseTo(0.3, 5);
    });
    it('has required placeholders in user prompt', () => {
      const user = e.prompt.user as string;
      expect(user).toBe('Explain the following text in %{targetLanguage}: %{sourceText}');
      expectPlaceholders(user, ['targetLanguage', 'sourceText']);
    });
    it('system prompt conveys language teacher role', () => {
      const sys = e.prompt.system as string;
      expect(sys).toBe(
        'You are a professional Language teacher. Your task is to explain the source text in a way that is easy to understand for language learners.'
      );
    });
  });
});