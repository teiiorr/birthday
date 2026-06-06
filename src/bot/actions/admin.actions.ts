/**
 * All inline-button (callback) handlers for the admin dashboard.
 *
 * A single guard — `bot.on('callback_query', requireAdmin())` — protects every
 * admin button: admins fall through to the handlers below, non-admins are
 * rejected. (Anonymous-wish buttons are handled inside the wish scene, never
 * reaching this global scope.)
 */
import { BirthdayWish, WishStatus } from '@prisma/client';
import { Telegraf } from 'telegraf';
import { t } from '../../localization';
import { employeeService } from '../../modules/employee/employee.service';
import { settingsService } from '../../modules/settings/settings.service';
import { wishService } from '../../modules/wish/wish.service';
import { escapeHtml, fullName } from '../../utils/format.util';
import {
  cb,
  EMPLOYEE_FIELD_CODES,
  SETTINGS_FIELD_CODES,
  type EmployeeFieldCode,
  type SettingsFieldCode,
} from '../callbacks';
import type { BotContext } from '../context';
import {
  employeeDeleteKeyboard,
  employeeEditFieldsKeyboard,
  wishModerationKeyboard,
} from '../keyboards/admin.keyboard';
import { requireAdmin } from '../middlewares/admin.middleware';
import { getOrchestrator, SCENES } from '../runtime';
import {
  employeeCardView,
  employeesView,
  panelView,
  sendView,
  settingsView,
  statsView,
  upcomingView,
  wishesMenuView,
} from '../views/admin.view';

function wishStatusLabel(wish: BirthdayWish): string {
  switch (wish.status) {
    case WishStatus.PENDING:
      return t.admin.wishesMod.statusPending;
    case WishStatus.APPROVED:
      return t.admin.wishesMod.statusApproved;
    case WishStatus.REJECTED:
      return t.admin.wishesMod.statusRejected;
    default:
      return wish.status;
  }
}

function wishCardText(employeeName: string, wish: BirthdayWish): string {
  return t.admin.wishesMod.wishCard({
    fullName: escapeHtml(employeeName),
    statusLabel: wishStatusLabel(wish),
    publishedLabel: wish.isPublished
      ? t.admin.wishesMod.publishedYes
      : t.admin.wishesMod.publishedNo,
    message: escapeHtml(wish.message),
  });
}

async function rerenderWishCard(ctx: BotContext, wishId: string): Promise<void> {
  const wish = await wishService.getById(wishId);
  if (!wish) {
    await ctx.editMessageText(t.admin.wishesMod.deleted).catch(() => undefined);
    return;
  }
  const employee = await employeeService.getById(wish.employeeId);
  const name = employee ? fullName(employee) : '';
  await ctx
    .editMessageText(wishCardText(name, wish), {
      parse_mode: 'HTML',
      reply_markup: wishModerationKeyboard(wish.id).reply_markup,
    })
    .catch(() => undefined);
}

export function registerAdminActions(bot: Telegraf<BotContext>): void {
  // Gate every admin callback. Admins continue to the handlers; others stop.
  bot.on('callback_query', requireAdmin());

  // ── Panel navigation ──────────────────────────────────────────────────────
  bot.action(cb.panel, async (ctx) => {
    await ctx.answerCbQuery();
    await sendView(ctx, panelView(), true);
  });

  bot.action(cb.employeesRe, async (ctx) => {
    await ctx.answerCbQuery();
    await sendView(ctx, await employeesView(Number(ctx.match[1])), true);
  });

  bot.action(cb.addEmployee, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter(SCENES.ADD_EMPLOYEE);
  });

  bot.action(cb.upcoming, async (ctx) => {
    await ctx.answerCbQuery();
    await sendView(ctx, await upcomingView(), true);
  });

  bot.action(cb.wishes, async (ctx) => {
    await ctx.answerCbQuery();
    await sendView(ctx, await wishesMenuView(), true);
  });

  bot.action(cb.stats, async (ctx) => {
    await ctx.answerCbQuery();
    await sendView(ctx, await statsView(), true);
  });

  bot.action(cb.settings, async (ctx) => {
    await ctx.answerCbQuery();
    await sendView(ctx, await settingsView(), true);
  });

  bot.action(cb.search, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter(SCENES.SEARCH);
  });

  bot.action(cb.noop, async (ctx) => {
    await ctx.answerCbQuery();
  });

  // ── Employee record ───────────────────────────────────────────────────────
  bot.action(cb.empViewRe, async (ctx) => {
    const view = await employeeCardView(ctx.match[1]);
    if (!view) {
      await ctx.answerCbQuery(t.common.unknownAction, { show_alert: true });
      return;
    }
    await ctx.answerCbQuery();
    await sendView(ctx, view, true);
  });

  bot.action(cb.empEditMenuRe, async (ctx) => {
    const id = ctx.match[1];
    const employee = await employeeService.getById(id);
    if (!employee) {
      await ctx.answerCbQuery(t.common.unknownAction, { show_alert: true });
      return;
    }
    await ctx.answerCbQuery();
    await sendView(
      ctx,
      {
        text: t.admin.editEmployee.title(escapeHtml(fullName(employee))),
        reply_markup: employeeEditFieldsKeyboard(id).reply_markup,
      },
      true,
    );
  });

  bot.action(cb.empEditFieldRe, async (ctx) => {
    const code = ctx.match[1] as EmployeeFieldCode;
    const id = ctx.match[2];

    // Status is a toggle, not a text field.
    if (code === 'st') {
      const employee = await employeeService.getById(id);
      if (!employee) {
        await ctx.answerCbQuery(t.common.unknownAction, { show_alert: true });
        return;
      }
      await employeeService.update(id, { isActive: !employee.isActive });
      await ctx.answerCbQuery(t.admin.editEmployee.toggledActive);
      const view = await employeeCardView(id);
      if (view) await sendView(ctx, view, true);
      return;
    }

    const field = EMPLOYEE_FIELD_CODES[code];
    if (!field) {
      await ctx.answerCbQuery(t.common.unknownAction);
      return;
    }
    await ctx.answerCbQuery();
    await ctx.scene.enter(SCENES.EDIT_FIELD, { employeeId: id, field });
  });

  bot.action(cb.empArchiveRe, async (ctx) => {
    const id = ctx.match[1];
    const employee = await employeeService.getById(id);
    if (!employee) {
      await ctx.answerCbQuery(t.common.unknownAction, { show_alert: true });
      return;
    }
    if (employee.isArchived) {
      await employeeService.unarchive(id);
      await ctx.answerCbQuery(t.admin.employees.unarchived);
    } else {
      await employeeService.archive(id);
      await ctx.answerCbQuery(t.admin.employees.archived);
    }
    const view = await employeeCardView(id);
    if (view) await sendView(ctx, view, true);
  });

  bot.action(cb.empDeleteRe, async (ctx) => {
    const id = ctx.match[1];
    const employee = await employeeService.getById(id);
    if (!employee) {
      await ctx.answerCbQuery(t.common.unknownAction, { show_alert: true });
      return;
    }
    await ctx.answerCbQuery();
    await sendView(
      ctx,
      {
        text: t.admin.employees.deleteConfirm(escapeHtml(fullName(employee))),
        reply_markup: employeeDeleteKeyboard(id).reply_markup,
      },
      true,
    );
  });

  bot.action(cb.empDeleteConfirmRe, async (ctx) => {
    await employeeService.remove(ctx.match[1]).catch(() => undefined);
    await ctx.answerCbQuery(t.admin.employees.deleted);
    await sendView(ctx, await employeesView(0), true);
  });

  // ── Settings ──────────────────────────────────────────────────────────────
  bot.action(cb.setFieldRe, async (ctx) => {
    const code = ctx.match[1] as SettingsFieldCode;
    const field = SETTINGS_FIELD_CODES[code];
    if (!field) {
      await ctx.answerCbQuery(t.common.unknownAction);
      return;
    }
    await ctx.answerCbQuery();
    await ctx.scene.enter(SCENES.SETTINGS_EDIT, { field });
  });

  bot.action(cb.setToggleWishes, async (ctx) => {
    await settingsService.toggleAnonymousWishes();
    await ctx.answerCbQuery(t.admin.settings.updated);
    await sendView(ctx, await settingsView(), true);
  });

  bot.action(cb.setToggleApproval, async (ctx) => {
    await settingsService.toggleRequireApproval();
    await ctx.answerCbQuery(t.admin.settings.updated);
    await sendView(ctx, await settingsView(), true);
  });

  // ── Wishes moderation ─────────────────────────────────────────────────────
  bot.action(cb.wishEmployeeRe, async (ctx) => {
    await ctx.answerCbQuery();
    const employeeId = ctx.match[1];
    const employee = await employeeService.getById(employeeId);
    if (!employee) {
      await ctx.reply(t.wish.employeeMissing);
      return;
    }
    const wishes = await wishService.listByEmployee(employeeId);
    if (wishes.length === 0) {
      await ctx.reply(t.admin.wishesMod.noWishesForEmployee);
      return;
    }
    const name = fullName(employee);
    for (const wish of wishes) {
      await ctx.reply(wishCardText(name, wish), {
        parse_mode: 'HTML',
        reply_markup: wishModerationKeyboard(wish.id).reply_markup,
      });
    }
  });

  bot.action(cb.wishApproveRe, async (ctx) => {
    await wishService.approve(ctx.match[1]).catch(() => undefined);
    await ctx.answerCbQuery(t.admin.wishesMod.approved);
    await rerenderWishCard(ctx, ctx.match[1]);
  });

  bot.action(cb.wishRejectRe, async (ctx) => {
    await wishService.reject(ctx.match[1]).catch(() => undefined);
    await ctx.answerCbQuery(t.admin.wishesMod.rejected);
    await rerenderWishCard(ctx, ctx.match[1]);
  });

  bot.action(cb.wishPublishRe, async (ctx) => {
    const orchestrator = getOrchestrator();
    if (!orchestrator) {
      await ctx.answerCbQuery(t.common.error, { show_alert: true });
      return;
    }
    const ok = await orchestrator.publishWishNow(ctx.match[1]);
    await ctx.answerCbQuery(ok ? t.admin.wishesMod.published : t.admin.wishesMod.publishNoGroup, {
      show_alert: !ok,
    });
    await rerenderWishCard(ctx, ctx.match[1]);
  });

  bot.action(cb.wishDeleteRe, async (ctx) => {
    await wishService.remove(ctx.match[1]).catch(() => undefined);
    await ctx.answerCbQuery(t.admin.wishesMod.deleted);
    await ctx.editMessageText(t.admin.wishesMod.deleted).catch(() => undefined);
  });

  // ── Manual triggers ───────────────────────────────────────────────────────
  registerManualTriggers(bot);
}

function registerManualTriggers(bot: Telegraf<BotContext>): void {
  const orchestrator = () => getOrchestrator();

  bot.action(cb.triggerReminder, async (ctx) => {
    const o = orchestrator();
    if (!o) return void ctx.answerCbQuery(t.common.error, { show_alert: true });
    const n = await o.runReminders();
    await ctx.answerCbQuery(
      n > 0 ? t.admin.triggers.reminderDone(n) : t.admin.triggers.nothingDone,
      {
        show_alert: true,
      },
    );
  });

  bot.action(cb.triggerAnnouncement, async (ctx) => {
    const o = orchestrator();
    if (!o) return void ctx.answerCbQuery(t.common.error, { show_alert: true });
    const n = await o.runMorningAnnouncements();
    await ctx.answerCbQuery(
      n > 0 ? t.admin.triggers.announcementDone(n) : t.admin.triggers.nothingDone,
      { show_alert: true },
    );
  });

  bot.action(cb.triggerPublish, async (ctx) => {
    const o = orchestrator();
    if (!o) return void ctx.answerCbQuery(t.common.error, { show_alert: true });
    const n = await o.runWishPublishing();
    await ctx.answerCbQuery(
      n > 0 ? t.admin.triggers.publishDone(n) : t.admin.triggers.nothingDone,
      {
        show_alert: true,
      },
    );
  });

  bot.action(cb.triggerEvening, async (ctx) => {
    const o = orchestrator();
    if (!o) return void ctx.answerCbQuery(t.common.error, { show_alert: true });
    const n = await o.runEveningSummary();
    await ctx.answerCbQuery(
      n > 0 ? t.admin.triggers.eveningDone(n) : t.admin.triggers.nothingDone,
      {
        show_alert: true,
      },
    );
  });
}
