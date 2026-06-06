/**
 * Single-field employee editor. Entered from the employee edit menu with
 * state `{ employeeId, field }`, prompts for one new value and persists it.
 */
import { Scenes } from 'telegraf';
import { message } from 'telegraf/filters';
import { createLogger } from '../../infrastructure/logger/logger';
import { t } from '../../localization';
import { employeeService } from '../../modules/employee/employee.service';
import type { UpdateEmployeeData } from '../../modules/employee/employee.service';
import { parseBirthDate } from '../../utils/date.util';
import type { BotContext, EditFieldState } from '../context';
import { SCENES } from '../runtime';

const log = createLogger('scene:editField');

const SKIP_WORDS = new Set(["yo'q", 'yoq', 'yo‘q', 'skip', '-', 'none']);
function isSkip(text: string): boolean {
  return SKIP_WORDS.has(text.trim().toLowerCase());
}

function fieldLabel(field: string): string {
  const labels = t.admin.editEmployee.fields as Record<string, string>;
  return labels[field] ?? field;
}

function state(ctx: BotContext): EditFieldState {
  return ctx.scene.state as EditFieldState;
}

export const editFieldScene = new Scenes.BaseScene<BotContext>(SCENES.EDIT_FIELD);

editFieldScene.enter(async (ctx) => {
  const s = state(ctx);
  if (s.field === 'photo') {
    await ctx.reply(t.admin.editEmployee.askPhoto);
  } else {
    await ctx.reply(t.admin.editEmployee.askValue(fieldLabel(s.field)), { parse_mode: 'HTML' });
  }
});

editFieldScene.command('cancel', async (ctx) => {
  await ctx.reply(t.common.cancelled);
  return ctx.scene.leave();
});

async function applyAndLeave(ctx: BotContext, patch: UpdateEmployeeData): Promise<void> {
  const s = state(ctx);
  await employeeService.update(s.employeeId, patch);
  log.info({ employeeId: s.employeeId, field: s.field }, 'Employee field updated');
  await ctx.reply(t.admin.editEmployee.updated);
  await ctx.scene.leave();
}

editFieldScene.on(message('text'), async (ctx) => {
  const s = state(ctx);
  const text = ctx.message.text.trim();

  switch (s.field) {
    case 'firstName':
      if (!text) return void ctx.reply(t.admin.addEmployee.invalidName);
      return applyAndLeave(ctx, { firstName: text });

    case 'lastName':
      if (!text) return void ctx.reply(t.admin.addEmployee.invalidName);
      return applyAndLeave(ctx, { lastName: text });

    case 'username':
      return applyAndLeave(ctx, { telegramUsername: isSkip(text) ? null : text.replace(/^@/, '') });

    case 'userId':
      if (isSkip(text)) return applyAndLeave(ctx, { telegramUserId: null });
      if (!/^\d+$/.test(text)) return void ctx.reply(t.admin.addEmployee.invalidUserId);
      return applyAndLeave(ctx, { telegramUserId: BigInt(text) });

    case 'birthDate': {
      const parsed = parseBirthDate(text);
      if (!parsed) return void ctx.reply(t.admin.addEmployee.invalidDate);
      return applyAndLeave(ctx, { birthDate: parsed.date });
    }

    case 'department':
      return applyAndLeave(ctx, { department: isSkip(text) ? null : text });

    case 'position':
      return applyAndLeave(ctx, { position: isSkip(text) ? null : text });

    case 'photo':
      if (isSkip(text)) return applyAndLeave(ctx, { photoFileId: null });
      return void ctx.reply(t.admin.addEmployee.notPhoto);

    default:
      await ctx.reply(t.common.error);
      return ctx.scene.leave();
  }
});

editFieldScene.on(message('photo'), async (ctx) => {
  const s = state(ctx);
  if (s.field !== 'photo') return;
  const photos = ctx.message.photo;
  const fileId = photos[photos.length - 1]?.file_id ?? null;
  return applyAndLeave(ctx, { photoFileId: fileId });
});
