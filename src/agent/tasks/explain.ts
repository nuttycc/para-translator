import { renderTemplate } from '@/utils/template';
import { createLogger } from '@/utils/logger';

import type { TaskRunner } from './types';

const log = createLogger('ExplainTaskRunner');

export const explainRunner: TaskRunner = {
  async run(context, config, client) {
    const systemPrompt = renderTemplate(config.prompt.system, context);
    const userPrompt = renderTemplate(config.prompt.user, context);

    log.info`Executing explain task`;

    const response = await client.openai.chat.completions.create({
      model: client.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: config.temperature,
      stream: false,
    });

    const content = response.choices?.[0]?.message?.content ?? '';

    if (!content.trim()) {
      throw new Error('Empty response for explain task');
    }

    log.info`Explain task completed successfully`;
    return content;
  },
};
