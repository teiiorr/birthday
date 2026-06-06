/**
 * Global error boundary. Any error thrown by a downstream handler is logged
 * with context and, in private chats, surfaced to the user as a friendly
 * message. Group chats are never spammed with error text.
 */
import { createLogger } from '../../infrastructure/logger/logger';
import { t } from '../../localization';
import type { BotContext } from '../context';

const log = createLogger('bot:error');

export async function errorBoundary(ctx: BotContext, next: () => Promise<void>): Promise<void> {
  try {
    await next();
  } catch (error) {
    log.error(
      {
        err: error,
        updateType: ctx.updateType,
        from: ctx.from?.id,
        chat: ctx.chat?.id,
      },
      'Unhandled error while processing update',
    );

    try {
      if (ctx.callbackQuery) {
        await ctx.answerCbQuery(t.common.error).catch(() => undefined);
      } else if (ctx.chat?.type === 'private') {
        await ctx.reply(t.common.error).catch(() => undefined);
      }
    } catch {
      // Swallow secondary errors — nothing more we can do for the user.
    }
  }
}
