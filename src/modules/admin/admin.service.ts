/**
 * Admin authorization. Two sources of truth:
 *   1. ADMIN_TELEGRAM_IDS from the environment (always admins, no DB needed).
 *   2. The `admins` table (additional admins managed at runtime).
 */
import { Admin } from '@prisma/client';
import { config } from '../../config';
import { adminRepository, AdminRepository } from './admin.repository';

export class AdminService {
  private readonly envAdminIds: ReadonlySet<string>;

  constructor(private readonly repo: AdminRepository = adminRepository) {
    this.envAdminIds = new Set(config.adminTelegramIds);
  }

  /** Is this Telegram user allowed to administer the bot? */
  async isAdmin(telegramUserId: number | bigint): Promise<boolean> {
    const asString = telegramUserId.toString();
    if (this.envAdminIds.has(asString)) return true;
    const found = await this.repo.findByTelegramUserId(BigInt(asString));
    return found !== null;
  }

  isEnvAdmin(telegramUserId: number | bigint): boolean {
    return this.envAdminIds.has(telegramUserId.toString());
  }

  list(): Promise<Admin[]> {
    return this.repo.list();
  }

  add(telegramUserId: bigint, fullName: string): Promise<Admin> {
    return this.repo.upsert(telegramUserId, fullName);
  }

  remove(telegramUserId: bigint): Promise<Admin> {
    return this.repo.deleteByTelegramUserId(telegramUserId);
  }

  /** Ensure every env-configured admin also exists in the DB (run at startup). */
  async syncEnvAdmins(): Promise<void> {
    for (const id of this.envAdminIds) {
      await this.repo.upsert(BigInt(id), `Admin ${id}`);
    }
  }
}

export const adminService = new AdminService();
