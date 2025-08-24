import { configureSync, defaultConsoleFormatter, getConsoleSink, getLogger } from '@logtape/logtape';

configureSync({
  sinks: { console: getConsoleSink({ formatter: defaultConsoleFormatter }) },
  loggers: [{ category: 'my-app', lowestLevel: 'debug', sinks: ['console'] }],
});

export const createLogger = (...categoryParts: string[]) => getLogger(['my-app', ...categoryParts]);
