/**
 * Admin-facing templates for rendering employee records.
 */
import { t } from '../localization';
import { formatUzbekDate } from '../utils/date.util';
import { escapeHtml, fullName } from '../utils/format.util';

export interface EmployeeViewModel {
  firstName: string;
  lastName: string;
  birthMonth: number;
  birthDay: number;
  department?: string | null;
  position?: string | null;
  telegramUsername?: string | null;
  telegramUserId?: bigint | null;
  isActive: boolean;
  isArchived: boolean;
}

const DASH = '—';

export function employeeStatusLabel(e: Pick<EmployeeViewModel, 'isActive' | 'isArchived'>): string {
  if (e.isArchived) return t.admin.employees.statusArchived;
  return e.isActive ? t.admin.employees.statusActive : t.admin.employees.statusInactive;
}

function usernameLabel(username?: string | null): string {
  if (!username) return DASH;
  return `@${escapeHtml(username.replace(/^@/, ''))}`;
}

/** Full detail card shown when an admin opens an employee. */
export function employeeCard(e: EmployeeViewModel): string {
  return t.admin.employees.card({
    fullName: escapeHtml(fullName(e)),
    dateLabel: formatUzbekDate(e.birthMonth, e.birthDay),
    department: e.department ? escapeHtml(e.department) : DASH,
    position: e.position ? escapeHtml(e.position) : DASH,
    username: usernameLabel(e.telegramUsername),
    telegramId: e.telegramUserId ? e.telegramUserId.toString() : DASH,
    statusLabel: employeeStatusLabel(e),
  });
}

/** Compact, escaped summary used in the "add employee" review step. */
export function employeeReviewSummary(draft: {
  firstName: string;
  lastName: string;
  telegramUsername?: string | null;
  telegramUserId?: string | null;
  birthMonth: number;
  birthDay: number;
  department?: string | null;
  position?: string | null;
  hasPhoto: boolean;
}): string {
  const lines = [
    `👤 Ism familiya: <b>${escapeHtml(`${draft.firstName} ${draft.lastName}`)}</b>`,
    `📅 Tug'ilgan kun: ${formatUzbekDate(draft.birthMonth, draft.birthDay)}`,
    `📱 Username: ${usernameLabel(draft.telegramUsername)}`,
    `🆔 Telegram ID: ${draft.telegramUserId ?? DASH}`,
    `🏢 Bo'lim: ${draft.department ? escapeHtml(draft.department) : DASH}`,
    `💼 Lavozim: ${draft.position ? escapeHtml(draft.position) : DASH}`,
    `🖼 Rasm: ${draft.hasPhoto ? 'bor' : DASH}`,
  ];
  return lines.join('\n');
}
