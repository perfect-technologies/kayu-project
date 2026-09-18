import { Inject, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
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
const AGENT_TIMEZONE = "Africa/Kinshasa";
const kinshasaDay = new Intl.DateTimeFormat("en-CA", { timeZone: AGENT_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" });

// Kinshasa has no daylight saving time, so the calendar day starts at a fixed offset.
export function startOfKinshasaDay(now: Date): Date {
  return new Date(`${kinshasaDay.format(now)}T00:00:00+01:00`);
}

// Stored UIMessage parts are the source of truth for what the agent did: a jsonb containment match per action.
const partsWith = (part: Prisma.InputJsonObject): Prisma.JsonFilter => ({ array_contains: [part] });

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

  async overview(now = new Date()) {
    const [users, suspended, providers, bookings, openReports, pendingSuggestions, pendingVerifications, assistant] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: false } }),
        this.prisma.provider.count(),
        this.prisma.booking.count(),
        this.prisma.report.count({ where: { status: "OPEN" } }),
        this.prisma.placeSuggestion.count({ where: { status: "PENDING" } }),
        this.prisma.provider.count({ where: { verificationStatus: "UNDER_REVIEW" } }),
        this.assistantOverview(now),
      ]);

    return {
      users: { total: users, suspended },
      providers,
      bookings,
      openReports,
      pendingSuggestions,
      pendingVerifications,
      assistant,
    };
  }

  // Fallback rate: assistant messages where a search came back empty (the ladder widened) over messages with a search.
  async assistantOverview(now = new Date()) {
    const assistantRole = { role: "ASSISTANT" as const };
    const [conversationsToday, messagesSent, bookingsCreated, searched, widened] = await Promise.all([
      this.prisma.agentConversation.count({ where: { lastMessageAt: { gte: startOfKinshasaDay(now) } } }),
      this.prisma.agentMessage.count({ where: { ...assistantRole, parts: partsWith({ type: "tool-send_message", state: "output-available" }) } }),
      this.prisma.agentMessage.count({ where: { ...assistantRole, parts: partsWith({ type: "tool-create_booking", state: "output-available" }) } }),
      this.prisma.agentMessage.count({ where: { ...assistantRole, parts: partsWith({ type: "tool-search_providers", state: "output-available" }) } }),
      this.prisma.agentMessage.count({ where: { ...assistantRole, parts: partsWith({ type: "tool-search_providers", output: { total: 0 } }) } }),
    ]);
    return {
      conversationsToday,
      messagesSent,
      bookingsCreated,
      fallbackRate: searched === 0 ? null : Math.round((widened / searched) * 100),
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
