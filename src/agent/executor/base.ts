import { OpenAI } from 'openai';

import { createLogger } from '@/utils/logger';
import { renderTemplate as renderTpl } from '@/utils/template';

import type { AgentContext, TaskExecutor, TaskRuntimeConfig, TaskType } from '@/agent/types';
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

  abstract init(): Promise<void>;

  abstract createOpenAIClient(configId: string): Promise<void>;

  protected async executeBase(
    context: AgentContext,
    useJsonSchema = false,
    responseSchema?: Record<string, unknown>
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
        stream: false,
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
      OpenAIBaseExecutor.log.error`execute ${this.taskType} with error: ${error}`;
      throw error;
    }
  }

  protected renderTemplate(template: string, context: AgentContext): string {
    return renderTpl(template, context);
  }
}
