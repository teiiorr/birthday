/**
 * Employee business logic. Keeps derived fields (birthMonth/birthDay) in sync
 * and provides all birthday-oriented queries the rest of the app needs.
 */
import { Employee } from '@prisma/client';
import { DateTime } from 'luxon';
import { daysUntilBirthday, todayMonthDay, tomorrowMonthDay } from '../../utils/date.util';
import { normalizeUzbekApostrophes } from '../../utils/format.util';
import { employeeRepository, EmployeeRepository } from './employee.repository';
import type {
  CreateEmployeeInput,
  ListEmployeesOptions,
  UpdateEmployeeInput,
} from './employee.types';

export interface CreateEmployeeData {
  firstName: string;
  lastName: string;
  telegramUsername?: string | null;
  telegramUserId?: bigint | null;
  birthDate: Date;
  department?: string | null;
  position?: string | null;
  photoFileId?: string | null;
  isActive?: boolean;
}

export type UpdateEmployeeData = Partial<CreateEmployeeData> & { isArchived?: boolean };

export interface UpcomingBirthday {
  employee: Employee;
  daysLeft: number;
}

function monthDayFromDate(date: Date): { month: number; day: number } {
  const dt = DateTime.fromJSDate(date, { zone: 'utc' });
  return { month: dt.month, day: dt.day };
}

function normalizeUsername(username?: string | null): string | null {
  if (!username) return null;
  const cleaned = username.trim().replace(/^@/, '');
  return cleaned.length > 0 ? cleaned : null;
}

/** Trim + fix Uzbek apostrophe orthography for a required text field. */
function normalizeName(value: string): string {
  return normalizeUzbekApostrophes(value.trim());
}

/** Trim + fix Uzbek apostrophe orthography for an optional text field. */
function cleanUzbekText(value?: string | null): string | null {
  if (!value) return null;
  const cleaned = normalizeUzbekApostrophes(value.trim());
  return cleaned.length > 0 ? cleaned : null;
}

export class EmployeeService {
  constructor(private readonly repo: EmployeeRepository = employeeRepository) {}

  async create(data: CreateEmployeeData): Promise<Employee> {
    const { month, day } = monthDayFromDate(data.birthDate);
    const input: CreateEmployeeInput = {
      firstName: normalizeName(data.firstName),
      lastName: normalizeName(data.lastName),
      telegramUsername: normalizeUsername(data.telegramUsername),
      telegramUserId: data.telegramUserId ?? null,
      birthDate: data.birthDate,
      birthMonth: month,
      birthDay: day,
      department: cleanUzbekText(data.department),
      position: cleanUzbekText(data.position),
      photoFileId: data.photoFileId ?? null,
      isActive: data.isActive ?? true,
    };
    return this.repo.create(input);
  }

  async update(id: string, data: UpdateEmployeeData): Promise<Employee> {
    const input: UpdateEmployeeInput = { ...data };

    if (data.firstName !== undefined) input.firstName = normalizeName(data.firstName);
    if (data.lastName !== undefined) input.lastName = normalizeName(data.lastName);
    if (data.telegramUsername !== undefined) {
      input.telegramUsername = normalizeUsername(data.telegramUsername);
    }
    if (data.department !== undefined) input.department = cleanUzbekText(data.department);
    if (data.position !== undefined) input.position = cleanUzbekText(data.position);
    if (data.birthDate !== undefined) {
      const { month, day } = monthDayFromDate(data.birthDate);
      input.birthMonth = month;
      input.birthDay = day;
    }

    return this.repo.update(id, input);
  }

  archive(id: string): Promise<Employee> {
    return this.repo.update(id, { isArchived: true });
  }

  unarchive(id: string): Promise<Employee> {
    return this.repo.update(id, { isArchived: false });
  }

  remove(id: string): Promise<Employee> {
    return this.repo.delete(id);
  }

  getById(id: string): Promise<Employee | null> {
    return this.repo.findById(id);
  }

  getByTelegramUserId(telegramUserId: bigint): Promise<Employee | null> {
    return this.repo.findByTelegramUserId(telegramUserId);
  }

  getByIds(ids: string[]): Promise<Employee[]> {
    return this.repo.findByIds(ids);
  }

  list(options?: ListEmployeesOptions): Promise<Employee[]> {
    return this.repo.list(options);
  }

  count(includeArchived = false): Promise<number> {
    return this.repo.count(includeArchived);
  }

  search(query: string, limit?: number): Promise<Employee[]> {
    return this.repo.search(query, limit);
  }

  /** Employees whose birthday is today (in the given timezone). */
  getBirthdaysToday(timezone: string): Promise<Employee[]> {
    const { month, day } = todayMonthDay(timezone);
    return this.repo.findByMonthDay(month, day);
  }

  /** Employees whose birthday is tomorrow (in the given timezone). */
  getBirthdaysTomorrow(timezone: string): Promise<Employee[]> {
    const { month, day } = tomorrowMonthDay(timezone);
    return this.repo.findByMonthDay(month, day);
  }

  /** Employees with a birthday in the current month, ordered by day. */
  getThisMonthBirthdays(timezone: string): Promise<Employee[]> {
    const { month } = todayMonthDay(timezone);
    return this.repo.findByMonth(month);
  }

  countThisMonth(timezone: string): Promise<number> {
    const { month } = todayMonthDay(timezone);
    return this.repo.countByMonth(month);
  }

  /** Upcoming birthdays sorted by how soon they are. */
  async getUpcoming(timezone: string, limit = 10, withinDays = 366): Promise<UpcomingBirthday[]> {
    const employees = await this.repo.findAllActive();
    return employees
      .map((employee) => ({
        employee,
        daysLeft: daysUntilBirthday(employee.birthMonth, employee.birthDay, timezone),
      }))
      .filter((entry) => entry.daysLeft <= withinDays)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, limit);
  }

  /** The single nearest upcoming birthday, if any. */
  async getNextBirthday(timezone: string): Promise<UpcomingBirthday | null> {
    const [next] = await this.getUpcoming(timezone, 1);
    return next ?? null;
  }
}

export const employeeService = new EmployeeService();
