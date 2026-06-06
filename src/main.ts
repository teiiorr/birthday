/**
 * Application entry point.
 *
 * Boot order:
 *   1. Validate environment (importing `config` does this and exits on failure)
 *   2. Connect to PostgreSQL
 *   3. Ensure settings singleton + sync env admins
 *   4. Build the bot, discover its @username (for deep links)
 *   5. Create the orchestrator + scheduler, start cron jobs
 *   6. Start the health server
 *   7. Launch the bot (long polling by default)
 *   8. Install graceful-shutdown handlers
 */
import './utils/bigint';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './infrastructure/database/prisma';
import { HealthServer } from './infrastructure/health/health.server';
import { createLogger } from './infrastructure/logger/logger';
import { adminService } from './modules/admin/admin.service';
import { settingsService } from './modules/settings/settings.service';
import { configureBotCommands, createBot } from './bot/bot';
import { setBotUsername, setOrchestrator, setRescheduleHook } from './bot/runtime';
import { BirthdayOrchestrator } from './jobs/orchestrator';
import { Scheduler } from './jobs/scheduler';

const log = createLogger('main');

async function bootstrap(): Promise<void> {
  log.info({ env: config.nodeEnv, timezone: config.timezone }, 'Starting Birthday Team Bot');

  // 2. Database
  await connectDatabase();

  // 3. Settings + admins
  await settingsService.get();
  await adminService.syncEnvAdmins();
  log.info('Settings ensured and admins synced');

  // 4. Bot + identity
  const bot = createBot();
  const me = await bot.telegram.getMe();
  setBotUsername(me.username);
  log.info({ username: me.username }, 'Bot identity resolved');

  // 5. Orchestrator + scheduler
  const orchestrator = new BirthdayOrchestrator(bot.telegram);
  setOrchestrator(orchestrator);
  const scheduler = new Scheduler(orchestrator);
  setRescheduleHook(() => scheduler.reschedule());
  await scheduler.start();

  // 6. Health server (skipped in webhook mode, which uses the same port)
  const useWebhook = config.botMode === 'webhook' && Boolean(config.webhookDomain);
  const healthServer = new HealthServer();
  if (!useWebhook) {
    await healthServer.start();
  }

  // 7. Command menus + launch
  await configureBotCommands(bot);

  if (useWebhook && config.webhookDomain) {
    await bot.launch({
      webhook: {
        domain: config.webhookDomain,
        path: config.webhookPath ?? '/telegraf',
        port: config.port,
      },
    });
    log.info({ domain: config.webhookDomain }, 'Bot started (webhook mode)');
  } else {
    // Long polling: launch() resolves only when the bot stops, so do not await.
    void bot.launch({ dropPendingUpdates: true }).catch((error) => {
      log.error({ err: error }, 'Bot polling terminated with error');
    });
    log.info('Bot started (long polling)');
  }

  // 8. Graceful shutdown
  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    log.info({ signal }, 'Shutting down gracefully');
    try {
      scheduler.stop();
      bot.stop(signal);
      await healthServer.stop();
      await disconnectDatabase();
    } catch (error) {
      log.error({ err: error }, 'Error during shutdown');
    } finally {
      process.exit(0);
    }
  };

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    log.error({ err: reason }, 'Unhandled promise rejection');
  });
  process.on('uncaughtException', (error) => {
    log.fatal({ err: error }, 'Uncaught exception');
  });
}

bootstrap().catch((error) => {
  log.fatal({ err: error }, 'Fatal error during startup');
  process.exit(1);
});
