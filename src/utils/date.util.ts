/**
 * Timezone-aware date helpers built on Luxon.
 *
 * Birthdays are inherently year-agnostic, so most helpers work with a
 * (month, day) pair. All "today/tomorrow" reasoning is done in the configured
 * timezone (default Asia/Tashkent) so scheduling matches local expectations.
 */
import { DateTime } from 'luxon';

/** Uzbek (Latin) month names, lower-cased for date formatting like "12-iyun". */
export const UZBEK_MONTHS: readonly string[] = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentyabr',
  'oktyabr',
  'noyabr',
  'dekabr',
];

export interface MonthDay {
  month: number; // 1-12
  day: number; // 1-31
}

/** Current DateTime in the given timezone. */
export function nowInZone(timezone: string): DateTime {
  return DateTime.now().setZone(timezone);
}

/** Today's (month, day) in the given timezone. */
export function todayMonthDay(timezone: string): MonthDay {
  const now = nowInZone(timezone);
  return { month: now.month, day: now.day };
}

/** Tomorrow's (month, day) in the given timezone. */
export function tomorrowMonthDay(timezone: string): MonthDay {
  const tomorrow = nowInZone(timezone).plus({ days: 1 });
  return { month: tomorrow.month, day: tomorrow.day };
}

/**
 * Format a (month, day) as an Uzbek date string, e.g. "12-iyun".
 * Falls back gracefully for out-of-range months.
 */
export function formatUzbekDate(month: number, day: number): string {
  const name = UZBEK_MONTHS[month - 1] ?? '';
  return `${day}-${name}`;
}

/**
 * Number of whole days from "today" (in tz) until the next occurrence of the
 * given birthday. Returns 0 when the birthday is today.
 */
export function daysUntilBirthday(month: number, day: number, timezone: string): number {
  const today = nowInZone(timezone).startOf('day');

  let next = buildBirthdayThisYear(month, day, today);
  if (next < today) {
    next = next.plus({ years: 1 });
  }
  return Math.round(next.diff(today, 'days').days);
}

/**
 * The next upcoming birthday DateTime (start of day, in tz). If the birthday
 * already passed this year it rolls over to next year.
 */
export function nextBirthdayDate(month: number, day: number, timezone: string): DateTime {
  const today = nowInZone(timezone).startOf('day');
  let next = buildBirthdayThisYear(month, day, today);
  if (next < today) {
    next = next.plus({ years: 1 });
  }
  return next;
}

/**
 * A calendar date (year-month-day) represented as midnight UTC, suitable for a
 * Prisma `@db.Date` column. Storing as midnight UTC keeps the stored date
 * stable regardless of server timezone.
 */
export function calendarDateUtc(year: number, month: number, day: number): Date {
  return DateTime.fromObject({ year, month, day }, { zone: 'utc' }).toJSDate();
}

/** Today's calendar date (in tz) as a midnight-UTC JS Date for `@db.Date`. */
export function todayCalendarDateUtc(timezone: string): Date {
  const now = nowInZone(timezone);
  return calendarDateUtc(now.year, now.month, now.day);
}

/** Tomorrow's calendar date (in tz) as a midnight-UTC JS Date for `@db.Date`. */
export function tomorrowCalendarDateUtc(timezone: string): Date {
  const tomorrow = nowInZone(timezone).plus({ days: 1 });
  return calendarDateUtc(tomorrow.year, tomorrow.month, tomorrow.day);
}

/**
 * Parse a user-entered birth date. Accepts DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY,
 * and the same without a year (defaults to year 2000 for storage). Returns null
 * if the date is invalid.
 */
export function parseBirthDate(input: string): { date: Date; month: number; day: number } | null {
  const cleaned = input.trim().replace(/[/.\s]/g, '-');
  const parts = cleaned.split('-').filter(Boolean);

  if (parts.length < 2) return null;

  const day = Number(parts[0]);
  const month = Number(parts[1]);
  const year = parts.length >= 3 ? Number(parts[2]) : 2000;

  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return null;
  }

  const dt = DateTime.fromObject({ year, month, day }, { zone: 'utc' });
  if (!dt.isValid || dt.month !== month || dt.day !== day) {
    return null;
  }

  return { date: dt.toJSDate(), month, day };
}

/** Validate an "HH:mm" 24-hour time string. */
export function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value.trim());
}

/** Convert "HH:mm" into a daily cron expression "m h * * *". */
export function timeToCron(time: string): string {
  const [hours, minutes] = time.split(':');
  return `${Number(minutes)} ${Number(hours)} * * *`;
}

/** Helper: build the DateTime for this year's birthday in the given tz. */
function buildBirthdayThisYear(month: number, day: number, reference: DateTime): DateTime {
  // Guard against invalid dates such as Feb 29 in a non-leap year.
  const candidate = DateTime.fromObject(
    { year: reference.year, month, day },
    { zone: reference.zoneName ?? 'utc' },
  );
  if (candidate.isValid) {
    return candidate.startOf('day');
  }
  // Fall back to the 28th for Feb 29 in non-leap years.
  return DateTime.fromObject(
    { year: reference.year, month, day: 28 },
    { zone: reference.zoneName ?? 'utc' },
  ).startOf('day');
}
