import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  SITE_SETTING_BOOLEAN_KEYS,
  SITE_SETTING_DEFAULTS,
  SITE_SETTING_STRING_KEYS,
  type SiteSettingKey,
  type SiteSettings,
} from "../../common/contract";
import { PrismaService } from "../../database/prisma.service";

type SettingsClient = Pick<Prisma.TransactionClient, "systemSetting">;

const BOOLEAN_KEYS = new Set<string>(SITE_SETTING_BOOLEAN_KEYS);
const KNOWN_KEYS = [...SITE_SETTING_STRING_KEYS, ...SITE_SETTING_BOOLEAN_KEYS] as string[];

@Injectable()
export class SiteSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(client: SettingsClient = this.prisma): Promise<SiteSettings> {
    const rows = await client.systemSetting.findMany({
      where: { key: { in: KNOWN_KEYS } },
      select: { key: true, value: true },
    });
    const settings: Record<string, string | boolean> = { ...SITE_SETTING_DEFAULTS };
    for (const row of rows) {
      const coerced = this.coerce(row.key, row.value);
      if (coerced !== undefined) settings[row.key] = coerced;
    }
    return settings as SiteSettings;
  }

  async getBoolean<K extends SiteSettingKey>(
    key: K & (typeof SITE_SETTING_BOOLEAN_KEYS)[number],
    client: SettingsClient = this.prisma,
  ): Promise<boolean> {
    const row = await client.systemSetting.findUnique({ where: { key }, select: { value: true } });
    const coerced = row ? this.coerce(key, row.value) : undefined;
    return typeof coerced === "boolean" ? coerced : (SITE_SETTING_DEFAULTS[key] as boolean);
  }

  async update(
    changes: Partial<SiteSettings>,
    client: SettingsClient = this.prisma,
  ): Promise<SiteSettings> {
    for (const [key, value] of Object.entries(changes)) {
      if (!KNOWN_KEYS.includes(key) || value === undefined) continue;
      await client.systemSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      });
    }
    return this.getAll(client);
  }

  private coerce(key: string, value: Prisma.JsonValue): string | boolean | undefined {
    if (BOOLEAN_KEYS.has(key)) {
      if (typeof value === "boolean") return value;
      if (value === "true") return true;
      if (value === "false") return false;
      return undefined;
    }
    return typeof value === "string" ? value : undefined;
  }
}
