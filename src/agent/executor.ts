import type {
  AIConfigs,
  AgentContext,
  TaskExecutor,
  TaskRuntimeConfig,
  TaskRuntimeConfigs,
  TaskType,
} from '@/agent/types';
import { createLogger } from '@/utils/logger';
import { renderTemplate } from '@/utils/template';
import { OpenAI } from 'openai';
import { z } from 'zod';
import { AGENT_SEEDS } from './seeds';
import { agentStorage } from './storage';

const ResponseFormat = z.object({
  translatedText: z.string(),
  grammar: z.string(),
  vocabulary: z.string(),
});

export type ResponseFormatType = z.infer<typeof ResponseFormat>;

abstract class BaseTaskExecutor implements TaskExecutor {
  abstract readonly taskType: TaskType;
  abstract runtimeConfig: TaskRuntimeConfig;

  abstract execute(context: AgentContext): Promise<string>;
}

export class ExplainExecutor extends BaseTaskExecutor {
  readonly log = createLogger('TranslateExecutor');

  readonly taskType = 'explain';

  runtimeConfig: TaskRuntimeConfig = AGENT_SEEDS.TASK_RUNTIME_CONFIGS[this.taskType];

  async init() {
    const loaded = await agentStorage.taskConfigs
      .getValue()
      .catch(() => undefined as unknown as TaskRuntimeConfigs | undefined);
    this.runtimeConfig = loaded?.[this.taskType] ?? AGENT_SEEDS.TASK_RUNTIME_CONFIGS[this.taskType];

    agentStorage.taskConfigs.watch((newConfigs: TaskRuntimeConfigs | undefined) => {
      const nextCfg = newConfigs?.[this.taskType];
      if (nextCfg) this.runtimeConfig = nextCfg;
    });
  }

  async execute(context: AgentContext): Promise<string> {
    const runtimeConfig = this.runtimeConfig;
    const aiConfig = await agentStorage.aiConfigs
      .getValue()
      .then((configs: AIConfigs) => configs[runtimeConfig.aiConfigId]);

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
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'sentence_analysis',
            schema: z.toJSONSchema(ResponseFormat),
          },
        },
      });
      this.log.info`execute ${this.taskType} with response: ${response}`;
      const content = response.choices?.[0]?.message?.content ?? '';
      if (!content.trim()) {
        throw new Error(`Empty response for ${this.taskType}`);
      }
      return content;
    } catch (error) {
      this.log.error`execute ${this.taskType} with error: ${error}`;
      throw error;
    }
  }
}
