/**
 * Cron scheduler. Reads the (admin-editable) settings and wires up:
 *   - daily reminder           (HH:mm, timezone-aware cron)
 *   - daily morning announcement (HH:mm)
 *   - daily evening summary     (HH:mm)
 *   - gradual wish publisher    (every N minutes, via setInterval)
 *
 * `reschedule()` tears everything down and rebuilds it, so settings changes
 * take effect without a restart.
 */
import cron, { type ScheduledTask } from 'node-cron';
import { createLogger } from '../infrastructure/logger/logger';
import { settingsService } from '../modules/settings/settings.service';
import { timeToCron } from '../utils/date.util';
import type { BirthdayOrchestrator } from './orchestrator';

const log = createLogger('scheduler');

export class Scheduler {
  private cronTasks: ScheduledTask[] = [];
  private publishTimer?: NodeJS.Timeout;

  constructor(private readonly orchestrator: BirthdayOrchestrator) {}

  async start(): Promise<void> {
    await this.build();
    log.info('Cron jobs started');
  }

  async reschedule(): Promise<void> {
    this.stop();
    await this.build();
    log.info('Cron jobs rescheduled after settings change');
  }

  stop(): void {
    for (const task of this.cronTasks) task.stop();
    this.cronTasks = [];
    if (this.publishTimer) {
      clearInterval(this.publishTimer);
      this.publishTimer = undefined;
    }
  }

  private async build(): Promise<void> {
    const settings = await settingsService.refresh();
    const timezone = settings.timezone;
    const options = { timezone } as const;

    this.cronTasks.push(
      cron.schedule(
        timeToCron(settings.reminderTime),
        () => this.run('reminders', () => this.orchestrator.runReminders()),
        options,
      ),
      cron.schedule(
        timeToCron(settings.morningBirthdayTime),
        () => this.run('announcements', () => this.orchestrator.runMorningAnnouncements()),
        options,
      ),
      cron.schedule(
        timeToCron(settings.eveningSummaryTime),
        () => this.run('eveningSummary', () => this.orchestrator.runEveningSummary()),
        options,
      ),
    );

    // The publish interval can be any number of minutes (e.g. 90), which a cron
    // minute field cannot express — so a plain interval timer is used instead.
    const intervalMs = Math.max(1, settings.publishIntervalMinutes) * 60_000;
    this.publishTimer = setInterval(() => {
      void this.run('publish', () => this.orchestrator.runWishPublishing());
    }, intervalMs);

    log.info(
      {
        timezone,
        reminderTime: settings.reminderTime,
        morningBirthdayTime: settings.morningBirthdayTime,
        eveningSummaryTime: settings.eveningSummaryTime,
        publishIntervalMinutes: settings.publishIntervalMinutes,
      },
      'Schedule configured',
    );
  }

  private async run(job: string, fn: () => Promise<number>): Promise<void> {
    try {
      const count = await fn();
      if (count > 0) log.info({ job, count }, 'Scheduled job completed');
    } catch (error) {
      log.error({ err: error, job }, 'Scheduled job failed');
    }
  }
}
