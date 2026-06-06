/**
 * BirthdayEvent data access. One row per (employee, birthday-date) makes every
 * scheduled action idempotent: a restart never re-posts the same reminder,
 * announcement, poll or summary.
 */
import { BirthdayEvent, Prisma } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prisma';

export class BirthdayEventRepository {
  getOrCreate(employeeId: string, eventDate: Date): Promise<BirthdayEvent> {
    return prisma.birthdayEvent.upsert({
      where: { employeeId_eventDate: { employeeId, eventDate } },
      create: { employeeId, eventDate },
      update: {},
    });
  }

  find(employeeId: string, eventDate: Date): Promise<BirthdayEvent | null> {
    return prisma.birthdayEvent.findUnique({
      where: { employeeId_eventDate: { employeeId, eventDate } },
    });
  }

  update(id: string, data: Prisma.BirthdayEventUpdateInput): Promise<BirthdayEvent> {
    return prisma.birthdayEvent.update({ where: { id }, data });
  }
}

export const birthdayEventRepository = new BirthdayEventRepository();
