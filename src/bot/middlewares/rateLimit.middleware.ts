/**
 * Simple in-memory, per-user fixed-window rate limiter. Protects against
 * accidental floods (e.g. a user mashing inline buttons). For a single-instance
 * Droplet deployment an in-memory limiter is sufficient.
 */
import { RATE_LIMIT_MAX_HITS, RATE_LIMIT_WINDOW_MS } from '../../config/constants';
import type { BotContext } from '../context';

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<number, Window>();

// Periodically evict stale windows so the map cannot grow unbounded.
const sweeper = setInterval(() => {
  const now = Date.now();
  for (const [userId, window] of windows) {
    if (window.resetAt <= now) windows.delete(userId);
  }
}, RATE_LIMIT_WINDOW_MS * 10);
// Do not keep the process alive solely for the sweeper.
sweeper.unref?.();

export function rateLimit() {
  return async (ctx: BotContext, next: () => Promise<void>): Promise<void> => {
    const userId = ctx.from?.id;
    if (!userId) return next();

    const now = Date.now();
    const window = windows.get(userId);

    if (!window || window.resetAt <= now) {
      windows.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      return next();
    }

    window.count += 1;
    if (window.count > RATE_LIMIT_MAX_HITS) {
      if (ctx.callbackQuery) {
        await ctx.answerCbQuery('⏳').catch(() => undefined);
      }
      return; // Drop the update.
    }

    return next();
  };
}
