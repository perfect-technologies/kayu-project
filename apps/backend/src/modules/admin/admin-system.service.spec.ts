import assert from "node:assert/strict";
import test from "node:test";
import type { Actor } from "../../common/auth/types";
import { AdminSystemService, startOfKinshasaDay } from "./admin-system.service";

const admin = { id: "admin_1", role: "ADMIN", isActive: true } as Actor;

function supabase(listBuckets: () => Promise<unknown>) {
  return { storage: { listBuckets } };
}

const now = new Date("2026-09-17T14:00:00.000Z");
const dayStart = new Date("2026-09-16T23:00:00.000Z");

function counter(wheres: Record<string, unknown[]>, name: string, values: Record<string, number>) {
  return {
    count: async (args?: { where?: unknown }) => {
      (wheres[name] ??= []).push(args?.where);
      return values[JSON.stringify(args?.where ?? null)] ?? -1;
    },
  };
}

function overviewPrisma(wheres: Record<string, unknown[]>, agent: Partial<Record<string, number>> = {}) {
  const sent = '{"role":"ASSISTANT","parts":{"array_contains":[{"type":"tool-send_message","state":"output-available"}]}}';
  const booked = '{"role":"ASSISTANT","parts":{"array_contains":[{"type":"tool-create_booking","state":"output-available"}]}}';
  const searched = '{"role":"ASSISTANT","parts":{"array_contains":[{"type":"tool-search_providers","state":"output-available"}]}}';
  const widened = '{"role":"ASSISTANT","parts":{"array_contains":[{"type":"tool-search_providers","output":{"total":0}}]}}';
  return {
    user: counter(wheres, "user", { null: 30, '{"isActive":false}': 2 }),
    provider: counter(wheres, "provider", { null: 15, '{"verificationStatus":"UNDER_REVIEW"}': 3 }),
    booking: counter(wheres, "booking", { null: 36 }),
    report: counter(wheres, "report", { '{"status":"OPEN"}': 1 }),
    placeSuggestion: counter(wheres, "placeSuggestion", { '{"status":"PENDING"}': 4 }),
    agentConversation: counter(wheres, "agentConversation", { [`{"lastMessageAt":{"gte":"${dayStart.toISOString()}"}}`]: agent.conversationsToday ?? 5 }),
    agentMessage: counter(wheres, "agentMessage", {
      [sent]: agent.messagesSent ?? 7,
      [booked]: agent.bookingsCreated ?? 2,
      [searched]: agent.searched ?? 40,
      [widened]: agent.widened ?? 10,
    }),
  };
}

test("overview counts users, suspensions, providers, bookings, pending queues and the assistant block", async () => {
  const wheres: Record<string, unknown[]> = {};
  const service = new AdminSystemService(overviewPrisma(wheres) as never, {} as never, {} as never, {} as never);

  assert.deepEqual(await service.overview(now), {
    users: { total: 30, suspended: 2 },
    providers: 15,
    bookings: 36,
    openReports: 1,
    pendingSuggestions: 4,
    pendingVerifications: 3,
    assistant: { conversationsToday: 5, messagesSent: 7, bookingsCreated: 2, fallbackRate: 25 },
  });
  assert.deepEqual(wheres.agentConversation, [{ lastMessageAt: { gte: dayStart } }]);
  assert.equal(wheres.agentMessage!.length, 4);
});

test("assistant overview counts on the Kinshasa day and reports no fallback rate without searches", async () => {
  const wheres: Record<string, unknown[]> = {};
  const prisma = overviewPrisma(wheres, { searched: 0, widened: 0, conversationsToday: 0 });
  const service = new AdminSystemService(prisma as never, {} as never, {} as never, {} as never);

  assert.deepEqual(await service.assistantOverview(now), { conversationsToday: 0, messagesSent: 7, bookingsCreated: 2, fallbackRate: null });
  assert.equal(startOfKinshasaDay(new Date("2026-09-17T22:30:00.000Z")).toISOString(), "2026-09-16T23:00:00.000Z");
  assert.equal(startOfKinshasaDay(new Date("2026-09-17T23:30:00.000Z")).toISOString(), "2026-09-17T23:00:00.000Z");
});

test("updating settings writes through the transaction and journals the changed keys", async () => {
  const tx = { systemSetting: {} };
  const calls: Array<{ what: string; args: unknown[] }> = [];
  const prisma = { $transaction: async <T>(callback: (client: typeof tx) => Promise<T>) => callback(tx) };
  const settings = {
    update: async (...args: unknown[]) => {
      calls.push({ what: "update", args });
      return { hero_title: "Bonjour", feat_booking: false };
    },
  };
  const activity = {
    log: async (...args: unknown[]) => {
      calls.push({ what: "log", args });
    },
  };
  const service = new AdminSystemService(prisma as never, settings as never, activity as never, {} as never);

  const result = await service.updateSettings(
    admin,
    { hero_title: "Bonjour", feat_booking: false },
    "10.0.0.6",
  );

  assert.deepEqual(result, { hero_title: "Bonjour", feat_booking: false });
  assert.equal(calls[0]!.args[1], tx);
  const [entry, client] = calls[1]!.args as [Record<string, any>, unknown];
  assert.equal(client, tx);
  assert.equal(entry.action, "settings.update");
  assert.equal(entry.userId, "admin_1");
  assert.equal(entry.ipAddress, "10.0.0.6");
  assert.deepEqual(entry.metadata, { keys: ["hero_title", "feat_booking"] });
});

test("audit returns the latest 200 rows with actor names", async () => {
  let args: Record<string, unknown> = {};
  const createdAt = new Date("2026-09-16T08:00:00.000Z");
  const prisma = {
    activityLog: {
      findMany: async (input: Record<string, unknown>) => {
        args = input;
        return [
          {
            id: "log_2",
            action: "report.resolve",
            entityType: "Report",
            entityId: "report_1",
            metadata: { resolution: "ok" },
            ipAddress: "10.0.0.1",
            createdAt,
            user: { id: "admin_1", firstName: "Grace", lastName: "Admin" },
          },
          {
            id: "log_1",
            action: "account.deleted",
            entityType: "User",
            entityId: "user_9",
            metadata: null,
            ipAddress: null,
            createdAt,
            user: null,
          },
        ];
      },
    },
  };
  const service = new AdminSystemService(prisma as never, {} as never, {} as never, {} as never);

  const result = await service.audit();

  assert.equal(args.take, 200);
  assert.deepEqual(args.orderBy, [{ createdAt: "desc" }, { id: "desc" }]);
  assert.deepEqual(result.items[0]!.actor, { id: "admin_1", name: "Grace Admin" });
  assert.equal(result.items[1]!.actor, null);
});

test("health reports database and storage independently", async () => {
  const healthyDb = { $queryRaw: async () => [{ "?column?": 1 }] };
  const failingDb = {
    $queryRaw: async () => {
      throw new Error("down");
    },
  };

  const storageError = new AdminSystemService(
    healthyDb as never,
    {} as never,
    {} as never,
    supabase(async () => ({ data: null, error: { message: "forbidden" } })) as never,
  );
  const first = await storageError.health();
  assert.equal(first.database, "ok");
  assert.equal(first.storage, "error");
  assert.equal(first.email, "not configured");
  assert.equal(typeof first.version, "string");
  assert.notEqual(first.version, "unknown");

  const prev = process.env.RENDER_GIT_COMMIT;
  process.env.RENDER_GIT_COMMIT = "abcdef1234567";
  try {
    const dbDown = new AdminSystemService(
      failingDb as never,
      {} as never,
      {} as never,
      supabase(async () => {
        throw new Error("network");
      }) as never,
    );
    const second = await dbDown.health();
    assert.equal(second.database, "error");
    assert.equal(second.storage, "error");
    assert.equal(second.commit, "abcdef1");

    const allGood = new AdminSystemService(
      healthyDb as never,
      {} as never,
      {} as never,
      supabase(async () => ({ data: [], error: null })) as never,
    );
    assert.equal((await allGood.health()).storage, "ok");
  } finally {
    if (prev === undefined) delete process.env.RENDER_GIT_COMMIT;
    else process.env.RENDER_GIT_COMMIT = prev;
  }
});
