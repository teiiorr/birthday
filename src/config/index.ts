/**
 * Application configuration — a single, strongly-typed, validated object
 * derived from the environment. Import `config` anywhere instead of touching
 * `process.env` directly.
 */
import { rawEnv } from './env';

export interface AppConfig {
  readonly nodeEnv: 'production' | 'development' | 'test';
  readonly isProduction: boolean;
  readonly isDevelopment: boolean;

  readonly botToken: string;
  /** Numeric Telegram IDs (as strings) that always have admin privileges. */
  readonly adminTelegramIds: readonly string[];
  /** Default corporate group chat id from env (settings table may override). */
  readonly groupChatId?: string;

  readonly databaseUrl: string;
  readonly port: number;
  readonly timezone: string;
  readonly logLevel: string;

  readonly botMode: 'polling' | 'webhook';
  readonly webhookDomain?: string;
  readonly webhookPath?: string;
}

export const config: AppConfig = Object.freeze({
  nodeEnv: rawEnv.NODE_ENV,
  isProduction: rawEnv.NODE_ENV === 'production',
  isDevelopment: rawEnv.NODE_ENV === 'development',

  botToken: rawEnv.BOT_TOKEN,
  adminTelegramIds: Object.freeze([...rawEnv.ADMIN_TELEGRAM_IDS]),
  groupChatId: rawEnv.GROUP_CHAT_ID,

  databaseUrl: rawEnv.DATABASE_URL,
  port: rawEnv.PORT,
  timezone: rawEnv.TIMEZONE,
  logLevel: rawEnv.LOG_LEVEL,

  botMode: rawEnv.BOT_MODE,
  webhookDomain: rawEnv.WEBHOOK_DOMAIN,
  webhookPath: rawEnv.WEBHOOK_PATH,
});
