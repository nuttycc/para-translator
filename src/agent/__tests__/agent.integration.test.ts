// @vitest-environment node

import { describe, it, expect, beforeAll } from 'vitest';

import { getLangAgent } from '@/agent/agent';
import type { AgentContext } from '../types';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

describe('LangAgent Integration Tests', () => {
  beforeAll(() => {
    if (!GROQ_API_KEY) {
      console.warn('VITE_GROQ_API_KEY not found in environment variables');
    }
  });

  describe('AIConfigManager Configuration Tests', () => {
    it('should update default config with API key from environment', async () => {
      const langAgent = await getLangAgent();
      const aiConfigManager = langAgent.aiConfigManager;
      const groqConfig = aiConfigManager.getById('groq-123');

      expect(groqConfig).toBeDefined();

      if (GROQ_API_KEY) {
        const updatedConfig = await aiConfigManager.update('groq-123', {
          apiKey: GROQ_API_KEY,
        });

        expect(updatedConfig?.apiKey).toBe(GROQ_API_KEY);
      } else {
        console.warn('Skipping API key update test - VITE_GROQ_API_KEY not available');
      }
    });
  });

  describe('Real API Integration Tests', () => {
    it('should perform translation with real API call', async () => {
      if (!GROQ_API_KEY) {
        console.warn('Skipping real API test - VITE_GROQ_API_KEY not available');
        expect(true).toBe(true);
        return;
      }

      const taskType = 'translate';
      const sourceText = 'Hello world';

      const langAgent = await getLangAgent();
      const aiConfigManager = langAgent.aiConfigManager;

      await aiConfigManager.update('groq-123', { apiKey: GROQ_API_KEY });

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
