/**
 * Database seed — safe to run repeatedly (idempotent).
 *
 *  - Ensures the singleton `settings` row (id = 1) exists.
 *  - Registers every admin listed in ADMIN_TELEGRAM_IDS.
 *  - Optionally stores GROUP_CHAT_ID / TIMEZONE from the environment.
 *
 * Run with:  npm run db:seed
 */
/* eslint-disable no-console -- this is a CLI script; console output is intended */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function parseAdminIds(raw: string | undefined): bigint[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => /^\d+$/.test(part))
    .map((part) => BigInt(part));
}

function parseBigIntOrNull(raw: string | undefined): bigint | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  return /^-?\d+$/.test(trimmed) ? BigInt(trimmed) : null;
}

async function main(): Promise<void> {
  const timezone = process.env.TIMEZONE?.trim() || 'Asia/Tashkent';
  const groupChatId = parseBigIntOrNull(process.env.GROUP_CHAT_ID);
  const adminIds = parseAdminIds(process.env.ADMIN_TELEGRAM_IDS);

  // 1. Settings singleton ------------------------------------------------------
  const existing = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!existing) {
    await prisma.settings.create({
      data: {
        id: 1,
        timezone,
        ...(groupChatId !== null ? { groupChatId } : {}),
      },
    });
    console.log('[seed] Created settings row (id=1).');
  } else {
    console.log('[seed] Settings row already exists — left untouched.');
  }

  // 2. Admins ------------------------------------------------------------------
  if (adminIds.length === 0) {
    console.warn('[seed] No ADMIN_TELEGRAM_IDS provided — skipping admin seeding.');
  }
  for (const telegramUserId of adminIds) {
    await prisma.admin.upsert({
      where: { telegramUserId },
      create: { telegramUserId, fullName: `Admin ${telegramUserId}` },
      update: {},
    });
    console.log(`[seed] Ensured admin ${telegramUserId}.`);
  }

  console.log('[seed] Done.');
}

main()
  .catch((error) => {
    console.error('[seed] Failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
