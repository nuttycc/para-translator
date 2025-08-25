import type {
  TaskRuntimeConfig,
  TaskExecutor,
  TaskRuntimeConfigs,
  TaskType,
  AIConfigs,
} from '@/agent/types';
import { AgentContext, AgentResponse } from '@/agent/types';
import { createLogger } from '@/utils/logger';
import { renderTemplate } from '@/utils/template';
import { OpenAI } from 'openai';
import { AGENT_SEEDS } from './seeds';
import { agentStorage } from './storage';

abstract class BaseTaskExecutor implements TaskExecutor {
  abstract readonly taskType: TaskType;
  abstract runtimeConfig: TaskRuntimeConfig;

  abstract execute(context: AgentContext): Promise<AgentResponse>;
}

export class TranslateExecutor extends BaseTaskExecutor {
  readonly log = createLogger('TranslateExecutor');

  readonly taskType = 'translate';
  runtimeConfig: TaskRuntimeConfig = AGENT_SEEDS.TASK_RUNTIME_CONFIGS.translate;

  async init() {
    const loaded = await agentStorage.taskConfigs
      .getValue()
      .catch(() => undefined as unknown as TaskRuntimeConfigs | undefined);
    this.runtimeConfig = loaded?.[this.taskType] ?? AGENT_SEEDS.TASK_RUNTIME_CONFIGS.translate;

    agentStorage.taskConfigs.watch((newConfigs: TaskRuntimeConfigs | undefined) => {
      const nextCfg = newConfigs?.[this.taskType];
      if (nextCfg) this.runtimeConfig = nextCfg;
    });
  }

  async execute(context: AgentContext): Promise<AgentResponse> {
    const runtimeConfig = this.runtimeConfig;
    const aiConfig = await agentStorage.aiConfigs
      .getValue()
      .then((configs: AIConfigs) => configs[runtimeConfig.aiConfigId]);

    if (!aiConfig) {
      return { ok: false, error: 'AI config not found' };
    }

    if (!aiConfig.apiKey) {
      return { ok: false, error: 'API key is not set' };
    }

    const openai = new OpenAI({
      baseURL: aiConfig.baseUrl,
      apiKey: aiConfig.apiKey,
      dangerouslyAllowBrowser: true,
    });

    // Render prompts in a single pass with safe replacements
    const systemPrompt = renderTemplate(runtimeConfig.prompt.system, context);
    const userPrompt = renderTemplate(runtimeConfig.prompt.user, context);

    try {
      const response = await openai.chat.completions.create({
        model: aiConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: runtimeConfig.temperature,
      });
      const content = response.choices?.[0]?.message?.content ?? '';
      if (!content.trim()) {
        return { ok: false, error: 'empty response' };
      }
      return { ok: true, data: content };
    } catch (error) {
      this.log.error('execute', { error });
      return { ok: false, error: (error as Error).message };
    }
  }
}
