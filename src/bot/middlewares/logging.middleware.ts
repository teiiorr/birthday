/** Lightweight per-update logging. */
import { createLogger } from '../../infrastructure/logger/logger';
import type { BotContext } from '../context';

const log = createLogger('bot:update');

export async function requestLogger(ctx: BotContext, next: () => Promise<void>): Promise<void> {
  log.debug(
    {
      updateType: ctx.updateType,
      from: ctx.from?.id,
      chatType: ctx.chat?.type,
    },
    'Incoming update',
  );
  await next();
}
