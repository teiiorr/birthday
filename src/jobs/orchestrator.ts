/**
 * BirthdayOrchestrator — the single owner of all group-facing publishing.
 *
 * Both the cron scheduler and the admin "manual trigger" actions call into this
 * class, so the behaviour is identical whether a step fires automatically or is
 * triggered by hand. Every step is idempotent via the BirthdayEvent record.
 */
import { Employee } from '@prisma/client';
import type { Telegram } from 'telegraf';
import { GROUP_SEND_THROTTLE_MS, POLL_MAX_OPTIONS } from '../config/constants';
import { createLogger } from '../infrastructure/logger/logger';
import { t } from '../localization';
import { birthdayService } from '../modules/birthday/birthday.service';
import { employeeService } from '../modules/employee/employee.service';
import { settingsService } from '../modules/settings/settings.service';
import { wishService } from '../modules/wish/wish.service';
import {
  announcementMessage,
  eveningSummaryMessage,
  reminderMessage,
  wishRevealMessage,
} from '../templates/birthday.template';
import { sleep } from '../utils/async.util';
import { tomorrowCalendarDateUtc } from '../utils/date.util';
import { reminderKeyboard } from '../bot/keyboards/wish.keyboard';

const log = createLogger('orchestrator');

export class BirthdayOrchestrator {
  constructor(private readonly telegram: Telegram) {}

  private async groupChatId(): Promise<string | null> {
    return settingsService.getEffectiveGroupChatId();
  }

  /** One-day-before reminders for everyone with a birthday tomorrow. */
  async runReminders(): Promise<number> {
    const groupId = await this.groupChatId();
    if (!groupId) {
      log.warn('Reminder skipped — no group chat id configured');
      return 0;
    }

    const timezone = await settingsService.getTimezone();
    const eventDate = tomorrowCalendarDateUtc(timezone);
    const employees = await employeeService.getBirthdaysTomorrow(timezone);
    let sent = 0;

    for (const employee of employees) {
      try {
        const event = await birthdayService.ensureEventForDate(employee.id, eventDate);
        if (event.reminderSentAt) continue;

        await this.telegram.sendMessage(groupId, reminderMessage(employee), {
          parse_mode: 'HTML',
          reply_markup: reminderKeyboard(employee.id).reply_markup,
        });
        await birthdayService.markReminderSent(event.id);
        sent += 1;
        log.info({ employeeId: employee.id }, 'Birthday reminder sent');
        await sleep(GROUP_SEND_THROTTLE_MS);
      } catch (error) {
        log.error({ err: error, employeeId: employee.id }, 'Failed to send reminder');
      }
    }
    return sent;
  }

  /** Morning announcements for everyone with a birthday today. */
  async runMorningAnnouncements(): Promise<number> {
    const groupId = await this.groupChatId();
    if (!groupId) {
      log.warn('Announcement skipped — no group chat id configured');
      return 0;
    }

    const timezone = await settingsService.getTimezone();
    const employees = await employeeService.getBirthdaysToday(timezone);
    let sent = 0;

    for (const employee of employees) {
      try {
        const event = await birthdayService.ensureTodayEvent(employee.id, timezone);
        if (event.announcementSentAt) continue;

        await this.sendAnnouncement(groupId, employee);
        await birthdayService.markAnnouncementSent(event.id);
        sent += 1;
        log.info({ employeeId: employee.id }, 'Birthday announcement sent');
        await sleep(GROUP_SEND_THROTTLE_MS);
      } catch (error) {
        log.error({ err: error, employeeId: employee.id }, 'Failed to send announcement');
      }
    }
    return sent;
  }

  /**
   * Gradual reveal: publishes the next single unpublished wish for each of
   * today's birthdays. Runs on the publish interval, so wishes trickle out over
   * the day rather than all at once.
   */
  async runWishPublishing(): Promise<number> {
    const groupId = await this.groupChatId();
    if (!groupId) return 0;

    const settings = await settingsService.get();
    if (!settings.anonymousWishesEnabled) return 0;

    const timezone = settings.timezone;
    const employees = await employeeService.getBirthdaysToday(timezone);
    let published = 0;

    for (const employee of employees) {
      try {
        const event = await birthdayService.ensureTodayEvent(employee.id, timezone);
        // Never reveal wishes before the birthday announcement itself.
        if (!event.announcementSentAt) continue;

        const next = await wishService.findNextUnpublished(employee.id);
        if (!next) continue;

        const { seq } = await wishService.markPublished(next);
        await this.telegram.sendMessage(groupId, wishRevealMessage(seq, next.message), {
          parse_mode: 'HTML',
        });
        published += 1;
        log.info({ employeeId: employee.id, wishId: next.id, seq }, 'Anonymous wish published');
        await sleep(GROUP_SEND_THROTTLE_MS);
      } catch (error) {
        log.error({ err: error, employeeId: employee.id }, 'Failed to publish wish');
      }
    }
    return published;
  }

  /**
   * Evening wrap-up: flush any remaining wishes, create the community poll, and
   * post the summary. Works even when nobody wrote a wish (warm message).
   */
  async runEveningSummary(): Promise<number> {
    const groupId = await this.groupChatId();
    if (!groupId) {
      log.warn('Evening summary skipped — no group chat id configured');
      return 0;
    }

    const timezone = await settingsService.getTimezone();
    const employees = await employeeService.getBirthdaysToday(timezone);
    let summarized = 0;

    for (const employee of employees) {
      try {
        const event = await birthdayService.ensureTodayEvent(employee.id, timezone);
        if (event.summarySentAt) continue;
        if (!event.announcementSentAt) {
          // Edge case: announcement never ran today — send it first.
          await this.sendAnnouncement(groupId, employee);
          await birthdayService.markAnnouncementSent(event.id);
        }

        await this.flushRemainingWishes(groupId, employee.id);
        await this.createPollIfNeeded(groupId, employee.id, event.id, event.pollSentAt);

        const count = await wishService.countApproved(employee.id);
        await this.telegram.sendMessage(groupId, eveningSummaryMessage(employee, count), {
          parse_mode: 'HTML',
        });
        await birthdayService.markSummarySent(event.id);
        summarized += 1;
        log.info({ employeeId: employee.id, count }, 'Evening summary sent');
        await sleep(GROUP_SEND_THROTTLE_MS);
      } catch (error) {
        log.error({ err: error, employeeId: employee.id }, 'Failed to send evening summary');
      }
    }
    return summarized;
  }

  /** Manually publish one specific wish to the group (admin moderation). */
  async publishWishNow(wishId: string): Promise<boolean> {
    const groupId = await this.groupChatId();
    if (!groupId) return false;

    const result = await wishService.publishManually(wishId);
    if (!result) return false;

    const employee = await employeeService.getById(result.wish.employeeId);
    if (!employee) return false;

    await this.telegram.sendMessage(groupId, wishRevealMessage(result.seq, result.wish.message), {
      parse_mode: 'HTML',
    });
    log.info({ wishId, seq: result.seq }, 'Anonymous wish published (manual)');
    return true;
  }

  // ── internals ──────────────────────────────────────────────────────────────

  private async sendAnnouncement(groupId: string, employee: Employee): Promise<void> {
    const text = announcementMessage(employee);
    if (employee.photoFileId) {
      await this.telegram.sendPhoto(groupId, employee.photoFileId, {
        caption: text,
        parse_mode: 'HTML',
      });
    } else {
      await this.telegram.sendMessage(groupId, text, { parse_mode: 'HTML' });
    }
  }

  private async flushRemainingWishes(groupId: string, employeeId: string): Promise<void> {
    // Publish everything still pending so the evening count is complete.
    for (;;) {
      const next = await wishService.findNextUnpublished(employeeId);
      if (!next) break;
      const { seq } = await wishService.markPublished(next);
      await this.telegram.sendMessage(groupId, wishRevealMessage(seq, next.message), {
        parse_mode: 'HTML',
      });
      log.info({ employeeId, wishId: next.id, seq }, 'Anonymous wish published (flush)');
      await sleep(GROUP_SEND_THROTTLE_MS);
    }
  }

  private async createPollIfNeeded(
    groupId: string,
    employeeId: string,
    eventId: string,
    pollSentAt: Date | null,
  ): Promise<void> {
    if (pollSentAt) return;

    const published = await wishService.listPublished(employeeId);
    if (published.length < 2) return; // A poll needs at least two options.

    const options = published
      .slice(0, POLL_MAX_OPTIONS)
      .map((_, index) => t.group.pollOption(index + 1));

    const poll = await this.telegram.sendPoll(groupId, t.group.pollQuestion, options, {
      is_anonymous: true,
    });
    await birthdayService.setPoll(eventId, poll.message_id);
    log.info({ employeeId, options: options.length }, 'Community poll created');
    await sleep(GROUP_SEND_THROTTLE_MS);
  }
}
