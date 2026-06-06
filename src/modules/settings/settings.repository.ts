/** Settings data access — a single singleton row (id = 1). */
import { Prisma, Settings } from '@prisma/client';
import { SETTINGS_SINGLETON_ID } from '../../config/constants';
import { prisma } from '../../infrastructure/database/prisma';

export class SettingsRepository {
  find(): Promise<Settings | null> {
    return prisma.settings.findUnique({ where: { id: SETTINGS_SINGLETON_ID } });
  }

  create(data: Prisma.SettingsCreateInput): Promise<Settings> {
    return prisma.settings.create({ data: { ...data, id: SETTINGS_SINGLETON_ID } });
  }

  update(data: Prisma.SettingsUpdateInput): Promise<Settings> {
    return prisma.settings.update({ where: { id: SETTINGS_SINGLETON_ID }, data });
  }
}

export const settingsRepository = new SettingsRepository();
