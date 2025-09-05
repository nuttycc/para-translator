import type { AgentContext, TaskExecutor, TaskRuntimeConfig, TaskType } from '@/agent/types';
import { createLogger } from '@/utils/logger';
import { OpenAI } from 'openai';
import type { ChatCompletionCreateParamsNonStreaming } from 'openai/resources/index.mjs';

export abstract class BaseTaskExecutor implements TaskExecutor {
  abstract readonly taskType: TaskType;
  abstract runtimeConfig: TaskRuntimeConfig;

  abstract execute(context: AgentContext): Promise<string>;
}

// Common OpenAI executor base class to eliminate code duplication
export abstract class OpenAIBaseExecutor extends BaseTaskExecutor {
  static readonly log = createLogger('OpenAIBaseExecutor');
  runtimeConfig: TaskRuntimeConfig = {} as TaskRuntimeConfig;
  model: string | null = null;
  openai: OpenAI | null = null;

  async init() {
    // This will be implemented by concrete classes
    throw new Error('init() must be implemented by concrete executor');
  }

  async createOpenAIClient(configId: string) {
    // This will be implemented by concrete classes
    throw new Error('createOpenAIClient() must be implemented by concrete executor');
  }

  protected async executeBase(
    context: AgentContext,
    useJsonSchema = false,
    responseSchema?: any
  ): Promise<string> {
    if (!this.openai || !this.model) {
      throw new Error(`OpenAI client or model not found for ${this.taskType}`);
    }

    // Render prompts in a single pass with safe replacements
    const systemPrompt = this.renderTemplate(this.runtimeConfig.prompt.system, context);
    const userPrompt = this.renderTemplate(this.runtimeConfig.prompt.user, context);

    try {
      const requestParams: ChatCompletionCreateParamsNonStreaming = {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: this.runtimeConfig.temperature,
        max_completion_tokens: 1200,
      };

      if (useJsonSchema && responseSchema) {
        requestParams.response_format = {
          type: 'json_schema',
          json_schema: {
            name: 'response',
            schema: responseSchema,
          },
        };
      }

      OpenAIBaseExecutor.log.info`requestParams: ${requestParams}`;

      const response = await this.openai.chat.completions.create(requestParams);

      OpenAIBaseExecutor.log.info`execute ${this.taskType} with response: ${response}`;

      const content = response.choices?.[0]?.message?.content ?? '';

      if (!content.trim()) {
        throw new Error(`Empty response for ${this.taskType}`);
      }

      return content;
    } catch (error) {
      throw error;
    }
  }

  protected renderTemplate(template: string, context: AgentContext): string {
    // Import here to avoid circular dependencies
    const { renderTemplate } = require('@/utils/template');
    return renderTemplate(template, context);
  }
}
