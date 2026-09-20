import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { HttpException } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { errorCode } from "../../common/http/errors";
import { AgentService, previewFromParts } from "./agent.service";
import { AGENT_LIFECYCLE_DEFAULTS, AGENT_LIFECYCLE_KEYS, loadAgentLifecycle } from "./agent.settings";

const now = new Date("2026-09-19T08:00:00.000Z");
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const ago = (ms: number) => new Date(now.getTime() - ms);

type MessageRow = { id: string; conversationId: string; role: "USER" | "ASSISTANT"; parts: unknown; metadata: null; compactedAt: null; createdAt: Date };
type ConversationRow = {
  id: string;
  userId: string;
  status: "ACTIVE" | "ARCHIVED";
  title: string | null;
  summary: null;
  stepCount: number;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

function makeActor(id = "user_1"): Actor {
  return { id, role: "CLIENT", country: "RDC", isActive: true, firstName: "Paul", phone: "+243819000001" } as Actor;
}

function conversation(id: string, overrides: Partial<ConversationRow> = {}): ConversationRow {
  const lastMessageAt = overrides.lastMessageAt ?? now;
  return {
    id,
    userId: "user_1",
    status: "ACTIVE",
    title: `Titre ${id}`,
    summary: null,
    stepCount: 0,
    lastMessageAt,
    createdAt: lastMessageAt,
    updatedAt: lastMessageAt,
    ...overrides,
  };
}

function message(id: string, conversationId: string, role: MessageRow["role"], text: string, createdAt = now): MessageRow {
  return { id, conversationId, role, parts: [{ type: "text", text }], metadata: null, compactedAt: null, createdAt };
}

type Where = {
  userId?: string;
  status?: string;
  messages?: { some?: object; none?: object };
  lastMessageAt?: { lt: Date };
  updatedAt?: { lt: Date };
};

// An in-memory store that applies the where clauses, so the sweep and the filters are exercised for real.
function makeStore(conversations: ConversationRow[], messages: MessageRow[], settings: Array<{ key: string; value: unknown }> = []) {
  const state = { conversations: [...conversations], messages: [...messages], writes: [] as string[] };
  const messagesOf = (id: string) => state.messages.filter((row) => row.conversationId === id);
  const matches = (row: ConversationRow, where: Where) =>
    (where.userId === undefined || row.userId === where.userId) &&
    (where.status === undefined || row.status === where.status) &&
    (where.messages?.some === undefined || messagesOf(row.id).length > 0) &&
    (where.messages?.none === undefined || messagesOf(row.id).length === 0) &&
    (where.lastMessageAt === undefined || row.lastMessageAt < where.lastMessageAt.lt) &&
    (where.updatedAt === undefined || row.updatedAt < where.updatedAt.lt);
  const untouchable = (name: string) =>
    new Proxy({}, { get: () => () => { throw new Error(`${name} must not be touched`); } });

  const prisma = {
    systemSetting: { findMany: async ({ where }: { where: { key: { in: string[] } } }) => settings.filter((row) => where.key.in.includes(row.key)) },
    booking: untouchable("booking"),
    conversation: untouchable("conversation"),
    message: untouchable("message"),
    agentMessage: untouchable("agentMessage"),
    agentConversation: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const row = state.conversations.find((item) => item.id === where.id);
        return row ? { ...row, messages: messagesOf(row.id).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()) } : null;
      },
      findFirst: async ({ where }: { where: Where }) =>
        state.conversations.filter((row) => matches(row, where)).sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())[0] ?? null,
      findMany: async ({ where, skip = 0, take }: { where: Where; skip?: number; take: number }) =>
        state.conversations
          .filter((row) => matches(row, where))
          .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())
          .slice(skip, skip + take)
          .map((row) => {
            const rows = messagesOf(row.id).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            return {
              id: row.id,
              title: row.title,
              status: row.status,
              lastMessageAt: row.lastMessageAt,
              createdAt: row.createdAt,
              messages: rows.slice(0, 1).map((item) => ({ parts: item.parts })),
              _count: { messages: rows.length },
            };
          }),
      count: async ({ where }: { where: Where }) => state.conversations.filter((row) => matches(row, where)).length,
      create: async ({ data }: { data: { userId: string } }) => {
        const row = conversation(`conv_new_${state.conversations.length}`, { userId: data.userId, title: null });
        state.conversations.push(row);
        state.writes.push(`create:${row.id}`);
        return row;
      },
      update: async ({ where, data }: { where: { id: string }; data: Partial<ConversationRow> }) => {
        const row = state.conversations.find((item) => item.id === where.id)!;
        Object.assign(row, data, { updatedAt: now });
        state.writes.push(`update:${row.id}:${Object.keys(data).join(",")}`);
        return row;
      },
      updateMany: async ({ where, data }: { where: Where; data: Partial<ConversationRow> }) => {
        const rows = state.conversations.filter((row) => matches(row, where));
        rows.forEach((row) => Object.assign(row, data, { updatedAt: now }));
        return { count: rows.length };
      },
      delete: async ({ where }: { where: { id: string } }) => {
        state.conversations = state.conversations.filter((row) => row.id !== where.id);
        state.messages = state.messages.filter((row) => row.conversationId !== where.id);
        state.writes.push(`delete:${where.id}`);
        return {};
      },
    },
  };
  return { prisma, state };
}

const notCalled = async () => {
  throw new Error("not called");
};

function makeService(prisma: unknown) {
  const untouched = { list: notCalled, create: notCalled, start: notCalled, get: notCalled };
  return new AgentService(
    prisma as never,
    { search: notCalled } as never,
    { list: notCalled } as never,
    { chains: notCalled, chain: async () => [] } as never,
    { tree: notCalled } as never,
    untouched as never,
    untouched as never,
    untouched as never,
    { mine: notCalled } as never,
    { getBoolean: async () => true } as never,
  );
}

const withCode = (code: string) => (error: unknown) => error instanceof HttpException && errorCode(error) === code;
const byId = (state: { conversations: ConversationRow[] }, id: string) => state.conversations.find((row) => row.id === id)!;

test("the list filters by status, defaults to active, stays scoped to the actor and orders by lastMessageAt descending", async () => {
  const { prisma } = makeStore(
    [
      conversation("old", { lastMessageAt: ago(3 * DAY) }),
      conversation("recent", { lastMessageAt: ago(HOUR) }),
      conversation("shelved", { status: "ARCHIVED", lastMessageAt: ago(2 * DAY) }),
      conversation("foreign", { userId: "user_2" }),
      conversation("blank", { lastMessageAt: ago(60_000) }),
    ],
    [
      message("m1", "old", "USER", "Un électricien à Limete"),
      message("m2", "recent", "USER", "Un plombier"),
      message("m3", "shelved", "USER", "Ménage"),
      message("m4", "foreign", "USER", "Pas à moi"),
    ],
  );
  const service = makeService(prisma);

  const active = await service.listConversations(makeActor(), undefined, now);
  assert.deepEqual(active.items.map((item) => item.id), ["recent", "old"]);
  assert.deepEqual({ total: active.total, page: active.page, limit: active.limit, resumeWindowHours: active.resumeWindowHours }, { total: 2, page: 1, limit: 20, resumeWindowHours: 12 });

  const archived = await service.listConversations(makeActor(), { status: "archived", page: 1, limit: 20 }, now);
  assert.deepEqual(archived.items.map((item) => item.id), ["shelved"]);

  const all = await service.listConversations(makeActor(), { status: "all", page: 1, limit: 20 }, now);
  assert.deepEqual(all.items.map((item) => item.id), ["recent", "shelved", "old"]);
});

test("the list paginates with the usual envelope", async () => {
  const rows = Array.from({ length: 5 }, (_, index) => conversation(`c${index}`, { lastMessageAt: ago(index * HOUR) }));
  const { prisma } = makeStore(rows, rows.map((row, index) => message(`m${index}`, row.id, "USER", "Bonjour")));
  const service = makeService(prisma);

  const second = await service.listConversations(makeActor(), { status: "active", page: 2, limit: 2 }, now);
  assert.deepEqual(second.items.map((item) => item.id), ["c2", "c3"]);
  assert.deepEqual({ total: second.total, page: second.page, limit: second.limit }, { total: 5, page: 2, limit: 2 });

  const last = await service.listConversations(makeActor(), { status: "active", page: 3, limit: 2 }, now);
  assert.deepEqual(last.items.map((item) => item.id), ["c4"]);
});

test("the preview is the last stored message's text, without the address marker, trimmed to 120 characters", async () => {
  const long = "a".repeat(200);
  const { prisma } = makeStore(
    [conversation("c1"), conversation("c2", { lastMessageAt: ago(HOUR) })],
    [
      message("m1", "c1", "USER", "Un plombier", ago(2000)),
      message("m2", "c1", "ASSISTANT", "  Voici trois prestataires à Gombe.\n[[adresse]] ", ago(1000)),
      message("m3", "c2", "USER", long),
    ],
  );
  const { items } = await makeService(prisma).listConversations(makeActor(), undefined, now);

  assert.equal(items[0]!.preview, "Voici trois prestataires à Gombe.");
  assert.equal(items[1]!.preview!.length, 120);
  assert.equal(items[1]!.preview, `${"a".repeat(119)}…`);

  assert.equal(previewFromParts([{ type: "tool-search_providers", state: "output-available" }]), null);
  assert.equal(previewFromParts("a".repeat(120).split("").map((text) => ({ type: "text", text })))!.length, 120);
  assert.equal(previewFromParts(null), null);
});

test("the list flags a conversation that reached the message cap as full", async () => {
  const { prisma } = makeStore(
    [conversation("long"), conversation("short", { lastMessageAt: ago(HOUR) })],
    [message("s1", "short", "USER", "Bonjour"), ...Array.from({ length: 3 }, (_, index) => message(`l${index}`, "long", "USER", "Encore"))],
    [{ key: "agent.maxMessagesPerConversation", value: 3 }],
  );
  const { items } = await makeService(prisma).listConversations(makeActor(), undefined, now);
  assert.deepEqual(items.map((item) => [item.id, item.full]), [["long", true], ["short", false]]);
});

test("unarchive reactivates without moving lastMessageAt", async () => {
  const lastMessageAt = ago(5 * DAY);
  const { prisma, state } = makeStore([conversation("c1", { status: "ARCHIVED", lastMessageAt })], [message("m1", "c1", "USER", "Bonjour")]);
  const service = makeService(prisma);

  await service.unarchiveConversation(makeActor(), "c1");
  assert.equal(byId(state, "c1").status, "ACTIVE");
  assert.equal(byId(state, "c1").lastMessageAt.getTime(), lastMessageAt.getTime());
  assert.deepEqual(state.writes, ["update:c1:status"]);
});

test("delete removes the conversation with its messages and touches no booking or provider conversation", async () => {
  const { prisma, state } = makeStore(
    [conversation("c1"), conversation("c2")],
    [message("m1", "c1", "USER", "Réserve ce créneau"), message("m2", "c1", "ASSISTANT", "Demande envoyée"), message("m3", "c2", "USER", "Autre")],
  );
  const service = makeService(prisma);

  assert.deepEqual(await service.deleteConversation(makeActor(), "c1"), { ok: true });
  assert.deepEqual(state.conversations.map((row) => row.id), ["c2"]);
  assert.deepEqual(state.messages.map((row) => row.id), ["m3"]);
  assert.deepEqual(state.writes, ["delete:c1"]);

  await service.deleteConversation(makeActor(), "c2");
  assert.equal(state.conversations.length, 0);
});

test("the schema cascades agent messages only: bookings and provider conversations hold no reference to an agent conversation", () => {
  const schema = readFileSync(join(__dirname, "../../../prisma/schema.prisma"), "utf8");
  const model = (name: string) => schema.slice(schema.indexOf(`model ${name} {`), schema.indexOf("\n}", schema.indexOf(`model ${name} {`)));

  assert.match(model("AgentMessage"), /conversation\s+AgentConversation\s+@relation\(fields: \[conversationId\], references: \[id\], onDelete: Cascade\)/);
  for (const name of ["Booking", "Conversation", "Message"]) assert.doesNotMatch(model(name), /AgentConversation|AgentMessage/);
});

test("rename trims through the DTO, stores the title, and null restores the generated one", async () => {
  const { AssistantRenameConversationDto } = await import("@kayu/schemas");
  assert.deepEqual(AssistantRenameConversationDto.parse({ title: "  Plombier Gombe  " }), { title: "Plombier Gombe" });
  assert.deepEqual(AssistantRenameConversationDto.parse({ title: null }), { title: null });
  assert.equal(AssistantRenameConversationDto.safeParse({ title: "   " }).success, false);
  assert.equal(AssistantRenameConversationDto.safeParse({ title: "a".repeat(81) }).success, false);
  assert.equal(AssistantRenameConversationDto.safeParse({ title: "a".repeat(80) }).success, true);
  assert.equal(AssistantRenameConversationDto.safeParse({}).success, false);
  assert.equal(AssistantRenameConversationDto.safeParse({ title: "ok", status: "ARCHIVED" }).success, false);

  const { prisma, state } = makeStore(
    [conversation("c1", { title: "Un plombier pour une fuite" })],
    [message("m0", "c1", "ASSISTANT", "Bonjour", ago(3000)), message("m1", "c1", "USER", "Un plombier pour une fuite", ago(2000)), message("m2", "c1", "USER", "Demain matin", ago(1000))],
  );
  const service = makeService(prisma);

  await service.renameConversation(makeActor(), "c1", "Fuite cuisine");
  assert.equal(byId(state, "c1").title, "Fuite cuisine");
  await service.renameConversation(makeActor(), "c1", null);
  assert.equal(byId(state, "c1").title, "Un plombier pour une fuite");
});

test("the list query accepts the three statuses, caps the limit at 50 and defaults to active, page 1, 20", async () => {
  const { AssistantConversationsQueryParams } = await import("@kayu/schemas");
  assert.deepEqual(AssistantConversationsQueryParams.parse({}), { status: "active", page: 1, limit: 20 });
  assert.deepEqual(AssistantConversationsQueryParams.parse({ status: "archived", page: "2", limit: "50" }), { status: "archived", page: 2, limit: 50 });
  assert.equal(AssistantConversationsQueryParams.safeParse({ limit: "51" }).success, false);
  assert.equal(AssistantConversationsQueryParams.safeParse({ status: "deleted" }).success, false);
});

test("archive, unarchive, rename and delete answer 403 for another client's conversation and 404 for an unknown id", async () => {
  const { prisma, state } = makeStore([conversation("c1")], [message("m1", "c1", "USER", "Bonjour")]);
  const service = makeService(prisma);
  const routes: Array<(actor: Actor, id: string) => Promise<unknown>> = [
    (actor, id) => service.archiveConversation(actor, id),
    (actor, id) => service.unarchiveConversation(actor, id),
    (actor, id) => service.renameConversation(actor, id, "Volé"),
    (actor, id) => service.deleteConversation(actor, id),
  ];

  for (const route of routes) {
    await assert.rejects(route(makeActor("user_2"), "c1"), withCode("FORBIDDEN"));
    await assert.rejects(route(makeActor(), "conv_404"), withCode("NOT_FOUND"));
  }
  assert.deepEqual(state.writes, []);
  assert.equal(byId(state, "c1").title, "Titre c1");
});

test("the sweep archives only the actor's stale active conversations and is idempotent", async () => {
  const { prisma, state } = makeStore(
    [
      conversation("stale", { lastMessageAt: ago(31 * DAY) }),
      conversation("edge", { lastMessageAt: ago(30 * DAY - 1000) }),
      conversation("fresh", { lastMessageAt: ago(DAY) }),
      conversation("foreign", { userId: "user_2", lastMessageAt: ago(90 * DAY) }),
    ],
    [message("m1", "stale", "USER", "Vieux"), message("m2", "edge", "USER", "Limite"), message("m3", "fresh", "USER", "Hier")],
  );
  const service = makeService(prisma);

  const first = await service.listConversations(makeActor(), undefined, now);
  assert.deepEqual(first.items.map((item) => item.id), ["fresh", "edge"]);
  assert.equal(byId(state, "stale").status, "ARCHIVED");
  assert.equal(byId(state, "foreign").status, "ACTIVE");

  assert.equal(await service.sweepStale(makeActor(), 30, now), 0);
  const archived = await service.listConversations(makeActor(), { status: "archived", page: 1, limit: 20 }, now);
  assert.deepEqual(archived.items.map((item) => item.id), ["stale"]);
});

test("autoArchiveDays 0 disables the sweep, and a shorter window applies on the next read", async () => {
  const rows = () => [conversation("ancient", { lastMessageAt: ago(400 * DAY) }), conversation("twoDays", { lastMessageAt: ago(2 * DAY) })];
  const messages = [message("m1", "ancient", "USER", "Ancien"), message("m2", "twoDays", "USER", "Avant-hier")];

  const off = makeStore(rows(), messages, [{ key: "agent.autoArchiveDays", value: 0 }]);
  const listed = await makeService(off.prisma).listConversations(makeActor(), undefined, now);
  assert.deepEqual(listed.items.map((item) => item.id), ["twoDays", "ancient"]);

  const oneDay = makeStore(rows(), messages, [{ key: "agent.autoArchiveDays", value: 1 }]);
  assert.deepEqual((await makeService(oneDay.prisma).listConversations(makeActor(), undefined, now)).items, []);
});

test("a conversation reactivated inside the window survives the next sweep even though its last message is old", async () => {
  const { prisma, state } = makeStore(
    [conversation("revived", { status: "ARCHIVED", lastMessageAt: ago(45 * DAY) }), conversation("forgotten", { lastMessageAt: ago(45 * DAY) })],
    [message("m1", "revived", "USER", "Ancien"), message("m2", "forgotten", "USER", "Oublié")],
  );
  const service = makeService(prisma);

  await service.unarchiveConversation(makeActor(), "revived");
  const { items } = await service.listConversations(makeActor(), undefined, now);
  assert.deepEqual(items.map((item) => item.id), ["revived"]);
  assert.equal(byId(state, "forgotten").status, "ARCHIVED");

  const later = new Date(now.getTime() + 31 * DAY);
  await service.listConversations(makeActor(), undefined, later);
  assert.equal(byId(state, "revived").status, "ARCHIVED");
});

test("createConversation hands back the client's empty conversation instead of piling up blank rows", async () => {
  const { prisma, state } = makeStore([conversation("used")], [message("m1", "used", "USER", "Bonjour")]);
  const service = makeService(prisma);

  const first = await service.createConversation(makeActor());
  const second = await service.createConversation(makeActor());
  assert.equal(second.id, first.id);
  assert.equal(state.conversations.filter((row) => row.userId === "user_1").length, 2);

  const other = await service.createConversation(makeActor("user_2"));
  assert.notEqual(other.id, first.id);
});

test("lifecycle settings: defaults, stored values, 0 kept, invalid values ignored", async () => {
  const client = (rows: Array<{ key: string; value: unknown }>) => ({ systemSetting: { findMany: async () => rows } });
  assert.deepEqual(await loadAgentLifecycle(client([]) as never), AGENT_LIFECYCLE_DEFAULTS);
  assert.deepEqual(AGENT_LIFECYCLE_DEFAULTS, { autoArchiveDays: 30, resumeWindowHours: 12 });
  assert.deepEqual(
    await loadAgentLifecycle(client([{ key: AGENT_LIFECYCLE_KEYS.autoArchiveDays, value: 0 }, { key: AGENT_LIFECYCLE_KEYS.resumeWindowHours, value: "6" }]) as never),
    { autoArchiveDays: 0, resumeWindowHours: 6 },
  );
  assert.deepEqual(
    await loadAgentLifecycle(client([{ key: AGENT_LIFECYCLE_KEYS.autoArchiveDays, value: -1 }, { key: AGENT_LIFECYCLE_KEYS.resumeWindowHours, value: "" }]) as never),
    AGENT_LIFECYCLE_DEFAULTS,
  );
});
