/**
 * Admin view builders. Each returns a `View` (text + optional inline keyboard)
 * that the command/action layer can either send as a new message or edit into
 * the existing one. Keeping rendering here avoids duplicating it between the
 * `/admin` command and the panel's inline navigation.
 */
import type { InlineKeyboardMarkup } from 'telegraf/types';
import { EMPLOYEES_PER_PAGE } from '../../config/constants';
import { t } from '../../localization';
import { birthdayService } from '../../modules/birthday/birthday.service';
import { employeeService } from '../../modules/employee/employee.service';
import { settingsService } from '../../modules/settings/settings.service';
import { wishService } from '../../modules/wish/wish.service';
import { employeeCard } from '../../templates/employee.template';
import { formatUzbekDate } from '../../utils/date.util';
import { escapeHtml, fullName } from '../../utils/format.util';
import type { BotContext } from '../context';
import {
  adminPanelKeyboard,
  backToPanelKeyboard,
  employeeCardKeyboard,
  employeesListKeyboard,
  settingsKeyboard,
  upcomingKeyboard,
  wishesEmployeesKeyboard,
  type LabeledId,
} from '../keyboards/admin.keyboard';

export interface View {
  text: string;
  reply_markup?: InlineKeyboardMarkup;
}

/** Send a view, editing the triggering message when invoked from a button. */
export async function sendView(ctx: BotContext, view: View, edit = false): Promise<void> {
  const extra = { parse_mode: 'HTML' as const, reply_markup: view.reply_markup };
  if (edit && ctx.callbackQuery) {
    try {
      await ctx.editMessageText(view.text, extra);
      return;
    } catch {
      // The original message may carry a photo or be unchanged — fall back.
    }
  }
  await ctx.reply(view.text, extra);
}

export function panelView(): View {
  return { text: t.admin.panelTitle, reply_markup: adminPanelKeyboard().reply_markup };
}

export async function employeesView(page: number): Promise<View> {
  const total = await employeeService.count();
  if (total === 0) {
    return {
      text: t.admin.employees.empty,
      reply_markup: employeesListKeyboard([], 0, 1).reply_markup,
    };
  }

  const totalPages = Math.max(1, Math.ceil(total / EMPLOYEES_PER_PAGE));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  const employees = await employeeService.list({
    skip: safePage * EMPLOYEES_PER_PAGE,
    take: EMPLOYEES_PER_PAGE,
  });

  const items: LabeledId[] = employees.map((e) => ({
    id: e.id,
    label: t.admin.employees.row(fullName(e), formatUzbekDate(e.birthMonth, e.birthDay)),
  }));

  return {
    text: t.admin.employees.title(total),
    reply_markup: employeesListKeyboard(items, safePage, totalPages).reply_markup,
  };
}

export async function employeeCardView(id: string): Promise<View | null> {
  const employee = await employeeService.getById(id);
  if (!employee) return null;
  return {
    text: employeeCard(employee),
    reply_markup: employeeCardKeyboard({ id: employee.id, isArchived: employee.isArchived })
      .reply_markup,
  };
}

export async function upcomingView(): Promise<View> {
  const timezone = await settingsService.getTimezone();
  const upcoming = await employeeService.getUpcoming(timezone, 15, 60);

  if (upcoming.length === 0) {
    return {
      text: `${t.admin.upcoming.title}\n\n${t.admin.upcoming.empty}${t.admin.upcoming.manualHeader}`,
      reply_markup: upcomingKeyboard().reply_markup,
    };
  }

  const lines = upcoming.map((u) =>
    t.admin.upcoming.row(
      formatUzbekDate(u.employee.birthMonth, u.employee.birthDay),
      escapeHtml(fullName(u.employee)),
      u.daysLeft,
    ),
  );

  return {
    text: `${t.admin.upcoming.title}\n\n${lines.join('\n')}${t.admin.upcoming.manualHeader}`,
    reply_markup: upcomingKeyboard().reply_markup,
  };
}

export async function statsView(): Promise<View> {
  const timezone = await settingsService.getTimezone();
  const stats = await birthdayService.getDashboardStats(timezone);
  return {
    text: `${t.admin.stats.title}\n\n${t.admin.stats.body(stats)}`,
    reply_markup: backToPanelKeyboard().reply_markup,
  };
}

export async function settingsView(): Promise<View> {
  const s = await settingsService.get();
  const text =
    `${t.admin.settings.title}\n\n` +
    t.admin.settings.body({
      groupChatId: s.groupChatId ? s.groupChatId.toString() : t.common.notSet,
      reminderTime: s.reminderTime,
      morningBirthdayTime: s.morningBirthdayTime,
      publishIntervalMinutes: s.publishIntervalMinutes,
      eveningSummaryTime: s.eveningSummaryTime,
      timezone: s.timezone,
      anonymousWishes: s.anonymousWishesEnabled ? t.common.on : t.common.off,
      requireApproval: s.requireWishApproval ? t.common.on : t.common.off,
    });
  return { text, reply_markup: settingsKeyboard().reply_markup };
}

export async function wishesMenuView(): Promise<View> {
  const groups = await wishService.employeesWithWishes();
  if (groups.length === 0) {
    return {
      text: `${t.admin.wishesMod.title}\n\n${t.admin.wishesMod.empty}`,
      reply_markup: backToPanelKeyboard().reply_markup,
    };
  }

  const employees = await employeeService.getByIds(groups.map((g) => g.employeeId));
  const byId = new Map(employees.map((e) => [e.id, e]));

  const items: LabeledId[] = [];
  for (const group of groups) {
    const employee = byId.get(group.employeeId);
    if (!employee) continue;
    items.push({
      id: group.employeeId,
      label: t.admin.wishesMod.employeeRow(fullName(employee), group.pending, group.total),
    });
  }

  return {
    text: `${t.admin.wishesMod.title}\n\n${t.admin.wishesMod.employeesHeader}`,
    reply_markup: wishesEmployeesKeyboard(items).reply_markup,
  };
}
