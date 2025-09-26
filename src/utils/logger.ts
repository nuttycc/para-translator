/*
 * style: prefer tagged template over normal function call
 */

import {
  configureSync,
  defaultConsoleFormatter,
  getConsoleSink,
  getLogger,
} from '@logtape/logtape';

configureSync({
  reset: true,
  sinks: { console: getConsoleSink({ formatter: defaultConsoleFormatter }) },
  loggers: [
    { category: ['logtape', 'meta'], lowestLevel: 'warning', sinks: ['console'] },
    { category: 'app', lowestLevel: 'debug', sinks: ['console'] },
  ],
});

export const logger = getLogger(['app']);

export const createLogger = (...categoryParts: string[]) => getLogger(['app', ...categoryParts]);
