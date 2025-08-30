import { defineBackground } from '#imports';
import { onMessage } from '@/messaging';
import { handleAgent } from '@/messaging/handlers';
import { createLogger } from '@/utils/logger';

export default defineBackground(() => {
  const logger = createLogger('background');
  logger.debug`Hello background!`;

  // Register message handlers
  onMessage('agent', async ({ data }) => {
    return handleAgent(data);
  });
});
