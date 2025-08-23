import {
  getAIConfigManager,
  getTaskConfigManager,
  type AIConfigManager,
  type TaskConfigManager,
} from '@/agent/configManager';
import {
  TASK_TYPES,
  type AgentContext,
  type AgentResult,
  type LangAgentSpec,
  type TaskType,
} from '@/agent/types';
import { createLogger } from '@/utils/logger';
import { renderTemplate } from '@/utils/template';
import { OpenAI } from 'openai';

class LangAgent implements LangAgentSpec {
  private readonly log = createLogger('agent');
  readonly taskTypes = TASK_TYPES;
  private _aiConfigManager: AIConfigManager | null = null;
  private _taskConfigManager: TaskConfigManager | null = null;
  private initialized = false;

  /**
   * Initialize the agent with config managers
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    this._aiConfigManager = await getAIConfigManager();
    this._taskConfigManager = await getTaskConfigManager();
    this.initialized = true;
  }

  /**
   * Get initialized AIConfigManager (non-null after init)
   */
  get aiConfigManager(): AIConfigManager {
    if (this._aiConfigManager === null) {
      throw new Error('AIConfigManager not initialized. Call init() first.');
    }
    return this._aiConfigManager;
  }

  /**
   * Get initialized TaskConfigManager (non-null after init)
   */
  get taskConfigManager(): TaskConfigManager {
    if (this._taskConfigManager === null) {
      throw new Error('TaskConfigManager not initialized. Call init() first.');
    }
    return this._taskConfigManager;
  }

  async perform(taskType: TaskType, context: AgentContext): Promise<AgentResult> {
    // Ensure initialization before performing any operations
    await this.init();

    this.log.info('perform', { taskType });

    const runtimeConfig = this.taskConfigManager.get(taskType);
    const aiConfig = this.aiConfigManager.getById(runtimeConfig.aiConfigId);

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
    const renderSystemPrompt = renderTemplate(runtimeConfig.prompt.system, context);
    const renderUserPrompt = renderTemplate(runtimeConfig.prompt.user, context);

    try {
      const response = await openai.chat.completions.create({
        model: aiConfig.model,
        messages: [
          { role: 'system', content: renderSystemPrompt },
          { role: 'user', content: renderUserPrompt },
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

let langAgentInstance: LangAgent | null = null;

/**
 * Get the singleton LangAgent instance with async initialization
 */
export async function getLangAgent(): Promise<LangAgent> {
  if (langAgentInstance === null) {
    langAgentInstance = new LangAgent();
    await langAgentInstance.init();
  }
  return langAgentInstance;
}

/**
 * Get the LangAgent instance synchronously (may not be initialized)
 * Use getLangAgent() for proper async initialization
 */
export function getLangAgentSync(): LangAgent | null {
  return langAgentInstance;
}
