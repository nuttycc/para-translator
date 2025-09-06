import { OpenAI } from 'openai';
import { z } from 'zod';

import { OpenAIBaseExecutor } from '@/agent/executor/base';
import { AGENT_SEEDS } from '@/agent/seeds';
import { agentStorage } from '@/agent/storage';
import type { AgentContext, AIConfigs, TaskRuntimeConfigs } from '@/agent/types';

const ResponseFormat = z.object({
  translatedText: z.string(),
  grammar: z.string(),
  vocabulary: z.string(),
});

export type ResponseFormatType = z.infer<typeof ResponseFormat>;

export class ExplainExecutor extends OpenAIBaseExecutor {
  readonly taskType = 'explain';
  private initPromise: Promise<void> | null = null;
  private unwatchTaskConfigs: (() => void) | null = null;

  async init() {
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      const loaded = await agentStorage.taskConfigs.getValue().catch(() => undefined);
      this.runtimeConfig =
        loaded?.[this.taskType] ?? AGENT_SEEDS.TASK_RUNTIME_CONFIGS[this.taskType];

      await this.createOpenAIClient(this.runtimeConfig.aiConfigId);

      // register watcher after client is ready (see next comment)
      this.unwatchTaskConfigs = agentStorage.taskConfigs.watch(
        (newConfigs: TaskRuntimeConfigs | null | undefined) => {
          const nextCfg = newConfigs?.[this.taskType];
          if (!nextCfg) return;
          const prevId = this.runtimeConfig.aiConfigId;
          this.runtimeConfig = nextCfg;
          if (nextCfg.aiConfigId !== prevId) {
            void this.createOpenAIClient(nextCfg.aiConfigId);
          }
        }
      );
    })();
    return this.initPromise;
  }

  // Ensure watchers are cleaned up
  dispose() {
    this.unwatchTaskConfigs?.();
    this.unwatchTaskConfigs = null;
  }

  async createOpenAIClient(configId: string) {
    const aiConfig = await agentStorage.aiConfigs
      .getValue()
      .then((configs: AIConfigs | null) => configs?.[configId]);

    if (!aiConfig) {
      throw new Error(`AI config not found for ${this.taskType}`);
    }

    if (!aiConfig.apiKey) {
      throw new Error(`API key is not set for ${this.taskType}`);
    }

    this.openai = new OpenAI({
      baseURL: aiConfig.baseUrl,
      apiKey: aiConfig.apiKey,
      dangerouslyAllowBrowser: true,
    });
    this.model = aiConfig.model;
  }

  async execute(context: AgentContext): Promise<string> {
    return this.executeBase(context, true, ResponseFormat.shape);
  }
}
