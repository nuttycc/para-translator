import { OpenAIBaseExecutor } from '@/agent/executor/base';
import { AGENT_SEEDS } from '@/agent/seeds';
import { agentStorage } from '@/agent/storage';
import type { AgentContext, AIConfigs, TaskRuntimeConfigs } from '@/agent/types';
import OpenAI from 'openai';

export class TranslateExecutor extends OpenAIBaseExecutor {
  readonly taskType = 'translate';

  async init() {
    const loaded = await agentStorage.taskConfigs.getValue().catch(() => undefined);
    this.runtimeConfig = loaded?.[this.taskType] ?? AGENT_SEEDS.TASK_RUNTIME_CONFIGS[this.taskType];

    agentStorage.taskConfigs.watch((newConfigs: TaskRuntimeConfigs | undefined) => {
      const nextCfg = newConfigs?.[this.taskType];
      if (nextCfg) this.runtimeConfig = nextCfg;
    });

    await this.createOpenAIClient(this.runtimeConfig.aiConfigId);
  }

  async createOpenAIClient(configId: string) {
    const aiConfig = await agentStorage.aiConfigs
      .getValue()
      .then((configs: AIConfigs) => configs[configId]);

    if (!aiConfig) {
      throw new Error(`AI config not found for ${this.taskType}`);
    }

    if (!aiConfig.apiKey) {
      throw new Error(`API key is not set for ${this.taskType}`);
    }

    const openai = new OpenAI({
      baseURL: aiConfig.baseUrl,
      apiKey: aiConfig.apiKey,
      dangerouslyAllowBrowser: true,
    });
    this.openai = openai;
    this.model = aiConfig.model;
  }

  async execute(context: AgentContext): Promise<string> {
    return this.executeBase(context);
  }
}
