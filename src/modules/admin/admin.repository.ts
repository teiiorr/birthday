/** Admin data access (repository pattern). */
import { Admin } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prisma';

export class AdminRepository {
  findByTelegramUserId(telegramUserId: bigint): Promise<Admin | null> {
    return prisma.admin.findUnique({ where: { telegramUserId } });
  }

  list(): Promise<Admin[]> {
    return prisma.admin.findMany({ orderBy: { createdAt: 'asc' } });
  }

  upsert(telegramUserId: bigint, fullName: string): Promise<Admin> {
    return prisma.admin.upsert({
      where: { telegramUserId },
      create: { telegramUserId, fullName },
      update: { fullName },
    });
  }

  deleteByTelegramUserId(telegramUserId: bigint): Promise<Admin> {
    return prisma.admin.delete({ where: { telegramUserId } });
  }
}

export const adminRepository = new AdminRepository();
