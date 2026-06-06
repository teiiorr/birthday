/**
 * Single shared PrismaClient instance. Prisma warnings and errors are routed
 * into the structured logger instead of raw stdout.
 */
import { Prisma, PrismaClient } from '@prisma/client';
import { createLogger } from '../logger/logger';

const log = createLogger('database');

export const prisma = new PrismaClient({
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
});

prisma.$on('warn', (event: Prisma.LogEvent) => {
  log.warn({ target: event.target }, event.message);
});

prisma.$on('error', (event: Prisma.LogEvent) => {
  log.error({ target: event.target }, event.message);
});

/** Connect and verify the database is reachable. */
export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  // A trivial round-trip confirms the connection is genuinely usable.
  await prisma.$queryRaw`SELECT 1`;
  log.info('Database connected');
}

/** Close the connection pool during graceful shutdown. */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  log.info('Database disconnected');
}
