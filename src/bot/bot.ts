/**
 * Bot factory: assembles the Telegraf instance with middlewares, session,
 * scenes, commands and actions in the correct order.
 *
 * Pipeline order (top to bottom):
 *   errorBoundary → session → logging → rateLimit → adminFlag → scenes
 *     → commands → admin actions → fallbacks
 */
import { session, Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { config } from '../config';
import { createLogger } from '../infrastructure/logger/logger';
import { t } from '../localization';
import { registerAdminActions } from './actions/admin.actions';
import { registerAdminCommands } from './commands/admin.commands';
import { registerPublicCommands } from './commands/public.commands';
import type { BotContext } from './context';
import { attachAdminFlag } from './middlewares/admin.middleware';
import { errorBoundary } from './middlewares/error.middleware';
import { requestLogger } from './middlewares/logging.middleware';
import { rateLimit } from './middlewares/rateLimit.middleware';
import { createStage } from './scenes';

const log = createLogger('bot');

export function createBot(): Telegraf<BotContext> {
  const bot = new Telegraf<BotContext>(config.botToken, {
    handlerTimeout: 90_000,
  });

  const stage = createStage();

  bot.use(errorBoundary);
  bot.use(session());
  bot.use(requestLogger);
  bot.use(rateLimit());
  bot.use(attachAdminFlag);
  bot.use(stage.middleware());

  registerPublicCommands(bot);
  registerAdminCommands(bot);
  registerAdminActions(bot);

  // Friendly fallback for free-form private text that no command/scene caught.
  bot.on(message('text'), async (ctx) => {
    if (ctx.chat?.type === 'private') {
      const text = ctx.isAdmin ? t.help.text + t.help.adminCommands : t.help.text;
      await ctx.reply(text, { parse_mode: 'HTML' });
    }
  });

  // Clear the loading spinner on any callback query that reached here unhandled.
  bot.on('callback_query', async (ctx) => {
    await ctx.answerCbQuery().catch(() => undefined);
  });

  bot.catch((error, ctx) => {
    log.error({ err: error, updateType: ctx.updateType }, 'Telegraf top-level error');
  });

  return bot;
}

/**
 * Register the command menus shown in Telegram clients. Public commands are set
 * globally; the full admin set is scoped to each admin's private chat.
 */
export async function configureBotCommands(bot: Telegraf<BotContext>): Promise<void> {
  const publicCommands = [
    { command: 'start', description: 'Botni ishga tushirish' },
    { command: 'help', description: 'Yordam' },
    { command: 'birthdays', description: "Bu oygi tug'ilgan kunlar" },
    { command: 'next', description: "Eng yaqin tug'ilgan kun" },
  ];

  const adminCommands = [
    ...publicCommands,
    { command: 'admin', description: 'Admin panel' },
    { command: 'employees', description: "Xodimlar ro'yxati" },
    { command: 'add_employee', description: "Xodim qo'shish" },
    { command: 'upcoming_birthdays', description: "Yaqin tug'ilgan kunlar" },
    { command: 'settings', description: 'Sozlamalar' },
    { command: 'preview_messages', description: 'Xabarlar namunasi' },
  ];

  await bot.telegram.setMyCommands(publicCommands);

  for (const id of config.adminTelegramIds) {
    await bot.telegram
      .setMyCommands(adminCommands, { scope: { type: 'chat', chat_id: Number(id) } })
      .catch((error) => log.warn({ err: error, adminId: id }, 'Failed to set admin command scope'));
  }
}
