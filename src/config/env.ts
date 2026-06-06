/**
 * Environment validation.
 *
 * All process configuration is parsed and validated here exactly once, at
 * startup. If anything required is missing or malformed the process exits with
 * a clear, human-readable error instead of failing mysteriously later.
 */
import 'dotenv/config';
import { IANAZone } from 'luxon';
import { z } from 'zod';

/** Comma-separated list of numeric Telegram IDs -> string[]. */
const numericIdList = z.string().transform((value, ctx) => {
  const ids = value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  for (const id of ids) {
    if (!/^\d+$/.test(id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `"${id}" is not a valid numeric Telegram ID`,
      });
      return z.NEVER;
    }
  }
  return ids;
});

/** Treat empty strings as "not provided" for optional variables. */
const emptyToUndefined = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const envSchema = z
  .object({
    NODE_ENV: z.enum(['production', 'development', 'test']).default('production'),

    BOT_TOKEN: z.string().min(1, 'BOT_TOKEN is required'),

    ADMIN_TELEGRAM_IDS: numericIdList.refine(
      (ids) => ids.length > 0,
      'ADMIN_TELEGRAM_IDS must contain at least one numeric Telegram ID',
    ),

    GROUP_CHAT_ID: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .regex(/^-?\d+$/, 'GROUP_CHAT_ID must be an integer (e.g. -1001234567890)')
        .optional(),
    ),

    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

    PORT: z.coerce.number().int().positive().max(65535).default(3000),

    TIMEZONE: z
      .string()
      .min(1)
      .default('Asia/Tashkent')
      .refine((tz) => IANAZone.isValidZone(tz), {
        message: 'TIMEZONE must be a valid IANA timezone (e.g. Asia/Tashkent)',
      }),

    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

    BOT_MODE: z.enum(['polling', 'webhook']).default('polling'),

    WEBHOOK_DOMAIN: z.preprocess(emptyToUndefined, z.string().url().optional()),
    WEBHOOK_PATH: z.preprocess(emptyToUndefined, z.string().optional()),
  })
  .superRefine((env, ctx) => {
    if (env.BOT_MODE === 'webhook' && !env.WEBHOOK_DOMAIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['WEBHOOK_DOMAIN'],
        message: 'WEBHOOK_DOMAIN is required when BOT_MODE=webhook',
      });
    }
  });

export type RawEnv = z.infer<typeof envSchema>;

function loadEnv(): RawEnv {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => {
        const field = issue.path.join('.') || '(root)';
        return `  • ${field}: ${issue.message}`;
      })
      .join('\n');

    // We cannot use the structured logger here — it depends on validated env.
    // eslint-disable-next-line no-console
    console.error(
      `\n❌ Invalid environment configuration. Please fix your .env file:\n\n${issues}\n`,
    );
    process.exit(1);
  }

  return parsed.data;
}

export const rawEnv = loadEnv();
