/** Inline keyboards for the admin dashboard. */
import { Markup } from 'telegraf';
import type { InlineKeyboardMarkup } from 'telegraf/types';
import { t } from '../../localization';
import { cb } from '../callbacks';

export interface LabeledId {
  id: string;
  label: string;
}

export function adminPanelKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
  const m = t.admin.menu;
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(m.employees, cb.employees(0)),
      Markup.button.callback(m.addEmployee, cb.addEmployee),
    ],
    [Markup.button.callback(m.upcoming, cb.upcoming), Markup.button.callback(m.wishes, cb.wishes)],
    [Markup.button.callback(m.stats, cb.stats), Markup.button.callback(m.settings, cb.settings)],
  ]);
}

export function backToPanelKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
  return Markup.inlineKeyboard([[Markup.button.callback(t.common.back, cb.panel)]]);
}

export function employeesListKeyboard(
  employees: LabeledId[],
  page: number,
  totalPages: number,
): Markup.Markup<InlineKeyboardMarkup> {
  const rows = employees.map((e) => [Markup.button.callback(e.label, cb.empView(e.id))]);

  const nav = [];
  if (page > 0) nav.push(Markup.button.callback(t.common.prev, cb.employees(page - 1)));
  if (totalPages > 1) {
    nav.push(Markup.button.callback(`${page + 1}/${totalPages}`, cb.noop));
  }
  if (page < totalPages - 1)
    nav.push(Markup.button.callback(t.common.next, cb.employees(page + 1)));
  if (nav.length > 0) rows.push(nav);

  rows.push([
    Markup.button.callback(t.admin.employees.addButton, cb.addEmployee),
    Markup.button.callback(t.admin.employees.searchButton, cb.search),
  ]);
  rows.push([Markup.button.callback(t.common.back, cb.panel)]);

  return Markup.inlineKeyboard(rows);
}

export function employeeCardKeyboard(employee: {
  id: string;
  isArchived: boolean;
}): Markup.Markup<InlineKeyboardMarkup> {
  const e = t.admin.employees;
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(e.btnEdit, cb.empEditMenu(employee.id)),
      employee.isArchived
        ? Markup.button.callback(e.btnUnarchive, cb.empArchive(employee.id))
        : Markup.button.callback(e.btnArchive, cb.empArchive(employee.id)),
    ],
    [Markup.button.callback(e.btnDelete, cb.empDelete(employee.id))],
    [Markup.button.callback(t.common.back, cb.employees(0))],
  ]);
}

export function employeeDeleteKeyboard(id: string): Markup.Markup<InlineKeyboardMarkup> {
  return Markup.inlineKeyboard([
    [Markup.button.callback(t.admin.employees.btnDeleteConfirm, cb.empDeleteConfirm(id))],
    [Markup.button.callback(t.common.back, cb.empView(id))],
  ]);
}

export function employeeEditFieldsKeyboard(id: string): Markup.Markup<InlineKeyboardMarkup> {
  const f = t.admin.editEmployee.fields;
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(f.firstName, cb.empEditField('fn', id)),
      Markup.button.callback(f.lastName, cb.empEditField('ln', id)),
    ],
    [
      Markup.button.callback(f.username, cb.empEditField('un', id)),
      Markup.button.callback(f.userId, cb.empEditField('uid', id)),
    ],
    [
      Markup.button.callback(f.birthDate, cb.empEditField('bd', id)),
      Markup.button.callback(f.photo, cb.empEditField('ph', id)),
    ],
    [
      Markup.button.callback(f.department, cb.empEditField('dep', id)),
      Markup.button.callback(f.position, cb.empEditField('pos', id)),
    ],
    [Markup.button.callback(f.status, cb.empEditField('st', id))],
    [Markup.button.callback(t.common.back, cb.empView(id))],
  ]);
}

export function upcomingKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
  const u = t.admin.upcoming;
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(u.btnTriggerReminder, cb.triggerReminder),
      Markup.button.callback(u.btnTriggerAnnouncement, cb.triggerAnnouncement),
    ],
    [
      Markup.button.callback(u.btnTriggerPublish, cb.triggerPublish),
      Markup.button.callback(u.btnTriggerEvening, cb.triggerEvening),
    ],
    [Markup.button.callback(t.common.back, cb.panel)],
  ]);
}

export function settingsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
  const s = t.admin.settings;
  return Markup.inlineKeyboard([
    [Markup.button.callback(s.btnGroup, cb.setField('grp'))],
    [
      Markup.button.callback(s.btnReminder, cb.setField('rem')),
      Markup.button.callback(s.btnMorning, cb.setField('mor')),
    ],
    [
      Markup.button.callback(s.btnInterval, cb.setField('itv')),
      Markup.button.callback(s.btnEvening, cb.setField('eve')),
    ],
    [Markup.button.callback(s.btnTimezone, cb.setField('tz'))],
    [Markup.button.callback(s.btnToggleWishes, cb.setToggleWishes)],
    [Markup.button.callback(s.btnToggleApproval, cb.setToggleApproval)],
    [Markup.button.callback(t.common.back, cb.panel)],
  ]);
}

export function wishesEmployeesKeyboard(items: LabeledId[]): Markup.Markup<InlineKeyboardMarkup> {
  const rows = items.map((e) => [Markup.button.callback(e.label, cb.wishEmployee(e.id))]);
  rows.push([Markup.button.callback(t.common.back, cb.panel)]);
  return Markup.inlineKeyboard(rows);
}

export function wishModerationKeyboard(wishId: string): Markup.Markup<InlineKeyboardMarkup> {
  const w = t.admin.wishesMod;
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(w.btnApprove, cb.wishApprove(wishId)),
      Markup.button.callback(w.btnReject, cb.wishReject(wishId)),
    ],
    [
      Markup.button.callback(w.btnPublish, cb.wishPublish(wishId)),
      Markup.button.callback(w.btnDelete, cb.wishDelete(wishId)),
    ],
  ]);
}
