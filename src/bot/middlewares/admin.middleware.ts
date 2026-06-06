/**
 * Admin authorization middleware.
 *
 *  - `attachAdminFlag` runs for every update and sets `ctx.isAdmin`.
 *  - `requireAdmin` guards admin-only commands and actions.
 */
import { adminService } from '../../modules/admin/admin.service';
import { t } from '../../localization';
import type { BotContext } from '../context';

export async function attachAdminFlag(ctx: BotContext, next: () => Promise<void>): Promise<void> {
  if (ctx.from) {
    ctx.isAdmin = await adminService.isAdmin(ctx.from.id);
  }
  await next();
}

export function requireAdmin() {
  return async (ctx: BotContext, next: () => Promise<void>): Promise<void> => {
    const isAdmin = ctx.isAdmin ?? (ctx.from ? await adminService.isAdmin(ctx.from.id) : false);

    if (!isAdmin) {
      if (ctx.callbackQuery) {
        await ctx.answerCbQuery(t.admin.notAdmin, { show_alert: true }).catch(() => undefined);
      } else {
        await ctx.reply(t.admin.notAdmin).catch(() => undefined);
      }
      return;
    }

    await next();
  };
}
