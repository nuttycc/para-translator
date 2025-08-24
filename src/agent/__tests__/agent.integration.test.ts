// @vitest-environment node

import { describe, it, expect, beforeAll } from 'vitest';

import { getLangAgent } from '@/agent/agent';
import type { AgentContext, AIConfig } from '@/agent/types';
import { agentStorage } from '../storage';
import { AGENT_SEEDS } from '@/agent/seeds';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string || undefined;

describe('LangAgent Integration Tests', () => {
  beforeAll(() => {
    if (!GROQ_API_KEY) {
      console.warn('VITE_GROQ_API_KEY not found in environment variables');
    }
  });

  describe('Config Tests', () => {
    it.skipIf(!GROQ_API_KEY)('should update default config with API key from environment', async () => {
      const aiConfigs = await agentStorage.aiConfigs.getValue();
      expect(aiConfigs).toBeDefined();

      const groqConfig = aiConfigs.find((config: AIConfig) => config.id === 'groq-123');

      console.log('[integration test] groqConfig', groqConfig);
      expect(groqConfig).toBeDefined();

      if (!groqConfig) return;
      const apiKey = GROQ_API_KEY as string;
      const updated = aiConfigs.map((c: AIConfig) =>
        c.id === 'groq-123' ? { ...c, apiKey } : c,
      );

      await agentStorage.aiConfigs.setValue(updated);
      const updatedAiConfigs = await agentStorage.aiConfigs.getValue().then((configs) => configs.find((config: AIConfig) => config.id === 'groq-123'));
      console.log('[integration test] updatedAiConfigs', updatedAiConfigs);

      expect(updatedAiConfigs).toBeDefined();
      expect(updatedAiConfigs?.apiKey).toBe(GROQ_API_KEY);
    });
  });

  describe('Real API Integration Tests', () => {
    it.skipIf(!GROQ_API_KEY)('should perform translation with real API call', async () => {

      const taskType = 'translate';
      const sourceText = 'Hello world';

      const langAgent = await getLangAgent();

      // update the API key in the config(in storage)
      await agentStorage.aiConfigs.getValue().then((configs) => configs.map((c: AIConfig) =>
        c.id === 'groq-123' ? { ...c, apiKey: GROQ_API_KEY as string } : c,
      )).then((configs) => agentStorage.aiConfigs.setValue(configs));

      const context: AgentContext = {
        sourceText,
        sourceLanguage: 'en',
        targetLanguage: 'zh-CN',
      };

      console.log('[integration test] about to call perform', {
        taskType,
        sourceText,
        targetLanguage: context.targetLanguage,
        hasApiKey: !!GROQ_API_KEY,
      });

      const result = await langAgent.perform(taskType, context);

      console.log('[integration test] perform result', result);

      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
    });
  });
});

