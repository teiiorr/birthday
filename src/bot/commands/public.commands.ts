/** Public commands available to every user: /start /help /birthdays /next. */
import { Telegraf } from 'telegraf';
import { START_PAYLOAD_WISH_PREFIX } from '../../config/constants';
import { t } from '../../localization';
import { employeeService } from '../../modules/employee/employee.service';
import { settingsService } from '../../modules/settings/settings.service';
import { monthlyListMessage, nextBirthdayCard } from '../../templates/birthday.template';
import type { BotContext } from '../context';
import { SCENES } from '../runtime';

function commandPayload(ctx: BotContext): string {
  const message = ctx.message;
  if (message && 'text' in message) {
    return message.text.split(/\s+/).slice(1).join(' ').trim();
  }
  return '';
}

export function registerPublicCommands(bot: Telegraf<BotContext>): void {
  bot.start(async (ctx) => {
    const payload = commandPayload(ctx);

    // Deep link from the group "write a wish" button: /start wish-<employeeId>
    if (payload.startsWith(START_PAYLOAD_WISH_PREFIX)) {
      const employeeId = payload.slice(START_PAYLOAD_WISH_PREFIX.length);
      if (employeeId) {
        await ctx.scene.enter(SCENES.WISH, { employeeId });
        return;
      }
    }

    const greeting = ctx.isAdmin ? t.start.greetingUser + t.start.adminHint : t.start.greetingUser;
    await ctx.reply(greeting, { parse_mode: 'HTML' });
  });

  bot.help(async (ctx) => {
    const text = ctx.isAdmin ? t.help.text + t.help.adminCommands : t.help.text;
    await ctx.reply(text, { parse_mode: 'HTML' });
  });

  bot.command('birthdays', async (ctx) => {
    const timezone = await settingsService.getTimezone();
    const employees = await employeeService.getThisMonthBirthdays(timezone);
    const rows = employees.map((e) => ({
      month: e.birthMonth,
      day: e.birthDay,
      name: `${e.firstName} ${e.lastName}`,
    }));
    await ctx.reply(monthlyListMessage(rows), { parse_mode: 'HTML' });
  });

  bot.command('next', async (ctx) => {
    const timezone = await settingsService.getTimezone();
    const next = await employeeService.getNextBirthday(timezone);
    if (!next) {
      await ctx.reply(t.next.none);
      return;
    }
    await ctx.reply(nextBirthdayCard(next.employee, next.daysLeft), { parse_mode: 'HTML' });
  });
}
