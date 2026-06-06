/**
 * Settings editor. Entered with state `{ field }` (one of group/reminder/
 * morning/interval/evening/timezone). For the group id the admin may either
 * type the numeric id or forward any message from the corporate group.
 */
import { IANAZone } from 'luxon';
import { Scenes } from 'telegraf';
import { message } from 'telegraf/filters';
import { createLogger } from '../../infrastructure/logger/logger';
import { t } from '../../localization';
import { settingsService } from '../../modules/settings/settings.service';
import { isValidTime } from '../../utils/date.util';
import type { BotContext, SettingsEditState } from '../context';
import { SCENES, triggerReschedule } from '../runtime';

const log = createLogger('scene:settings');

const PROMPTS: Record<string, string> = {
  group: t.admin.settings.askGroup,
  reminder: t.admin.settings.askReminder,
  morning: t.admin.settings.askMorning,
  interval: t.admin.settings.askInterval,
  evening: t.admin.settings.askEvening,
  timezone: t.admin.settings.askTimezone,
};

function state(ctx: BotContext): SettingsEditState {
  return ctx.scene.state as SettingsEditState;
}

/** Extract a forwarded-from chat id, supporting both old and new Bot API shapes. */
function forwardedChatId(msg: unknown): string | null {
  const m = msg as {
    forward_from_chat?: { id: number };
    forward_origin?: { chat?: { id: number } };
  };
  const id = m.forward_from_chat?.id ?? m.forward_origin?.chat?.id;
  return id !== undefined ? id.toString() : null;
}

export const settingsEditScene = new Scenes.BaseScene<BotContext>(SCENES.SETTINGS_EDIT);

settingsEditScene.enter(async (ctx) => {
  const s = state(ctx);
  await ctx.reply(PROMPTS[s.field] ?? t.common.error, { parse_mode: 'HTML' });
});

settingsEditScene.command('cancel', async (ctx) => {
  await ctx.reply(t.common.cancelled);
  return ctx.scene.leave();
});

async function finish(ctx: BotContext, reschedule: boolean): Promise<void> {
  if (reschedule) await triggerReschedule();
  await ctx.reply(t.admin.settings.updated);
  await ctx.scene.leave();
}

settingsEditScene.on(message('text'), async (ctx) => {
  const s = state(ctx);
  const text = ctx.message.text.trim();

  switch (s.field) {
    case 'group': {
      const forwarded = forwardedChatId(ctx.message);
      const value = forwarded ?? text;
      if (!/^-?\d+$/.test(value)) {
        await ctx.reply(t.admin.settings.invalidGroup);
        return;
      }
      await settingsService.setGroupChatId(BigInt(value));
      log.info({ groupChatId: value }, 'Group chat id updated');
      await ctx.reply(t.admin.settings.groupDetected(value), { parse_mode: 'HTML' });
      return ctx.scene.leave();
    }

    case 'reminder':
    case 'morning':
    case 'evening': {
      if (!isValidTime(text)) {
        await ctx.reply(t.admin.settings.invalidTime);
        return;
      }
      const fieldMap = {
        reminder: 'reminderTime',
        morning: 'morningBirthdayTime',
        evening: 'eveningSummaryTime',
      } as const;
      await settingsService.update({ [fieldMap[s.field]]: text });
      log.info({ field: s.field, value: text }, 'Schedule time updated');
      return finish(ctx, true);
    }

    case 'interval': {
      const minutes = Number(text);
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
        await ctx.reply(t.admin.settings.invalidInterval);
        return;
      }
      await settingsService.update({ publishIntervalMinutes: minutes });
      log.info({ minutes }, 'Publish interval updated');
      return finish(ctx, true);
    }

    case 'timezone': {
      if (!IANAZone.isValidZone(text)) {
        await ctx.reply(t.admin.settings.invalidTimezone);
        return;
      }
      await settingsService.update({ timezone: text });
      log.info({ timezone: text }, 'Timezone updated');
      return finish(ctx, true);
    }

    default:
      await ctx.reply(t.common.error);
      return ctx.scene.leave();
  }
});
