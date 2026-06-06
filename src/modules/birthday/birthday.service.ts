/**
 * Cross-module birthday helpers: idempotent event bookkeeping and the
 * aggregated statistics shown on the admin dashboard. This service contains no
 * Telegram I/O — sending is handled by the orchestrator in the jobs layer.
 */
import { BirthdayEvent } from '@prisma/client';
import { todayCalendarDateUtc } from '../../utils/date.util';
import { employeeService, EmployeeService } from '../employee/employee.service';
import { wishService, WishService } from '../wish/wish.service';
import { birthdayEventRepository, BirthdayEventRepository } from './event.repository';

export interface DashboardStats {
  totalEmployees: number;
  birthdaysThisMonth: number;
  wishesTotal: number;
  wishesPublished: number;
  participationRate: number;
}

export class BirthdayService {
  constructor(
    private readonly events: BirthdayEventRepository = birthdayEventRepository,
    private readonly employees: EmployeeService = employeeService,
    private readonly wishes: WishService = wishService,
  ) {}

  /** The idempotency record for an employee's birthday today (in tz). */
  ensureTodayEvent(employeeId: string, timezone: string): Promise<BirthdayEvent> {
    return this.events.getOrCreate(employeeId, todayCalendarDateUtc(timezone));
  }

  ensureEventForDate(employeeId: string, eventDate: Date): Promise<BirthdayEvent> {
    return this.events.getOrCreate(employeeId, eventDate);
  }

  getTodayEvent(employeeId: string, timezone: string): Promise<BirthdayEvent | null> {
    return this.events.find(employeeId, todayCalendarDateUtc(timezone));
  }

  markReminderSent(eventId: string): Promise<BirthdayEvent> {
    return this.events.update(eventId, { reminderSentAt: new Date() });
  }

  markAnnouncementSent(eventId: string): Promise<BirthdayEvent> {
    return this.events.update(eventId, { announcementSentAt: new Date() });
  }

  setPoll(eventId: string, pollMessageId: number): Promise<BirthdayEvent> {
    return this.events.update(eventId, { pollMessageId, pollSentAt: new Date() });
  }

  markSummarySent(eventId: string): Promise<BirthdayEvent> {
    return this.events.update(eventId, { summarySentAt: new Date() });
  }

  async getDashboardStats(timezone: string): Promise<DashboardStats> {
    const [totalEmployees, birthdaysThisMonth, wishStats] = await Promise.all([
      this.employees.count(),
      this.employees.countThisMonth(timezone),
      this.wishes.stats(),
    ]);

    const participationRate =
      totalEmployees > 0
        ? Math.min(100, Math.round((wishStats.distinctSenders / totalEmployees) * 100))
        : 0;

    return {
      totalEmployees,
      birthdaysThisMonth,
      wishesTotal: wishStats.wishesTotal,
      wishesPublished: wishStats.wishesPublished,
      participationRate,
    };
  }
}

export const birthdayService = new BirthdayService();
