import assert from "node:assert/strict";
import test from "node:test";
import { HttpException } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { AdminModerationService, DELETED_MESSAGE_PREVIEW } from "./admin-moderation.service";

const admin = { id: "admin_1", role: "ADMIN", isActive: true } as Actor;
const createdAt = new Date("2026-09-12T10:00:00.000Z");

function transactional<T extends object>(tx: T, events: string[] = []) {
  return {
    ...tx,
    $transaction: async <R>(callback: (client: T) => Promise<R>) => {
      events.push("tx:start");
      const result = await callback(tx);
      events.push("tx:commit");
      return result;
    },
  };
}

function recorder() {
  const logs: Array<Record<string, any>> = [];
  return { logs, activity: { log: async (entry: Record<string, unknown>) => logs.push(entry) } };
}

test("deleting a review locks the provider, recomputes aggregates and journals", async () => {
  const events: string[] = [];
  const tx = {
    $queryRaw: async () => {
      events.push("lock");
      return [];
    },
    review: {
      findUnique: async () => ({
        id: "review_1",
        providerId: "provider_1",
        bookingId: "booking_1",
        clientId: "client_1",
        rating: 1,
        isPublic: true,
      }),
      delete: async () => events.push("delete"),
      aggregate: async (args: { where: Record<string, unknown> }) => {
        events.push(`aggregate:${JSON.stringify(args.where)}`);
        return { _avg: { rating: 4.333 }, _count: { _all: 3 } };
      },
    },
    booking: { count: async () => 7 },
    provider: {
      update: async (args: { data: Record<string, unknown> }) => {
        events.push(`provider:${JSON.stringify(args.data)}`);
        return {};
      },
    },
  };
  const { logs, activity } = recorder();
  const service = new AdminModerationService(transactional(tx, events) as never, activity as never, {} as never);

  assert.deepEqual(await service.deleteReview(admin, "review_1", "10.0.0.4"), { ok: true });

  assert.deepEqual(events, [
    "tx:start",
    "lock",
    "delete",
    'aggregate:{"providerId":"provider_1","isPublic":true}',
    'provider:{"ratingAvg":4.3,"ratingCount":3,"completedJobs":7}',
    "tx:commit",
  ]);
  assert.equal(logs[0]!.action, "review.delete");
  assert.equal(logs[0]!.ipAddress, "10.0.0.4");
  assert.equal(logs[0]!.metadata.ratingCount, 3);
});

test("hiding a review recomputes aggregates from public reviews only", async () => {
  const updates: unknown[] = [];
  const tx = {
    $queryRaw: async () => [],
    review: {
      findUnique: async () => ({ id: "review_1", providerId: "provider_1", isPublic: true }),
      update: async (args: unknown) => {
        updates.push(args);
        return {
          id: "review_1",
          rating: 1,
          comment: "Nul",
          reply: null,
          isPublic: false,
          createdAt,
          bookingId: "booking_1",
          client: { id: "client_1", firstName: "Awa", lastName: "M" },
          provider: { id: "provider_1", displayName: "Plomberie Paul" },
        };
      },
      aggregate: async () => ({ _avg: { rating: 5 }, _count: { _all: 1 } }),
    },
    booking: { count: async () => 2 },
    provider: { update: async (args: unknown) => updates.push(args) },
  };
  const { logs, activity } = recorder();
  const service = new AdminModerationService(transactional(tx) as never, activity as never, {} as never);

  const result = await service.updateReview(admin, "review_1", { isPublic: false });

  assert.equal(result.isPublic, false);
  assert.equal(result.client.name, "Awa M");
  assert.deepEqual(updates[1], {
    where: { id: "provider_1" },
    data: { ratingAvg: 5, ratingCount: 1, completedJobs: 2 },
  });
  assert.deepEqual(logs[0]!.metadata.isPublic, { from: true, to: false });
});

test("deleting a conversation removes attachment objects only after the commit", async () => {
  const events: string[] = [];
  const tx = {
    conversation: {
      findUnique: async () => ({ id: "conv_1", clientId: "client_1", providerId: "provider_1", subject: null }),
      delete: async () => events.push("delete"),
    },
    message: {
      findMany: async () => [
        { attachments: [{ kind: "image", path: "attachments/client_1/a.jpg", mime: "image/jpeg", bytes: 10 }] },
        { attachments: [] },
        { attachments: [{ kind: "audio", path: "media/client_1/not-an-attachment.webm" }, { bogus: true }] },
      ],
    },
  };
  const removed: unknown[] = [];
  const storage = {
    parsePath: (path: string) => {
      const [purpose, ownerId] = path.split("/");
      return { purpose, ownerId };
    },
    removeObjects: async (objects: unknown, actorId: string) => {
      events.push("storage:remove");
      removed.push({ objects, actorId });
    },
  };
  const { logs, activity } = recorder();
  const service = new AdminModerationService(
    transactional(tx, events) as never,
    activity as never,
    storage as never,
  );

  await service.deleteConversation(admin, "conv_1", "10.0.0.5");

  assert.deepEqual(events, ["tx:start", "delete", "tx:commit", "storage:remove"]);
  assert.deepEqual(removed, [
    { objects: [{ purpose: "attachments", path: "attachments/client_1/a.jpg" }], actorId: "admin_1" },
  ]);
  assert.equal(logs[0]!.metadata.messageCount, 3);
});

test("soft deleting the latest message updates the conversation preview", async () => {
  const run = async (latestId: string) => {
    const conversationUpdates: unknown[] = [];
    const messageUpdates: Array<{ data: { deletedAt: Date } }> = [];
    const tx = {
      message: {
        findUnique: async () => ({ id: "msg_2", conversationId: "conv_1", senderId: "client_1", deletedAt: null }),
        update: async (args: { data: { deletedAt: Date } }) => messageUpdates.push(args),
        findFirst: async () => ({ id: latestId }),
      },
      conversation: { update: async (args: unknown) => conversationUpdates.push(args) },
    };
    const { logs, activity } = recorder();
    const service = new AdminModerationService(transactional(tx) as never, activity as never, {} as never);
    await service.deleteMessage(admin, "msg_2");
    return { conversationUpdates, messageUpdates, logs };
  };

  const latest = await run("msg_2");
  assert.ok(latest.messageUpdates[0]!.data.deletedAt instanceof Date);
  assert.deepEqual(latest.conversationUpdates, [
    { where: { id: "conv_1" }, data: { lastPreview: DELETED_MESSAGE_PREVIEW } },
  ]);
  assert.equal(latest.logs[0]!.action, "message.delete");

  const older = await run("msg_9");
  assert.equal(older.conversationUpdates.length, 0);
});

test("resolving a report twice is a 409", async () => {
  const report = {
    id: "report_1",
    reporterId: "client_1",
    targetKind: "PROVIDER",
    targetId: "provider_1",
    reason: "Arnaque",
    status: "OPEN",
    resolution: null,
    resolvedById: null,
    resolvedAt: null,
    createdAt,
  };
  const tx = {
    report: {
      findUnique: async () => ({ ...report }),
      update: async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(report, data);
        return { ...report, reporter: { id: "client_1", firstName: "Awa", lastName: "M" } };
      },
    },
  };
  const prisma = {
    ...transactional(tx),
    provider: { findMany: async () => [{ id: "provider_1", displayName: "Plomberie Paul" }] },
  };
  const { logs, activity } = recorder();
  const service = new AdminModerationService(prisma as never, activity as never, {} as never);

  const resolved = await service.resolveReport(admin, "report_1", {
    status: "RESOLVED",
    resolution: "Profil masqué",
  });
  assert.equal(resolved.status, "RESOLVED");
  assert.equal(resolved.resolvedById, "admin_1");
  assert.deepEqual(resolved.target, {
    kind: "PROVIDER",
    id: "provider_1",
    label: "Plomberie Paul",
    exists: true,
  });
  assert.equal(logs[0]!.action, "report.resolve");

  await assert.rejects(
    () => service.resolveReport(admin, "report_1", { status: "RESOLVED", resolution: "Encore" }),
    (error: unknown) => {
      assert.ok(error instanceof HttpException);
      assert.equal(error.getStatus(), 409);
      assert.equal((error.getResponse() as { code: string }).code, "INVALID_TRANSITION");
      return true;
    },
  );
});

test("report targets resolve a label per kind and flag deleted targets", async () => {
  const reports = [
    ["r1", "USER", "user_1"],
    ["r2", "REVIEW", "review_1"],
    ["r3", "MESSAGE", "msg_1"],
    ["r4", "CONVERSATION", "conv_1"],
    ["r5", "PROVIDER", "gone"],
  ].map(([id, targetKind, targetId]) => ({
    id,
    reporterId: "client_1",
    targetKind,
    targetId,
    reason: "Motif",
    status: "OPEN",
    resolution: null,
    resolvedById: null,
    resolvedAt: null,
    createdAt,
    reporter: null,
  }));
  const prisma = {
    report: { count: async () => reports.length, findMany: async () => reports },
    user: { findMany: async () => [{ id: "user_1", firstName: "Jean", lastName: "Mukendi" }] },
    provider: { findMany: async () => [] },
    review: { findMany: async () => [{ id: "review_1", rating: 2, comment: "Travail bâclé" }] },
    message: { findMany: async () => [{ id: "msg_1", body: null }] },
    conversation: { findMany: async () => [{ id: "conv_1", subject: " " }] },
  };
  const service = new AdminModerationService(prisma as never, {} as never, {} as never);

  const page = await service.listReports({ page: 1, limit: 50 });

  assert.deepEqual(
    page.items.map((item) => [item.target.label, item.target.exists]),
    [
      ["Jean Mukendi", true],
      ["Avis 2/5 · Travail bâclé", true],
      ["Pièce jointe", true],
      ["Conversation", true],
      ["Élément supprimé", false],
    ],
  );
  assert.equal(page.items[0]!.reporter, null);
});
