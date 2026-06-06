/**
 * "Add employee" guided flow (admin only). Implemented as an explicit state
 * machine so we can mix text input, an optional photo upload, skippable fields
 * and a final inline confirmation.
 */
import { Markup, Scenes } from 'telegraf';
import { message } from 'telegraf/filters';
import { createLogger } from '../../infrastructure/logger/logger';
import { t } from '../../localization';
import { employeeService } from '../../modules/employee/employee.service';
import { employeeReviewSummary } from '../../templates/employee.template';
import { parseBirthDate } from '../../utils/date.util';
import { fullName } from '../../utils/format.util';
import type { BotContext } from '../context';
import { SCENES } from '../runtime';

const log = createLogger('scene:addEmployee');

const SAVE = 'ae:save';
const CANCEL = 'ae:cancel';

type Step =
  | 'firstName'
  | 'lastName'
  | 'username'
  | 'userId'
  | 'birthDate'
  | 'department'
  | 'position'
  | 'photo'
  | 'review';

interface Draft {
  step: Step;
  firstName?: string;
  lastName?: string;
  username?: string | null;
  userId?: string | null;
  birthDate?: Date;
  birthMonth?: number;
  birthDay?: number;
  department?: string | null;
  position?: string | null;
  photoFileId?: string | null;
}

const SKIP_WORDS = new Set(["yo'q", 'yoq', 'yo‘q', 'skip', '-', 'none', "yo'q."]);

function isSkip(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return normalized === '/skip' || SKIP_WORDS.has(normalized);
}

function draft(ctx: BotContext): Draft {
  return ctx.scene.state as Draft;
}

export const addEmployeeScene = new Scenes.BaseScene<BotContext>(SCENES.ADD_EMPLOYEE);

addEmployeeScene.enter(async (ctx) => {
  const d = draft(ctx);
  d.step = 'firstName';
  await ctx.reply(t.admin.addEmployee.intro, { parse_mode: 'HTML' });
  await ctx.reply(t.admin.addEmployee.askFirstName, { parse_mode: 'HTML' });
});

addEmployeeScene.command('cancel', async (ctx) => {
  await ctx.reply(t.common.cancelled);
  return ctx.scene.leave();
});

async function showReview(ctx: BotContext, d: Draft): Promise<void> {
  d.step = 'review';
  const summary = employeeReviewSummary({
    firstName: d.firstName ?? '',
    lastName: d.lastName ?? '',
    telegramUsername: d.username ?? null,
    telegramUserId: d.userId ?? null,
    birthMonth: d.birthMonth ?? 1,
    birthDay: d.birthDay ?? 1,
    department: d.department ?? null,
    position: d.position ?? null,
    hasPhoto: Boolean(d.photoFileId),
  });
  await ctx.reply(t.admin.addEmployee.review(summary), {
    parse_mode: 'HTML',
    reply_markup: Markup.inlineKeyboard([
      [Markup.button.callback(t.admin.addEmployee.btnSave, SAVE)],
      [Markup.button.callback(t.common.cancel, CANCEL)],
    ]).reply_markup,
  });
}

addEmployeeScene.on(message('text'), async (ctx) => {
  const d = draft(ctx);
  const text = ctx.message.text;

  switch (d.step) {
    case 'firstName':
      d.firstName = text.trim();
      d.step = 'lastName';
      await ctx.reply(t.admin.addEmployee.askLastName, { parse_mode: 'HTML' });
      return;

    case 'lastName':
      d.lastName = text.trim();
      d.step = 'username';
      await ctx.reply(t.admin.addEmployee.askUsername, { parse_mode: 'HTML' });
      return;

    case 'username':
      d.username = isSkip(text) ? null : text.trim().replace(/^@/, '');
      d.step = 'userId';
      await ctx.reply(t.admin.addEmployee.askUserId, { parse_mode: 'HTML' });
      return;

    case 'userId':
      if (isSkip(text)) {
        d.userId = null;
      } else if (/^\d+$/.test(text.trim())) {
        d.userId = text.trim();
      } else {
        await ctx.reply(t.admin.addEmployee.invalidUserId);
        return;
      }
      d.step = 'birthDate';
      await ctx.reply(t.admin.addEmployee.askBirthDate, { parse_mode: 'HTML' });
      return;

    case 'birthDate': {
      const parsed = parseBirthDate(text);
      if (!parsed) {
        await ctx.reply(t.admin.addEmployee.invalidDate);
        return;
      }
      d.birthDate = parsed.date;
      d.birthMonth = parsed.month;
      d.birthDay = parsed.day;
      d.step = 'department';
      await ctx.reply(t.admin.addEmployee.askDepartment, { parse_mode: 'HTML' });
      return;
    }

    case 'department':
      d.department = isSkip(text) ? null : text.trim();
      d.step = 'position';
      await ctx.reply(t.admin.addEmployee.askPosition, { parse_mode: 'HTML' });
      return;

    case 'position':
      d.position = isSkip(text) ? null : text.trim();
      d.step = 'photo';
      await ctx.reply(t.admin.addEmployee.askPhoto, { parse_mode: 'HTML' });
      return;

    case 'photo':
      if (isSkip(text)) {
        d.photoFileId = null;
        await showReview(ctx, d);
      } else {
        await ctx.reply(t.admin.addEmployee.notPhoto);
      }
      return;

    case 'review':
      await showReview(ctx, d);
      return;
  }
});

addEmployeeScene.on(message('photo'), async (ctx) => {
  const d = draft(ctx);
  if (d.step !== 'photo') return;
  const photos = ctx.message.photo;
  d.photoFileId = photos[photos.length - 1]?.file_id ?? null;
  await showReview(ctx, d);
});

addEmployeeScene.action(CANCEL, async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageReplyMarkup(undefined).catch(() => undefined);
  await ctx.reply(t.common.cancelled);
  return ctx.scene.leave();
});

addEmployeeScene.action(SAVE, async (ctx) => {
  const d = draft(ctx);
  await ctx.answerCbQuery();

  if (!d.firstName || !d.lastName || !d.birthDate) {
    await ctx.reply(t.common.error);
    return ctx.scene.leave();
  }

  const employee = await employeeService.create({
    firstName: d.firstName,
    lastName: d.lastName,
    telegramUsername: d.username ?? null,
    telegramUserId: d.userId ? BigInt(d.userId) : null,
    birthDate: d.birthDate,
    department: d.department ?? null,
    position: d.position ?? null,
    photoFileId: d.photoFileId ?? null,
  });

  log.info({ employeeId: employee.id }, 'Employee created');
  await ctx.editMessageReplyMarkup(undefined).catch(() => undefined);
  await ctx.reply(t.admin.addEmployee.saved(fullName(employee)), { parse_mode: 'HTML' });
  return ctx.scene.leave();
});
