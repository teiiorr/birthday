/**
 * Group-facing message templates for the birthday lifecycle. Each function
 * returns an HTML string ready to send with `parse_mode: 'HTML'`.
 */
import { t } from '../localization';
import { formatUzbekDate } from '../utils/date.util';
import { escapeHtml, fullName } from '../utils/format.util';

export interface EmployeeLike {
  firstName: string;
  lastName: string;
  birthMonth: number;
  birthDay: number;
  photoFileId?: string | null;
  position?: string | null;
}

function positionHtml(employee: EmployeeLike): string | undefined {
  return employee.position ? escapeHtml(employee.position) : undefined;
}

/** One-day-before reminder with the "write a wish" call to action. */
export function reminderMessage(employee: EmployeeLike): string {
  return t.group.reminder(escapeHtml(fullName(employee)), positionHtml(employee));
}

/** Morning birthday announcement. */
export function announcementMessage(employee: EmployeeLike): string {
  return t.group.announcement(escapeHtml(fullName(employee)), positionHtml(employee));
}

/** A single gradual anonymous wish reveal (#seq). */
export function wishRevealMessage(seq: number, message: string): string {
  return t.group.wishReveal(seq, escapeHtml(message));
}

/** Evening wrap-up; handles the "no wishes" scenario warmly. */
export function eveningSummaryMessage(employee: EmployeeLike, wishCount: number): string {
  const first = escapeHtml(employee.firstName);
  return wishCount > 0
    ? t.group.eveningSummary(first, wishCount)
    : t.group.eveningSummaryNoWishes(first);
}

/** `/next` card: the nearest upcoming birthday. */
export function nextBirthdayCard(employee: EmployeeLike, daysLeft: number): string {
  return t.next.card(
    escapeHtml(fullName(employee)),
    formatUzbekDate(employee.birthMonth, employee.birthDay),
    daysLeft,
  );
}

/** `/birthdays` list for the current month. */
export function monthlyListMessage(
  rows: ReadonlyArray<{ month: number; day: number; name: string }>,
): string {
  if (rows.length === 0) return t.birthdays.emptyMonth;
  const body = rows
    .map((row) => t.birthdays.row(formatUzbekDate(row.month, row.day), escapeHtml(row.name)))
    .join('\n');
  return t.birthdays.header + body;
}
