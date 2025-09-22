import { createLogger } from '@/utils/logger';
import { renderTemplate } from '@/utils/template';

import type { TaskRunner } from './types';

const log = createLogger('TranslateTaskRunner');

export const translateRunner: TaskRunner = {
  async run(context, config, client) {
    const systemPrompt = renderTemplate(config.prompt.system, context);
    const userPrompt = renderTemplate(config.prompt.user, context);

    log.info`Executing translate task`;

    const response = await client.openai.chat.completions.create({
      model: client.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: config.temperature,
      stream: false,
    });

    return response;
  },
};
