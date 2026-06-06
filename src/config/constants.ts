/**
 * Application-wide constants. Tunables that are not environment-specific live
 * here so they are easy to find and adjust.
 */

/** Anonymous wish length bounds (characters). */
export const WISH_MIN_LENGTH = 10;
export const WISH_MAX_LENGTH = 1000;

/** Pagination sizes for inline lists. */
export const EMPLOYEES_PER_PAGE = 8;
export const WISHES_PER_PAGE = 6;

/** Telegram polls accept at most 10 options. */
export const POLL_MAX_OPTIONS = 10;

/** How many days before a birthday the reminder is posted. */
export const REMINDER_DAYS_BEFORE = 1;

/** Delay between consecutive group messages to stay within Telegram limits. */
export const GROUP_SEND_THROTTLE_MS = 1200;

/** Deep-link `/start` payload prefix used by the group "write a wish" button. */
export const START_PAYLOAD_WISH_PREFIX = 'wish-';

/** Singleton primary key for the settings row. */
export const SETTINGS_SINGLETON_ID = 1;

/** Simple in-memory rate limiter defaults (per user). */
export const RATE_LIMIT_WINDOW_MS = 2000;
export const RATE_LIMIT_MAX_HITS = 6;
