import type { TaskRuntimeConfig, TaskExecutor, TaskRuntimeConfigs, TaskType } from '@/agent/types';
import { AgentContext, AgentResult } from '@/agent/types';
import { createLogger } from '@/utils/logger';
import { renderTemplate } from '@/utils/template';
import { OpenAI } from 'openai';
import { AGENT_SEEDS } from './seeds';
import { agentStorage } from './storage';

abstract class BaseTaskExecutor implements TaskExecutor {
  abstract readonly taskType: TaskType;
  abstract runtimeConfig: TaskRuntimeConfig;

  abstract execute(context: AgentContext): Promise<AgentResult>;
}

export class TranslateExecutor extends BaseTaskExecutor {
  readonly log = createLogger('TranslateExecutor');

  readonly taskType = 'translate';
  runtimeConfig: TaskRuntimeConfig = AGENT_SEEDS.TASK_RUNTIME_CONFIGS.translate;


  async init() {
    this.runtimeConfig = await agentStorage.taskConfigs.getValue()
      .then((configs) => configs[this.taskType]);

    agentStorage.taskConfigs.watch((newConfigs: TaskRuntimeConfigs) => {
      this.runtimeConfig = newConfigs[this.taskType];
    });
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    const runtimeConfig = this.runtimeConfig;
    const aiConfig = AGENT_SEEDS.AI_CONFIGS_BY_ID[runtimeConfig.aiConfigId];

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

      return { ok: true, data: response.choices[0].message.content || 'empty response' };
    } catch (error) {
      this.log.error('perform', { error });
      return { ok: false, error: (error as Error).message };
    }
  }
}
