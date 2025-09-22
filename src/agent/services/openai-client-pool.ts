import { OpenAI } from 'openai';

import { agentStorage } from '@/agent/storage';
import { createLogger } from '@/utils/logger';

import type { OpenAIClient } from '@/agent/tasks/types';

const log = createLogger('OpenAIClientPool');

export class OpenAIClientPool {
  private pool = new Map<string, OpenAIClient>();

  async get(aiConfigId: string): Promise<OpenAIClient> {
    const cached = this.pool.get(aiConfigId);
    if (cached) {
      return cached;
    }

    log.info`Creating new OpenAI client for config: ${aiConfigId}`;

    const configs = await agentStorage.ai.getValue();
    const aiConfig = configs?.[aiConfigId];

    if (!aiConfig) {
      throw new Error(`AI config not found: ${aiConfigId}`);
    }

    if (!aiConfig.apiKey) {
      throw new Error(`API key is not set for config: ${aiConfigId}`);
    }

    const openai = new OpenAI({
      baseURL: aiConfig.baseUrl,
      apiKey: aiConfig.apiKey,
      dangerouslyAllowBrowser: true,
    });

    const client: OpenAIClient = {
      openai,
      model: aiConfig.model,
    };

    this.pool.set(aiConfigId, client);
    return client;
  }

  invalidate(aiConfigId: string): void {
    log.info`Invalidating OpenAI client for config: ${aiConfigId}`;
    this.pool.delete(aiConfigId);
  }

  clear(): void {
    log.info`Clearing all OpenAI clients`;
    this.pool.clear();
  }
}
