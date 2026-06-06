/** Admin commands. Every command is protected by the `requireAdmin` guard. */
import { Telegraf } from 'telegraf';
import { t } from '../../localization';
import {
  announcementMessage,
  eveningSummaryMessage,
  reminderMessage,
  wishRevealMessage,
} from '../../templates/birthday.template';
import type { BotContext } from '../context';
import { requireAdmin } from '../middlewares/admin.middleware';
import { SCENES } from '../runtime';
import {
  employeesView,
  panelView,
  sendView,
  settingsView,
  upcomingView,
} from '../views/admin.view';

const SAMPLE_EMPLOYEE = {
  firstName: t.admin.preview.sampleFirst,
  lastName: 'Valiyev',
  birthMonth: 6,
  birthDay: 12,
  position: 'Bosh mutaxassis',
};

function buildPreview(): string {
  return (
    t.admin.preview.title +
    t.admin.preview.note +
    t.admin.preview.reminderLabel +
    reminderMessage(SAMPLE_EMPLOYEE) +
    t.admin.preview.announcementLabel +
    announcementMessage(SAMPLE_EMPLOYEE) +
    t.admin.preview.wishLabel +
    wishRevealMessage(1, t.admin.preview.sampleWish) +
    t.admin.preview.summaryLabel +
    eveningSummaryMessage(SAMPLE_EMPLOYEE, 3)
  );
}

export function registerAdminCommands(bot: Telegraf<BotContext>): void {
  bot.command('admin', requireAdmin(), async (ctx) => {
    await sendView(ctx, panelView());
  });

  bot.command('employees', requireAdmin(), async (ctx) => {
    await sendView(ctx, await employeesView(0));
  });

  bot.command('add_employee', requireAdmin(), async (ctx) => {
    await ctx.scene.enter(SCENES.ADD_EMPLOYEE);
  });

  bot.command('upcoming_birthdays', requireAdmin(), async (ctx) => {
    await sendView(ctx, await upcomingView());
  });

  bot.command('settings', requireAdmin(), async (ctx) => {
    await sendView(ctx, await settingsView());
  });

  bot.command('preview_messages', requireAdmin(), async (ctx) => {
    await ctx.reply(buildPreview(), { parse_mode: 'HTML' });
  });

  // Editing/deleting start from the employee list (tap a record to open it).
  bot.command('edit_employee', requireAdmin(), async (ctx) => {
    await sendView(ctx, await employeesView(0));
  });

  bot.command('delete_employee', requireAdmin(), async (ctx) => {
    await sendView(ctx, await employeesView(0));
  });
}
