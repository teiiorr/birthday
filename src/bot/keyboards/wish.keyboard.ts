/** Inline keyboards for the anonymous-wish flow. */
import { Markup } from 'telegraf';
import type { InlineKeyboardMarkup } from 'telegraf/types';
import { START_PAYLOAD_WISH_PREFIX } from '../../config/constants';
import { t } from '../../localization';
import { cb } from '../callbacks';
import { deepLink } from '../runtime';

/**
 * Group reminder button. It is a deep link so tapping it opens a PRIVATE chat
 * with the bot (carrying the employee id), which is the only reliable way to
 * start a private conversation from a group message.
 */
export function reminderKeyboard(employeeId: string): Markup.Markup<InlineKeyboardMarkup> {
  return Markup.inlineKeyboard([
    [
      Markup.button.url(
        t.group.reminderButton,
        deepLink(`${START_PAYLOAD_WISH_PREFIX}${employeeId}`),
      ),
    ],
  ]);
}

export function wishPreviewKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
  return Markup.inlineKeyboard([
    [Markup.button.callback(t.wish.btnSend, cb.wishSend)],
    [
      Markup.button.callback(t.wish.btnEdit, cb.wishEdit),
      Markup.button.callback(t.wish.btnCancel, cb.wishCancel),
    ],
  ]);
}

export function wishDuplicateKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(t.common.yes, cb.wishDupYes),
      Markup.button.callback(t.common.no, cb.wishDupNo),
    ],
  ]);
}
