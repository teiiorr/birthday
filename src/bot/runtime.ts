/**
 * Small runtime registry for values discovered after the bot connects to
 * Telegram (e.g. the bot's @username, needed to build deep links).
 */

interface BotRuntime {
  username: string;
}

const runtime: BotRuntime = { username: '' };

export function setBotUsername(username: string): void {
  runtime.username = username;
}

export function getBotUsername(): string {
  return runtime.username;
}

/** Build a `t.me` deep link that opens the bot in a private chat with payload. */
export function deepLink(payload: string): string {
  return `https://t.me/${runtime.username}?start=${payload}`;
}

/**
 * Hook used by the settings editor to ask the scheduler to re-read settings and
 * rebuild its cron jobs after a schedule-affecting change. Wired up in main.ts.
 */
let rescheduleHook: (() => Promise<void>) | null = null;

export function setRescheduleHook(fn: () => Promise<void>): void {
  rescheduleHook = fn;
}

export async function triggerReschedule(): Promise<void> {
  if (rescheduleHook) await rescheduleHook();
}

/**
 * The birthday orchestrator is created in main.ts (it needs the Telegram
 * instance). Admin "manual trigger" actions reach it through this registry.
 */
export interface OrchestratorLike {
  runReminders(): Promise<number>;
  runMorningAnnouncements(): Promise<number>;
  runWishPublishing(): Promise<number>;
  runEveningSummary(): Promise<number>;
  publishWishNow(wishId: string): Promise<boolean>;
}

let orchestratorRef: OrchestratorLike | null = null;

export function setOrchestrator(orchestrator: OrchestratorLike): void {
  orchestratorRef = orchestrator;
}

export function getOrchestrator(): OrchestratorLike | null {
  return orchestratorRef;
}

/** Scene identifiers (kept in one place to avoid typos). */
export const SCENES = {
  WISH: 'wish',
  ADD_EMPLOYEE: 'add_employee',
  EDIT_FIELD: 'edit_field',
  SETTINGS_EDIT: 'settings_edit',
  SEARCH: 'search',
} as const;
