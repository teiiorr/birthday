/**
 * Birthday-wish business logic: validation, duplicate handling, moderation and
 * the sequencing used by the gradual reveal.
 */
import { BirthdayWish, WishStatus } from '@prisma/client';
import { WISH_MAX_LENGTH, WISH_MIN_LENGTH } from '../../config/constants';
import { wishRepository, WishRepository } from './wish.repository';

export type WishValidation = { ok: true } | { ok: false; reason: 'tooShort' | 'tooLong' };

export interface SubmitWishParams {
  employeeId: string;
  senderTelegramId: bigint;
  message: string;
  requireApproval: boolean;
}

export interface WishStats {
  wishesTotal: number;
  wishesPublished: number;
  distinctSenders: number;
}

export class WishService {
  constructor(private readonly repo: WishRepository = wishRepository) {}

  validateMessage(message: string): WishValidation {
    const length = message.trim().length;
    if (length < WISH_MIN_LENGTH) return { ok: false, reason: 'tooShort' };
    if (length > WISH_MAX_LENGTH) return { ok: false, reason: 'tooLong' };
    return { ok: true };
  }

  async hasExistingWish(employeeId: string, senderTelegramId: bigint): Promise<boolean> {
    return (await this.repo.countByEmployeeAndSender(employeeId, senderTelegramId)) > 0;
  }

  async submit(params: SubmitWishParams): Promise<{ wish: BirthdayWish; pending: boolean }> {
    const status = params.requireApproval ? WishStatus.PENDING : WishStatus.APPROVED;
    const wish = await this.repo.create({
      employeeId: params.employeeId,
      senderTelegramId: params.senderTelegramId,
      message: params.message.trim(),
      status,
    });
    return { wish, pending: status === WishStatus.PENDING };
  }

  getById(id: string): Promise<BirthdayWish | null> {
    return this.repo.findById(id);
  }

  approve(id: string): Promise<BirthdayWish> {
    return this.repo.updateStatus(id, WishStatus.APPROVED);
  }

  reject(id: string): Promise<BirthdayWish> {
    return this.repo.updateStatus(id, WishStatus.REJECTED);
  }

  remove(id: string): Promise<BirthdayWish> {
    return this.repo.delete(id);
  }

  findNextUnpublished(employeeId: string): Promise<BirthdayWish | null> {
    return this.repo.findNextUnpublished(employeeId);
  }

  listByEmployee(employeeId: string): Promise<BirthdayWish[]> {
    return this.repo.listByEmployee(employeeId);
  }

  listApproved(employeeId: string): Promise<BirthdayWish[]> {
    return this.repo.listApproved(employeeId);
  }

  listPublished(employeeId: string): Promise<BirthdayWish[]> {
    return this.repo.listPublished(employeeId);
  }

  countApproved(employeeId: string): Promise<number> {
    return this.repo.count({ employeeId, status: WishStatus.APPROVED });
  }

  countByEmployee(employeeId: string): Promise<number> {
    return this.repo.count({ employeeId });
  }

  countPendingByEmployee(employeeId: string): Promise<number> {
    return this.repo.count({ employeeId, status: WishStatus.PENDING });
  }

  /** Assign the next reveal sequence number and mark the wish as published. */
  async markPublished(wish: BirthdayWish): Promise<{ wish: BirthdayWish; seq: number }> {
    const seq = (await this.repo.maxPublishedSeq(wish.employeeId)) + 1;
    const updated = await this.repo.markPublished(wish.id, seq);
    return { wish: updated, seq };
  }

  /** Admin "publish manually": ensure approved, then publish with next seq. */
  async publishManually(wishId: string): Promise<{ wish: BirthdayWish; seq: number } | null> {
    const wish = await this.repo.findById(wishId);
    if (!wish) return null;
    if (wish.isPublished) return null;
    if (wish.status !== WishStatus.APPROVED) {
      await this.repo.updateStatus(wishId, WishStatus.APPROVED);
    }
    return this.markPublished({ ...wish, status: WishStatus.APPROVED });
  }

  employeesWithWishes(): Promise<Array<{ employeeId: string; total: number; pending: number }>> {
    return this.repo.groupByEmployee();
  }

  async stats(): Promise<WishStats> {
    const [wishesTotal, wishesPublished, distinctSenders] = await Promise.all([
      this.repo.count(),
      this.repo.count({ isPublished: true }),
      this.repo.countDistinctSenders(),
    ]);
    return { wishesTotal, wishesPublished, distinctSenders };
  }
}

export const wishService = new WishService();
