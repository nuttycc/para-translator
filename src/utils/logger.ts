import { configure, getConsoleSink, getLogger } from '@logtape/logtape';
import { prettyFormatter } from '@logtape/pretty';

export async function initLogger() {
  await configure({
    sinks: { console: getConsoleSink({ formatter: prettyFormatter }) },
    loggers: [{ category: 'my-app', lowestLevel: 'debug', sinks: ['console'] }],
  });
}

export const createLogger = (...categoryParts: string[]) => getLogger(['my-app', ...categoryParts]);
