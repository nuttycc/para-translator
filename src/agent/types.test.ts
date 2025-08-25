/* 
  Tests for src/agent/types.ts (TypeScript types and constants)

  Framework note:
  - These tests use describe/test/expect, compatible with Jest and Vitest without additional APIs.
  - They include TypeScript type-level assertions via // @ts-expect-error on intentionally invalid assignments.
  - If your runner does not type-check test files, ensure your test environment compiles with TypeScript 
    (e.g., ts-jest for Jest or default TypeScript transform in Vitest) so @ts-expect-error lines are verified.

  Scope:
  - Focuses on the definitions added/modified in the PR diff: TASK_TYPES, TaskType, PromptUnit, TaskRuntimeConfig,
    TaskRuntimeConfigs, AgentContext, AgentResponse, AIConfig, AIConfigs, TaskExecutor and its specializations,
    and LangAgentSpec.
*/

import { describe, test, expect } from 'vitest'; // Vitest shim; if using Jest, it will be ignored by ts transpilers
// If the project uses Jest, the global describe/test/expect are available; importing from 'vitest' isn't required.
// To keep the file framework-agnostic, we avoid using vi/jest specific APIs.

// Re-import the subject under test. If these exports live in a different file (e.g., src/agent/types.ts), 
// adjust the import path accordingly. Because the PR snippet shows the code in this file, we conditionally
// fall back to relative import if present.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Try both possibilities in case of split files during the PR.
import * as TypesModule from './types';

type TaskType = TypesModule.TaskType;
const TASK_TYPES = TypesModule.TASK_TYPES;

describe('TASK_TYPES constant', () => {
  test('should contain exactly "translate" and "explain" in order', () => {
    expect(Array.isArray(TASK_TYPES)).toBe(true);
    expect(TASK_TYPES).toEqual(['translate', 'explain']);
    // Ensure no duplicates and exact length
    expect(new Set(TASK_TYPES).size).toBe(2);
    expect(TASK_TYPES.length).toBe(2);
  });

  test('should be readonly (attempting mutation should not alter contents)', () => {
    // @ts-expect-error TASK_TYPES is readonly tuple; push is not allowed at type level
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(() => (TASK_TYPES as unknown as string[]).push('other')).toThrow();

    // Verify that the contents are unchanged
    expect(TASK_TYPES).toEqual(['translate', 'explain']);
  });
});

describe('TaskType type', () => {
  test('accepts only values from TASK_TYPES', () => {
    const good1: TaskType = 'translate';
    const good2: TaskType = 'explain';
    expect(good1).toBe('translate');
    expect(good2).toBe('explain');

    // @ts-expect-error invalid task type should be rejected at compile time
    const bad1: TaskType = 'summarize';
    void bad1;
  });
});

describe('PromptUnit', () => {
  test('requires system and user strings', () => {
    const ok: TypesModule.PromptUnit = { system: 'sys', user: 'usr' };
    expect(ok.system).toBe('sys');
    expect(ok.user).toBe('usr');

    // Missing properties should be compile errors
    // @ts-expect-error missing user
    const missingUser: TypesModule.PromptUnit = { system: 's' };
    void missingUser;

    // @ts-expect-error wrong types
    const wrongTypes: TypesModule.PromptUnit = { system: 1, user: true };
    void wrongTypes;
  });
});

describe('TaskRuntimeConfig and TaskRuntimeConfigs', () => {
  test('valid config object satisfies the interface', () => {
    const prompt: TypesModule.PromptUnit = { system: 's', user: 'u' };
    const cfg: TypesModule.TaskRuntimeConfig = {
      aiConfigId: 'cfg-1',
      temperature: 0.5,
      prompt
    };
    expect(cfg.aiConfigId).toBe('cfg-1');
    expect(cfg.temperature).toBeCloseTo(0.5);
    expect(cfg.prompt).toEqual(prompt);
  });

  test('TaskRuntimeConfigs must include keys for all TaskType entries', () => {
    const baseCfg = (id: string): TypesModule.TaskRuntimeConfig => ({
      aiConfigId: id,
      temperature: 0.2,
      prompt: { system: 'sys', user: 'usr' }
    });

    const ok: TypesModule.TaskRuntimeConfigs = {
      translate: baseCfg('t1'),
      explain: baseCfg('e1')
    };
    expect(Object.keys(ok).sort()).toEqual(['explain', 'translate']);

    // Missing one required key
    // @ts-expect-error explain is required
    const missingExplain: TypesModule.TaskRuntimeConfigs = {
      translate: baseCfg('t2')
    };
    void missingExplain;

    // Extra arbitrary key should be compile-time error
    // @ts-expect-error only TaskType keys allowed
    const extraKey: TypesModule.TaskRuntimeConfigs = {
      translate: baseCfg('t3'),
      explain: baseCfg('e3'),
      summarize: baseCfg('s1')
    };
    void extraKey;

    // Wrong shape under a valid key should fail
    // @ts-expect-error prompt must be PromptUnit
    const wrongShape: TypesModule.TaskRuntimeConfigs = {
      translate: { aiConfigId: 'x', temperature: 1, prompt: 123 },
      explain: baseCfg('e2')
    };
    void wrongShape;
  });

  test('temperature must be a number', () => {
    const prompt = { system: 'S', user: 'U' };
    // @ts-expect-error temperature must be number
    const wrongTemp: TypesModule.TaskRuntimeConfig = {
      aiConfigId: 'id',
      temperature: '0.7',
      prompt
    };
    void wrongTemp;
  });
});

describe('AgentContext', () => {
  test('optional and required fields are enforced', () => {
    const ok: TypesModule.AgentContext = {
      sourceText: 'Hello',
      targetLanguage: 'fr'
    };
    expect(ok.targetLanguage).toBe('fr');

    // Missing required targetLanguage
    // @ts-expect-error targetLanguage is required
    const missingTarget: TypesModule.AgentContext = { sourceText: 'x' };
    void missingTarget;

    // Optional fields accept undefined
    const withOptional: TypesModule.AgentContext = {
      sourceText: 'Bonjour',
      targetLanguage: 'en',
      sourceLanguage: undefined,
      siteTitle: undefined,
      siteUrl: undefined
    };
    expect(withOptional.sourceLanguage).toBeUndefined();
  });
});

describe('AgentResponse', () => {
  test('ok true implies data present (runtime check) and error optional', () => {
    const ok: TypesModule.AgentResponse = { ok: true, data: 'result' };
    expect(ok.ok).toBe(true);
    expect(ok.data).toBe('result');
  });

  test('ok false may include error', () => {
    const fail: TypesModule.AgentResponse = { ok: false, error: 'boom' };
    expect(fail.ok).toBe(false);
    expect(fail.error).toBe('boom');
  });

  test('invalid shapes rejected by TS', () => {
    // @ts-expect-error data must be string
    const wrongData: TypesModule.AgentResponse = { ok: true, data: 123 };
    void wrongData;

    // @ts-expect-error ok must be boolean
    const wrongOk: TypesModule.AgentResponse = { ok: 'yes' };
    void wrongOk;
  });
});

describe('AIConfig and AIConfigs', () => {
  test('valid AIConfig object', () => {
    const now = Date.now();
    const cfg: TypesModule.AIConfig = {
      id: 'cfg1',
      provider: 'openai',
      model: 'gpt-4o',
      localModels: ['local-1'],
      remoteModels: ['remote-1'],
      apiKey: 'key',
      baseUrl: 'https://api.example.com',
      createdAt: now,
      updatedAt: now
    };
    expect(cfg.id).toBe('cfg1');
    expect(cfg.localModels).toContain('local-1');
    expect(cfg.remoteModels).toContain('remote-1');
    expect(cfg.createdAt).toBeLessThanOrEqual(now);
  });

  test('AIConfigs is a string-keyed record of AIConfig', () => {
    const ok: TypesModule.AIConfigs = {
      default: {
        id: 'default',
        provider: 'openai',
        model: 'gpt-4o',
        localModels: [],
        remoteModels: undefined,
        apiKey: 'k',
        baseUrl: 'https://api.example.com',
        createdAt: 1,
        updatedAt: 2
      }
    };
    expect(Object.keys(ok)).toContain('default');

    // @ts-expect-error value must be AIConfig
    const badValue: TypesModule.AIConfigs = { x: { id: 'x' } };
    void badValue;
  });
});

describe('TaskExecutor polymorphism', () => {
  test('TranslatorTaskExecutor enforces taskType "translate"', async () => {
    const executor: TypesModule.TranslatorTaskExecutor = {
      taskType: 'translate',
      async execute(ctx) {
        expect(ctx.targetLanguage).toBeDefined();
        return { ok: true, data: 'translated' };
      }
    };
    const res = await executor.execute({ sourceText: 'hi', targetLanguage: 'es' });
    expect(res).toEqual({ ok: true, data: 'translated' });

    // @ts-expect-error TranslatorTaskExecutor must have taskType "translate"
    const wrongExecutor: TypesModule.TranslatorTaskExecutor = {
      taskType: 'explain',
      async execute() { return { ok: true }; }
    };
    void wrongExecutor;
  });

  test('ExplainTaskExecutor enforces taskType "explain"', async () => {
    const executor: TypesModule.ExplainTaskExecutor = {
      taskType: 'explain',
      async execute(ctx) {
        expect(typeof ctx.sourceText).toBe('string');
        return { ok: true, data: 'explanation' };
      }
    };
    const res = await executor.execute({ sourceText: 'text', targetLanguage: 'en' });
    expect(res.ok).toBe(true);

    // @ts-expect-error ExplainTaskExecutor must have taskType "explain"
    const wrongExecutor: TypesModule.ExplainTaskExecutor = {
      taskType: 'translate',
      async execute() { return { ok: false, error: 'no' }; }
    };
    void wrongExecutor;
  });

  test('Generic TaskExecutor accepts any valid TaskType', () => {
    const makeExec = (t: TaskType): TypesModule.TaskExecutor => ({
      taskType: t,
      async execute() { return { ok: true, data: t }; }
    });

    const e1 = makeExec('translate');
    const e2 = makeExec('explain');
    expect(['translate', 'explain']).toContain(e1.taskType);
    expect(['translate', 'explain']).toContain(e2.taskType);

    // @ts-expect-error invalid task type
    const badExec: TypesModule.TaskExecutor = {
      taskType: 'summarize',
      async execute() { return { ok: true }; }
    };
    void badExec;
  });
});

describe('LangAgentSpec', () => {
  test('taskTypes equals TASK_TYPES and perform signature', async () => {
    const agent: TypesModule.LangAgentSpec = {
      taskTypes: TASK_TYPES,
      async perform(taskType, context) {
        if (taskType === 'translate') {
          return { ok: true, data: `to-${context.targetLanguage}` };
        }
        return { ok: true, data: `explain:${context.sourceText}` };
      }
    };

    // Perform translate
    const r1 = await agent.perform('translate', { sourceText: 'hi', targetLanguage: 'de' });
    expect(r1).toEqual({ ok: true, data: 'to-de' });

    // Perform explain
    const r2 = await agent.perform('explain', { sourceText: 'why?', targetLanguage: 'en' });
    expect(r2.ok).toBe(true);
    expect(r2.data).toMatch(/^explain:/);

    // @ts-expect-error invalid task type
    await agent.perform('summarize', { sourceText: 'x', targetLanguage: 'en' });
  });
});