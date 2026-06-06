/** Telegram group-membership validation. */
import type { Telegram } from 'telegraf';
import { createLogger } from '../../infrastructure/logger/logger';

const log = createLogger('membership');

const MEMBER_STATUSES = new Set(['creator', 'administrator', 'member', 'restricted']);

/**
 * Whether `userId` is currently a member of `groupChatId`. Errors (e.g. the bot
 * is not in the group, or the user was never seen) resolve to `false`.
 */
export async function isGroupMember(
  telegram: Telegram,
  groupChatId: string | number,
  userId: number,
): Promise<boolean> {
  try {
    const member = await telegram.getChatMember(groupChatId, userId);
    if (member.status === 'restricted') {
      return member.is_member === true;
    }
    return MEMBER_STATUSES.has(member.status);
  } catch (error) {
    log.warn({ err: error, userId }, 'getChatMember failed — treating as non-member');
    return false;
  }
}
