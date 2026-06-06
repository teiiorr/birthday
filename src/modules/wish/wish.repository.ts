/**
 * Birthday-wish data access (repository pattern).
 */
import { BirthdayWish, Prisma, WishStatus } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prisma';

export interface CreateWishInput {
  employeeId: string;
  senderTelegramId: bigint;
  message: string;
  status: WishStatus;
}

export class WishRepository {
  create(input: CreateWishInput): Promise<BirthdayWish> {
    return prisma.birthdayWish.create({ data: input });
  }

  findById(id: string): Promise<BirthdayWish | null> {
    return prisma.birthdayWish.findUnique({ where: { id } });
  }

  delete(id: string): Promise<BirthdayWish> {
    return prisma.birthdayWish.delete({ where: { id } });
  }

  updateStatus(id: string, status: WishStatus): Promise<BirthdayWish> {
    return prisma.birthdayWish.update({ where: { id }, data: { status } });
  }

  markPublished(id: string, seq: number): Promise<BirthdayWish> {
    return prisma.birthdayWish.update({
      where: { id },
      data: { isPublished: true, publishedSeq: seq, publishedAt: new Date() },
    });
  }

  countByEmployeeAndSender(employeeId: string, senderTelegramId: bigint): Promise<number> {
    return prisma.birthdayWish.count({ where: { employeeId, senderTelegramId } });
  }

  listByEmployee(employeeId: string): Promise<BirthdayWish[]> {
    return prisma.birthdayWish.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Next approved-but-unpublished wish, oldest first. */
  findNextUnpublished(employeeId: string): Promise<BirthdayWish | null> {
    return prisma.birthdayWish.findFirst({
      where: { employeeId, status: WishStatus.APPROVED, isPublished: false },
      orderBy: { createdAt: 'asc' },
    });
  }

  listApproved(employeeId: string): Promise<BirthdayWish[]> {
    return prisma.birthdayWish.findMany({
      where: { employeeId, status: WishStatus.APPROVED },
      orderBy: { createdAt: 'asc' },
    });
  }

  listPublished(employeeId: string): Promise<BirthdayWish[]> {
    return prisma.birthdayWish.findMany({
      where: { employeeId, isPublished: true },
      orderBy: { publishedSeq: 'asc' },
    });
  }

  count(where: Prisma.BirthdayWishWhereInput = {}): Promise<number> {
    return prisma.birthdayWish.count({ where });
  }

  async maxPublishedSeq(employeeId: string): Promise<number> {
    const result = await prisma.birthdayWish.aggregate({
      where: { employeeId, isPublished: true },
      _max: { publishedSeq: true },
    });
    return result._max.publishedSeq ?? 0;
  }

  async countDistinctSenders(): Promise<number> {
    const rows = await prisma.birthdayWish.findMany({
      distinct: ['senderTelegramId'],
      select: { senderTelegramId: true },
    });
    return rows.length;
  }

  /** Per-employee wish counts (total + pending), for the moderation menu. */
  async groupByEmployee(): Promise<Array<{ employeeId: string; total: number; pending: number }>> {
    const [totals, pendings] = await Promise.all([
      prisma.birthdayWish.groupBy({ by: ['employeeId'], _count: { _all: true } }),
      prisma.birthdayWish.groupBy({
        by: ['employeeId'],
        where: { status: WishStatus.PENDING },
        _count: { _all: true },
      }),
    ]);
    const pendingMap = new Map(pendings.map((p) => [p.employeeId, p._count._all]));
    return totals.map((row) => ({
      employeeId: row.employeeId,
      total: row._count._all,
      pending: pendingMap.get(row.employeeId) ?? 0,
    }));
  }
}

export const wishRepository = new WishRepository();
