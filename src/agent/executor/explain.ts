import { OpenAIBaseExecutor } from '@/agent/executor/base';
import { AGENT_SEEDS } from '@/agent/seeds';
import { agentStorage } from '@/agent/storage';
import type { AIConfigs, AgentContext, TaskRuntimeConfigs } from '@/agent/types';
import { OpenAI } from 'openai';
import { z } from 'zod';

const ResponseFormat = z.object({
  translatedText: z.string(),
  grammar: z.string(),
  vocabulary: z.string(),
});

export type ResponseFormatType = z.infer<typeof ResponseFormat>;

export class ExplainExecutor extends OpenAIBaseExecutor {
  readonly taskType = 'explain';
  private inited = false;

  async init() {
    if (this.inited) return;
    const loaded = await agentStorage.taskConfigs.getValue().catch(() => undefined);
    this.runtimeConfig = loaded?.[this.taskType] ?? AGENT_SEEDS.TASK_RUNTIME_CONFIGS[this.taskType];

    agentStorage.taskConfigs.watch((newConfigs: TaskRuntimeConfigs | null) => {
      const nextCfg = newConfigs?.[this.taskType];
      if (nextCfg) this.runtimeConfig = nextCfg;
    });

    await this.createOpenAIClient(this.runtimeConfig.aiConfigId);
    this.inited = true;
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
