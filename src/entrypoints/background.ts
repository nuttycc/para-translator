import type { Logger } from '@logtape/logtape';
import { createLogger, initLogger } from '@/utils/logger';

export default defineBackground(() => {
  let logger: Logger | null = null;
  (async () => {
    await initLogger();
    logger = createLogger('background');
    logger.debug('Hello background!');
  })().catch((err) => {
    console.error(err);
  });
});
