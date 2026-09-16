import assert from "node:assert/strict";
import test from "node:test";
import { HttpException } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { RateLimiterService } from "../../common/rate-limit/rate-limiter.service";
import { BlocksService } from "./blocks.service";
import { ReportsService } from "./reports.service";
import { SafetyService } from "./safety.service";

const actor = { id: "user_1", role: "CLIENT", isActive: true } as Actor;
const status = (code: number, apiCode?: string) => (error: unknown) =>
  error instanceof HttpException &&
  error.getStatus() === code &&
  (!apiCode || (error.getResponse() as { code?: string }).code === apiCode);

function reportsWorld(limiter: Pick<RateLimiterService, "consume"> = { consume: () => undefined }) {
  const created: Array<Record<string, unknown>> = [];
  const queries: Record<string, unknown> = {};
  const prisma = {
    user: { findUnique: async ({ where }: { where: { id: string } }) => (where.id === "user_2" ? { id: "user_2" } : null) },
    provider: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        where.id === "provider_own" ? { userId: "user_1" } : where.id === "provider_2" ? { userId: "user_2" } : null,
    },
    review: { findUnique: async ({ where }: { where: { id: string } }) => (where.id === "review_1" ? { id: "review_1" } : null) },
    message: {
      findFirst: async (args: { where: { id: string } }) => {
        queries.message = args;
        return args.where.id === "message_mine" ? { id: "message_mine" } : null;
      },
    },
    conversation: {
      findFirst: async (args: { where: { id: string } }) => {
        queries.conversation = args;
        return args.where.id === "conv_mine" ? { id: "conv_mine" } : null;
      },
    },
    report: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        created.push(data);
        return { id: `report_${created.length}`, status: "OPEN", createdAt: new Date(), ...data };
      },
    },
  };
  return { service: new ReportsService(prisma as never, limiter as never), created, queries };
}

test("isBlocked is symmetric and blockedUserIds lists both directions", async () => {
  const rows = [
    { blockerId: "a", blockedId: "b" },
    { blockerId: "c", blockedId: "a" },
  ];
  const prisma = {
    block: {
      findFirst: async ({ where }: { where: { OR: Array<{ blockerId: string; blockedId: string }> } }) =>
        rows.find((row) => where.OR.some((clause) => clause.blockerId === row.blockerId && clause.blockedId === row.blockedId)) ?? null,
      findMany: async () => rows,
    },
  };
  const safety = new SafetyService(prisma as never);
  assert.equal(await safety.isBlocked("b", "a"), true);
  assert.equal(await safety.isBlocked("a", "d"), false);
  assert.equal(await safety.isBlocked("a", "a"), false);
  assert.deepEqual((await safety.blockedUserIds("a")).sort(), ["b", "c"]);
});

test("reports validate their target, refuse self and restrict messages to participants", async () => {
  const w = reportsWorld();
  const created = await w.service.create(actor, { targetKind: "USER", targetId: "user_2", reason: "Spam" });
  assert.equal(created.status, "OPEN");
  assert.deepEqual(w.created[0], { reporterId: "user_1", targetKind: "USER", targetId: "user_2", reason: "Spam" });

  await assert.rejects(() => w.service.create(actor, { targetKind: "USER", targetId: "user_1", reason: "Moi" }), status(400, "SELF_ACTION"));
  await assert.rejects(() => w.service.create(actor, { targetKind: "PROVIDER", targetId: "provider_own", reason: "Moi" }), status(400, "SELF_ACTION"));
  await assert.rejects(() => w.service.create(actor, { targetKind: "USER", targetId: "ghost", reason: "???" }), status(404));
  await assert.rejects(() => w.service.create(actor, { targetKind: "REVIEW", targetId: "ghost", reason: "???" }), status(404));
  await w.service.create(actor, { targetKind: "PROVIDER", targetId: "provider_2", reason: "Arnaque" });
  await w.service.create(actor, { targetKind: "REVIEW", targetId: "review_1", reason: "Faux avis" });

  await w.service.create(actor, { targetKind: "MESSAGE", targetId: "message_mine", reason: "Insulte" });
  assert.deepEqual((w.queries.message as { where: unknown }).where, {
    id: "message_mine",
    conversation: { OR: [{ clientId: "user_1" }, { provider: { userId: "user_1" } }] },
  });
  await assert.rejects(() => w.service.create(actor, { targetKind: "MESSAGE", targetId: "message_other", reason: "x!!" }), status(404));
  await w.service.create(actor, { targetKind: "CONVERSATION", targetId: "conv_mine", reason: "Harcèlement" });
  await assert.rejects(() => w.service.create(actor, { targetKind: "CONVERSATION", targetId: "conv_other", reason: "x!!" }), status(404));
});

test("reports are rate limited to 10 per user per hour", async () => {
  const w = reportsWorld(new RateLimiterService());
  for (let index = 0; index < 10; index += 1) {
    await w.service.create(actor, { targetKind: "USER", targetId: "user_2", reason: "Spam" });
  }
  await assert.rejects(() => w.service.create(actor, { targetKind: "USER", targetId: "user_2", reason: "Spam" }), status(429, "RATE_LIMITED"));
});

test("blocks are idempotent, refuse self and unknown users, and unblock is a no-op when absent", async () => {
  const rows = new Map<string, { blockerId: string; blockedId: string; createdAt: Date }>();
  const prisma = {
    user: { findUnique: async ({ where }: { where: { id: string } }) => (where.id === "user_2" ? { id: "user_2" } : null) },
    block: {
      upsert: async ({ where }: { where: { blockerId_blockedId: { blockerId: string; blockedId: string } } }) => {
        const key = `${where.blockerId_blockedId.blockerId}:${where.blockerId_blockedId.blockedId}`;
        if (!rows.has(key)) rows.set(key, { ...where.blockerId_blockedId, createdAt: new Date("2026-09-16T10:00:00Z") });
        return rows.get(key)!;
      },
      deleteMany: async ({ where }: { where: { blockerId: string; blockedId: string } }) => {
        const existed = rows.delete(`${where.blockerId}:${where.blockedId}`);
        return { count: existed ? 1 : 0 };
      },
      count: async () => rows.size,
      findMany: async () =>
        [...rows.values()].map((row) => ({ ...row, blocked: { id: row.blockedId, firstName: "Marie", lastName: "Tshala", avatar: null } })),
    },
  };
  const blocks = new BlocksService(prisma as never);

  const first = await blocks.block(actor, "user_2");
  const second = await blocks.block(actor, "user_2");
  assert.deepEqual(first, second);
  assert.equal(rows.size, 1);
  await assert.rejects(() => blocks.block(actor, "user_1"), status(400, "SELF_ACTION"));
  await assert.rejects(() => blocks.block(actor, "ghost"), status(404));

  const page = await blocks.list(actor, { page: 1, limit: 50 });
  assert.deepEqual(page.items, [{ user: { id: "user_2", name: "Marie Tshala", avatar: null }, createdAt: first.createdAt }]);

  assert.deepEqual(await blocks.unblock(actor, "user_2"), { ok: true });
  assert.deepEqual(await blocks.unblock(actor, "user_2"), { ok: true });
  assert.equal(rows.size, 0);
});
