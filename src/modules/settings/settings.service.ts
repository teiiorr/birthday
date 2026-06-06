/**
 * Settings business logic. The singleton row is lazily created (seeded from the
 * environment) and cached in memory; the cache is refreshed on every update so
 * the scheduler can react to changes.
 */
import { Prisma, Settings } from '@prisma/client';
import { config } from '../../config';
import { settingsRepository, SettingsRepository } from './settings.repository';

export class SettingsService {
  private cache: Settings | null = null;

  constructor(private readonly repo: SettingsRepository = settingsRepository) {}

  /** Get settings, creating the singleton (seeded from env) on first access. */
  async get(): Promise<Settings> {
    if (this.cache) return this.cache;

    let settings = await this.repo.find();
    if (!settings) {
      settings = await this.repo.create({
        timezone: config.timezone,
        ...(config.groupChatId ? { groupChatId: BigInt(config.groupChatId) } : {}),
      });
    }
    this.cache = settings;
    return settings;
  }

  async refresh(): Promise<Settings> {
    this.cache = null;
    return this.get();
  }

  async update(patch: Prisma.SettingsUpdateInput): Promise<Settings> {
    await this.get(); // ensure the row exists
    const updated = await this.repo.update(patch);
    this.cache = updated;
    return updated;
  }

  async getTimezone(): Promise<string> {
    return (await this.get()).timezone;
  }

  /** Resolved group chat id: settings override, falling back to env. */
  async getEffectiveGroupChatId(): Promise<string | null> {
    const settings = await this.get();
    if (settings.groupChatId !== null && settings.groupChatId !== undefined) {
      return settings.groupChatId.toString();
    }
    return config.groupChatId ?? null;
  }

  setGroupChatId(groupChatId: bigint): Promise<Settings> {
    return this.update({ groupChatId });
  }

  async toggleAnonymousWishes(): Promise<Settings> {
    const settings = await this.get();
    return this.update({ anonymousWishesEnabled: !settings.anonymousWishesEnabled });
  }

  async toggleRequireApproval(): Promise<Settings> {
    const settings = await this.get();
    return this.update({ requireWishApproval: !settings.requireWishApproval });
  }
}

export const settingsService = new SettingsService();
