import { onMessage } from '@/messaging';
import { handleTranslate } from '@/messaging/handlers';
import { createLogger } from '@/utils/logger';

export default defineBackground(() => {
  const logger = createLogger('background');
  logger.debug('Hello background!');

  // Register message handlers
  onMessage('translate', async ({ data }) => {
    return handleTranslate(data);
  });
});
