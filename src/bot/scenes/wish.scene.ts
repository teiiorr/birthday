/**
 * Anonymous wish flow (private chat).
 *
 *   enter -> validate (enabled / employee / membership / duplicate)
 *         -> prompt for text
 *   text  -> validate length -> show preview
 *   send  -> persist -> thank the user -> leave
 *   edit  -> ask again
 *   cancel-> leave
 */
import { Scenes } from 'telegraf';
import { message } from 'telegraf/filters';
import { createLogger } from '../../infrastructure/logger/logger';
import { t } from '../../localization';
import { employeeService } from '../../modules/employee/employee.service';
import { settingsService } from '../../modules/settings/settings.service';
import { wishService } from '../../modules/wish/wish.service';
import { escapeHtml } from '../../utils/format.util';
import { cb } from '../callbacks';
import type { BotContext, WishSceneState } from '../context';
import { isGroupMember } from '../helpers/membership';
import { wishDuplicateKeyboard, wishPreviewKeyboard } from '../keyboards/wish.keyboard';
import { SCENES } from '../runtime';

const log = createLogger('scene:wish');

export const wishScene = new Scenes.BaseScene<BotContext>(SCENES.WISH);

function state(ctx: BotContext): WishSceneState {
  return ctx.scene.state as WishSceneState;
}

async function promptForWish(ctx: BotContext, firstName: string): Promise<void> {
  await ctx.reply(t.wish.prompt(firstName));
}

wishScene.enter(async (ctx) => {
  const s = state(ctx);

  const settings = await settingsService.get();
  if (!settings.anonymousWishesEnabled) {
    await ctx.reply(t.wish.disabled);
    return ctx.scene.leave();
  }

  const employee = await employeeService.getById(s.employeeId);
  if (!employee || employee.isArchived || !employee.isActive) {
    await ctx.reply(t.wish.employeeMissing);
    return ctx.scene.leave();
  }
  s.firstName = employee.firstName;

  // Only corporate group members may submit wishes (when a group is configured).
  const groupId = await settingsService.getEffectiveGroupChatId();
  if (groupId && ctx.from) {
    const member = await isGroupMember(ctx.telegram, groupId, ctx.from.id);
    if (!member) {
      await ctx.reply(t.wish.notMember);
      return ctx.scene.leave();
    }
  }

  // Duplicate detection.
  if (ctx.from) {
    const exists = await wishService.hasExistingWish(employee.id, BigInt(ctx.from.id));
    if (exists) {
      s.awaitingDuplicateChoice = true;
      await ctx.reply(t.wish.duplicate, { reply_markup: wishDuplicateKeyboard().reply_markup });
      return;
    }
  }

  await promptForWish(ctx, employee.firstName);
});

wishScene.action(cb.wishDupYes, async (ctx) => {
  const s = state(ctx);
  s.awaitingDuplicateChoice = false;
  await ctx.answerCbQuery();
  await ctx.editMessageReplyMarkup(undefined).catch(() => undefined);
  await promptForWish(ctx, s.firstName);
});

wishScene.action(cb.wishDupNo, async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageReplyMarkup(undefined).catch(() => undefined);
  await ctx.reply(t.wish.cancelled);
  return ctx.scene.leave();
});

wishScene.on(message('text'), async (ctx) => {
  const s = state(ctx);
  if (s.awaitingDuplicateChoice) {
    // Force a button choice on the duplicate prompt.
    await ctx.reply(t.wish.duplicate, { reply_markup: wishDuplicateKeyboard().reply_markup });
    return;
  }

  const text = ctx.message.text;
  const validation = wishService.validateMessage(text);
  if (!validation.ok) {
    await ctx.reply(validation.reason === 'tooShort' ? t.wish.tooShort : t.wish.tooLong);
    return;
  }

  s.message = text.trim();
  await ctx.reply(t.wish.preview(escapeHtml(s.message)), {
    parse_mode: 'HTML',
    reply_markup: wishPreviewKeyboard().reply_markup,
  });
});

wishScene.action(cb.wishEdit, async (ctx) => {
  const s = state(ctx);
  await ctx.answerCbQuery();
  await ctx.editMessageReplyMarkup(undefined).catch(() => undefined);
  await ctx.reply(t.wish.editPrompt(s.firstName));
});

wishScene.action(cb.wishCancel, async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageReplyMarkup(undefined).catch(() => undefined);
  await ctx.reply(t.wish.cancelled);
  return ctx.scene.leave();
});

wishScene.action(cb.wishSend, async (ctx) => {
  const s = state(ctx);
  await ctx.answerCbQuery();

  if (!s.message || !ctx.from) {
    await ctx.reply(t.wish.cancelled);
    return ctx.scene.leave();
  }

  const settings = await settingsService.get();
  const { pending } = await wishService.submit({
    employeeId: s.employeeId,
    senderTelegramId: BigInt(ctx.from.id),
    message: s.message,
    requireApproval: settings.requireWishApproval,
  });

  log.info({ employeeId: s.employeeId, from: ctx.from.id, pending }, 'Anonymous wish saved');

  await ctx.editMessageReplyMarkup(undefined).catch(() => undefined);
  await ctx.reply(pending ? t.wish.savedPending : t.wish.saved);
  return ctx.scene.leave();
});

// Any other content type while writing a wish.
wishScene.on('message', async (ctx) => {
  const s = state(ctx);
  if (s.awaitingDuplicateChoice) return;
  await ctx.reply(t.wish.notText);
});
