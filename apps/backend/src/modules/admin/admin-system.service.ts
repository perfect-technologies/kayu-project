import { Inject, Injectable } from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Actor } from "../../common/auth/types";
import type { AdminUpdateSettingsInput, SiteSettings } from "../../common/contract";
import { fullName } from "../../common/util/people";
import { PrismaService } from "../../database/prisma.service";
import { ActivityLogService } from "../activity/activity-log.service";
import { SiteSettingsService } from "../settings/site-settings.service";
import { SUPABASE_CLIENT } from "../storage/storage.service";

const AUDIT_LIMIT = 200;

let cachedVersion: string | undefined;

function backendVersion(): string {
  if (cachedVersion === undefined) {
    try {
      const manifest = JSON.parse(readFileSync(join(__dirname, "../../../package.json"), "utf8"));
      cachedVersion = typeof manifest.version === "string" ? manifest.version : "unknown";
    } catch {
      cachedVersion = "unknown";
    }
  }
  return cachedVersion ?? "unknown";
}

@Injectable()
export class AdminSystemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SiteSettingsService,
    private readonly activity: ActivityLogService,
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async overview() {
    const [users, suspended, providers, bookings, openReports, pendingSuggestions, pendingVerifications] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: false } }),
        this.prisma.provider.count(),
        this.prisma.booking.count(),
        this.prisma.report.count({ where: { status: "OPEN" } }),
        this.prisma.placeSuggestion.count({ where: { status: "PENDING" } }),
        this.prisma.provider.count({ where: { verificationStatus: "UNDER_REVIEW" } }),
      ]);

    return {
      users: { total: users, suspended },
      providers,
      bookings,
      openReports,
      pendingSuggestions,
      pendingVerifications,
    };
  }

  getSettings(): Promise<SiteSettings> {
    return this.settings.getAll();
  }

  async updateSettings(
    actor: Actor,
    body: AdminUpdateSettingsInput,
    ipAddress?: string | null,
  ): Promise<SiteSettings> {
    return this.prisma.$transaction(async (tx) => {
      const settings = await this.settings.update(body, tx);
      await this.activity.log(
        {
          userId: actor.id,
          action: "settings.update",
          entityType: "SystemSetting",
          entityId: null,
          metadata: { keys: Object.keys(body) },
          ipAddress: ipAddress ?? null,
        },
        tx,
      );
      return settings;
    });
  }

  async audit() {
    const rows = await this.prisma.activityLog.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: AUDIT_LIMIT,
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
    return {
      items: rows.map((row) => ({
        id: row.id,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        metadata: row.metadata,
        ipAddress: row.ipAddress,
        createdAt: row.createdAt,
        actor: row.user ? { id: row.user.id, name: fullName(row.user) } : null,
      })),
    };
  }

  async health() {
    const [database, storage] = await Promise.all([
      this.prisma.$queryRaw`SELECT 1`.then(
        () => "ok" as const,
        () => "error" as const,
      ),
      this.supabase.storage.listBuckets().then(
        ({ error }) => (error ? ("error" as const) : ("ok" as const)),
        () => "error" as const,
      ),
    ]);

    return {
      database,
      storage,
      email: "not configured" as const,
      version: backendVersion(),
      commit: process.env.RENDER_GIT_COMMIT?.slice(0, 7) || null,
    };
  }
}
