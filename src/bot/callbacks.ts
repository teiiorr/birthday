/**
 * Centralised callback-data builders and matchers.
 *
 * Telegram limits callback_data to 64 bytes, so prefixes are kept short.
 * Employee/wish ids are UUIDs (36 chars), comfortably within the limit.
 */

/** Short codes for editable employee fields (keeps callback_data small). */
export const EMPLOYEE_FIELD_CODES = {
  fn: 'firstName',
  ln: 'lastName',
  un: 'username',
  uid: 'userId',
  bd: 'birthDate',
  dep: 'department',
  pos: 'position',
  ph: 'photo',
  st: 'status',
} as const;

export type EmployeeFieldCode = keyof typeof EMPLOYEE_FIELD_CODES;

/** Short codes for editable settings fields. */
export const SETTINGS_FIELD_CODES = {
  grp: 'group',
  rem: 'reminder',
  mor: 'morning',
  itv: 'interval',
  eve: 'evening',
  tz: 'timezone',
} as const;

export type SettingsFieldCode = keyof typeof SETTINGS_FIELD_CODES;

export const cb = {
  noop: 'noop',

  // ── Admin panel ──────────────────────────────────────────────────────────
  panel: 'adm:panel',
  employees: (page = 0): string => `adm:emp:${page}`,
  employeesRe: /^adm:emp:(\d+)$/,
  addEmployee: 'adm:add',
  upcoming: 'adm:up',
  wishes: 'adm:wishes',
  stats: 'adm:stats',
  settings: 'adm:set',
  search: 'adm:search',

  // ── Manual triggers ──────────────────────────────────────────────────────
  triggerReminder: 'adm:t:rem',
  triggerAnnouncement: 'adm:t:ann',
  triggerPublish: 'adm:t:pub',
  triggerEvening: 'adm:t:eve',

  // ── Employee record ──────────────────────────────────────────────────────
  empView: (id: string): string => `emp:v:${id}`,
  empViewRe: /^emp:v:(.+)$/,
  empEditMenu: (id: string): string => `emp:e:${id}`,
  empEditMenuRe: /^emp:e:(.+)$/,
  empEditField: (code: EmployeeFieldCode, id: string): string => `emp:ef:${code}:${id}`,
  empEditFieldRe: /^emp:ef:([a-z]+):(.+)$/,
  empArchive: (id: string): string => `emp:ar:${id}`,
  empArchiveRe: /^emp:ar:(.+)$/,
  empDelete: (id: string): string => `emp:d:${id}`,
  empDeleteRe: /^emp:d:(.+)$/,
  empDeleteConfirm: (id: string): string => `emp:dok:${id}`,
  empDeleteConfirmRe: /^emp:dok:(.+)$/,

  // ── Settings ─────────────────────────────────────────────────────────────
  setField: (code: SettingsFieldCode): string => `set:f:${code}`,
  setFieldRe: /^set:f:([a-z]+)$/,
  setToggleWishes: 'set:tgw',
  setToggleApproval: 'set:tga',

  // ── Wishes moderation ────────────────────────────────────────────────────
  wishEmployee: (id: string): string => `wm:e:${id}`,
  wishEmployeeRe: /^wm:e:(.+)$/,
  wishApprove: (id: string): string => `wm:ap:${id}`,
  wishApproveRe: /^wm:ap:(.+)$/,
  wishReject: (id: string): string => `wm:rj:${id}`,
  wishRejectRe: /^wm:rj:(.+)$/,
  wishPublish: (id: string): string => `wm:pb:${id}`,
  wishPublishRe: /^wm:pb:(.+)$/,
  wishDelete: (id: string): string => `wm:dl:${id}`,
  wishDeleteRe: /^wm:dl:(.+)$/,

  // ── Anonymous wish flow (private chat) ───────────────────────────────────
  wishSend: 'w:send',
  wishEdit: 'w:edit',
  wishCancel: 'w:cancel',
  wishDupYes: 'w:dup:y',
  wishDupNo: 'w:dup:n',
} as const;
