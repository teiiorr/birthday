/**
 * Structured logging via pino.
 *
 *  - Production: line-delimited JSON on stdout (ideal for `docker compose logs`).
 *  - Development: pretty, colorized output.
 */
import '../../utils/bigint';
import pino, { type Logger } from 'pino';
import { config } from '../../config';

const transport = config.isProduction
  ? undefined
  : {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname',
      },
    };

export const logger: Logger = pino({
  level: config.logLevel,
  base: undefined,
  ...(transport ? { transport } : {}),
});

/** Create a child logger tagged with a module name for easy filtering. */
export function createLogger(moduleName: string): Logger {
  return logger.child({ module: moduleName });
}
