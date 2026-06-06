/**
 * Employee data access (repository pattern). All Prisma queries for employees
 * live here; the service layer never touches Prisma directly.
 */
import { Employee, Prisma } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prisma';
import type {
  CreateEmployeeInput,
  ListEmployeesOptions,
  UpdateEmployeeInput,
} from './employee.types';

export class EmployeeRepository {
  create(input: CreateEmployeeInput): Promise<Employee> {
    return prisma.employee.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        telegramUsername: input.telegramUsername ?? null,
        telegramUserId: input.telegramUserId ?? null,
        birthDate: input.birthDate,
        birthMonth: input.birthMonth,
        birthDay: input.birthDay,
        department: input.department ?? null,
        position: input.position ?? null,
        photoFileId: input.photoFileId ?? null,
        isActive: input.isActive ?? true,
      },
    });
  }

  update(id: string, input: UpdateEmployeeInput): Promise<Employee> {
    const data: Prisma.EmployeeUpdateInput = {};
    if (input.firstName !== undefined) data.firstName = input.firstName;
    if (input.lastName !== undefined) data.lastName = input.lastName;
    if (input.telegramUsername !== undefined) data.telegramUsername = input.telegramUsername;
    if (input.telegramUserId !== undefined) data.telegramUserId = input.telegramUserId;
    if (input.birthDate !== undefined) data.birthDate = input.birthDate;
    if (input.birthMonth !== undefined) data.birthMonth = input.birthMonth;
    if (input.birthDay !== undefined) data.birthDay = input.birthDay;
    if (input.department !== undefined) data.department = input.department;
    if (input.position !== undefined) data.position = input.position;
    if (input.photoFileId !== undefined) data.photoFileId = input.photoFileId;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.isArchived !== undefined) data.isArchived = input.isArchived;

    return prisma.employee.update({ where: { id }, data });
  }

  delete(id: string): Promise<Employee> {
    return prisma.employee.delete({ where: { id } });
  }

  findById(id: string): Promise<Employee | null> {
    return prisma.employee.findUnique({ where: { id } });
  }

  findByTelegramUserId(telegramUserId: bigint): Promise<Employee | null> {
    return prisma.employee.findUnique({ where: { telegramUserId } });
  }

  findByIds(ids: string[]): Promise<Employee[]> {
    return prisma.employee.findMany({ where: { id: { in: ids } } });
  }

  list(options: ListEmployeesOptions = {}): Promise<Employee[]> {
    const where: Prisma.EmployeeWhereInput = options.includeArchived ? {} : { isArchived: false };
    return prisma.employee.findMany({
      where,
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      skip: options.skip ?? 0,
      take: options.take ?? undefined,
    });
  }

  count(includeArchived = false): Promise<number> {
    const where: Prisma.EmployeeWhereInput = includeArchived ? {} : { isArchived: false };
    return prisma.employee.count({ where });
  }

  search(query: string, limit = 10): Promise<Employee[]> {
    const term = query.replace(/^@/, '').trim();
    return prisma.employee.findMany({
      where: {
        isArchived: false,
        OR: [
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          { telegramUsername: { contains: term, mode: 'insensitive' } },
        ],
      },
      orderBy: [{ firstName: 'asc' }],
      take: limit,
    });
  }

  /** Active, non-archived employees whose birthday falls on (month, day). */
  findByMonthDay(month: number, day: number): Promise<Employee[]> {
    return prisma.employee.findMany({
      where: { birthMonth: month, birthDay: day, isActive: true, isArchived: false },
      orderBy: [{ firstName: 'asc' }],
    });
  }

  /** Active, non-archived employees with a birthday in the given month. */
  findByMonth(month: number): Promise<Employee[]> {
    return prisma.employee.findMany({
      where: { birthMonth: month, isActive: true, isArchived: false },
      orderBy: [{ birthDay: 'asc' }],
    });
  }

  /** All active, non-archived employees (used for upcoming-birthday math). */
  findAllActive(): Promise<Employee[]> {
    return prisma.employee.findMany({
      where: { isActive: true, isArchived: false },
    });
  }

  countByMonth(month: number): Promise<number> {
    return prisma.employee.count({
      where: { birthMonth: month, isActive: true, isArchived: false },
    });
  }
}

export const employeeRepository = new EmployeeRepository();
