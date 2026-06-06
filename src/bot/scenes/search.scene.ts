/** Employee search (admin). Prompts for a query and lists matching records. */
import { Markup, Scenes } from 'telegraf';
import { message } from 'telegraf/filters';
import { t } from '../../localization';
import { employeeService } from '../../modules/employee/employee.service';
import { formatUzbekDate } from '../../utils/date.util';
import { fullName } from '../../utils/format.util';
import { cb } from '../callbacks';
import type { BotContext } from '../context';
import { SCENES } from '../runtime';

export const searchScene = new Scenes.BaseScene<BotContext>(SCENES.SEARCH);

searchScene.enter(async (ctx) => {
  await ctx.reply(t.admin.employees.searchPrompt);
});

searchScene.command('cancel', async (ctx) => {
  await ctx.reply(t.common.cancelled);
  return ctx.scene.leave();
});

searchScene.on(message('text'), async (ctx) => {
  const query = ctx.message.text.trim();
  const results = await employeeService.search(query, 10);

  if (results.length === 0) {
    await ctx.reply(t.admin.employees.searchEmpty);
    return ctx.scene.leave();
  }

  const rows = results.map((e) => [
    Markup.button.callback(
      `${fullName(e)} — ${formatUzbekDate(e.birthMonth, e.birthDay)}`,
      cb.empView(e.id),
    ),
  ]);
  rows.push([Markup.button.callback(t.common.back, cb.panel)]);

  await ctx.reply(t.admin.employees.title(results.length), {
    parse_mode: 'HTML',
    reply_markup: Markup.inlineKeyboard(rows).reply_markup,
  });
  return ctx.scene.leave();
});
