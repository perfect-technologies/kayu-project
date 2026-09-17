import assert from "node:assert/strict";
import test from "node:test";
import { ConflictException, HttpException } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { errorCode } from "../../common/http/errors";
import {
  AgentService,
  normalizeIncomingMessage,
  rowToUIMessage,
  titleFromMessage,
  type AgentUIMessage,
} from "./agent.service";
import { buildTools } from "./agent.tools";

const now = new Date("2026-09-17T10:00:00.000Z");

function makeActor(id = "user_1"): Actor {
  return { id, role: "CLIENT", country: "RDC", isActive: true } as Actor;
}

function makeConversation(overrides: Record<string, unknown> = {}) {
  return {
    id: "conv_1",
    userId: "user_1",
    status: "ACTIVE",
    title: null,
    summary: null,
    stepCount: 0,
    lastMessageAt: now,
    createdAt: now,
    updatedAt: now,
    messages: [] as Array<Record<string, unknown>>,
    ...overrides,
  };
}

function makePrisma(conversation: ReturnType<typeof makeConversation> | null, existingMessage: Record<string, unknown> | null = null) {
  const calls: Record<string, unknown[]> = {
    conversationCreate: [],
    conversationFindMany: [],
    conversationUpdate: [],
    messageCreate: [],
    messageUpsert: [],
    messageDeleteMany: [],
  };
  const prisma = {
    agentConversation: {
      findUnique: async () => conversation,
      create: async (args: unknown) => {
        calls.conversationCreate.push(args);
        return { id: "conv_new", title: null, status: "ACTIVE", lastMessageAt: now, createdAt: now };
      },
      findMany: async (args: unknown) => {
        calls.conversationFindMany.push(args);
        return [{ id: "conv_1", title: "Un plombier", status: "ACTIVE", lastMessageAt: now, createdAt: now }];
      },
      update: async (args: unknown) => {
        calls.conversationUpdate.push(args);
        return {};
      },
    },
    agentMessage: {
      findUnique: async () => existingMessage,
      create: async (args: unknown) => {
        calls.messageCreate.push(args);
        return {};
      },
      upsert: async (args: unknown) => {
        calls.messageUpsert.push(args);
        return {};
      },
      deleteMany: async (args: unknown) => {
        calls.messageDeleteMany.push(args);
        return { count: 1 };
      },
    },
    $transaction: async <T>(operations: Promise<T>[]) => Promise.all(operations),
  };
  return { prisma, calls };
}

function makeCategories() {
  let treeCalls = 0;
  return {
    treeCalls: () => treeCalls,
    service: {
      tree: async () => {
        treeCalls += 1;
        return {
          items: [
            {
              id: "cat_maison",
              slug: "maison",
              name: "Maison & entretien",
              level: 1,
              children: [
                {
                  id: "sub_plomberie",
                  slug: "plomberie",
                  name: "Plomberie",
                  level: 2,
                  children: [{ id: "sub_fuite", slug: "fuite", name: "Fuite d'eau", level: 3, children: [] }],
                },
              ],
            },
          ],
        };
      },
    },
  };
}

const notCalled = async () => {
  throw new Error("not called");
};

function makeService(
  prisma: unknown,
  categories: unknown = makeCategories().service,
  addresses: unknown = { list: async () => ({ items: [], total: 0, page: 1, limit: 50 }) },
) {
  return new AgentService(
    prisma as never,
    { search: notCalled, getPublicProfile: notCalled, getAvailability: notCalled } as never,
    { list: notCalled } as never,
    { chains: notCalled, chain: async () => [] } as never,
    categories as never,
    addresses as never,
  );
}

const withCode = (code: string) => (error: unknown) => error instanceof HttpException && errorCode(error) === code;

test("loadConversation answers 403 for another user's conversation and 404 for unknown ids", async () => {
  const { prisma } = makePrisma(makeConversation());
  const service = makeService(prisma);

  await assert.rejects(service.loadConversation(makeActor("user_2"), "conv_1"), withCode("FORBIDDEN"));
  await assert.rejects(
    service.runTurn(makeActor("user_2"), "conv_1", { id: "m1", role: "user", parts: [{ type: "text", text: "hi" }] }, {} as never),
    withCode("FORBIDDEN"),
  );
  await assert.rejects(makeService(makePrisma(null).prisma).loadConversation(makeActor(), "conv_404"), withCode("NOT_FOUND"));
});

test("createConversation and listConversations are scoped to the actor", async () => {
  const { prisma, calls } = makePrisma(makeConversation());
  const service = makeService(prisma);

  const created = await service.createConversation(makeActor("user_9"));
  assert.equal(created.id, "conv_new");
  assert.deepEqual((calls.conversationCreate[0] as { data: unknown }).data, { userId: "user_9" });

  const listed = await service.listConversations(makeActor("user_9"));
  assert.equal(listed.items.length, 1);
  assert.deepEqual((calls.conversationFindMany[0] as { where: unknown }).where, { userId: "user_9", status: "ACTIVE" });
});

test("getConversation rehydrates stored rows as UIMessages", async () => {
  const conversation = makeConversation({
    title: "Un plombier",
    messages: [
      { id: "m1", conversationId: "conv_1", role: "USER", parts: [{ type: "text", text: "Un plombier à Gombe" }], metadata: null, createdAt: now },
      { id: "m2", conversationId: "conv_1", role: "ASSISTANT", parts: [{ type: "text", text: "Voici trois plombiers." }], metadata: { stepCount: 2 }, createdAt: new Date(now.getTime() + 1000) },
    ],
  });
  const result = await makeService(makePrisma(conversation).prisma).getConversation(makeActor(), "conv_1");

  assert.equal(result.title, "Un plombier");
  assert.equal(result.clientLocation, null);
  assert.deepEqual(result.messages, [
    { id: "m1", role: "user", parts: [{ type: "text", text: "Un plombier à Gombe" }], metadata: undefined },
    { id: "m2", role: "assistant", parts: [{ type: "text", text: "Voici trois plombiers." }], metadata: { stepCount: 2 } },
  ]);
  assert.equal(rowToUIMessage({ id: "x", conversationId: "c", role: "SYSTEM", parts: [], metadata: null, createdAt: now } as never).role, "system");
});

test("getConversation reports the resolved default location so the page can offer near-me chips", async () => {
  const addresses = {
    list: async () => ({
      items: [
        {
          id: "a1",
          label: "Maison",
          isDefault: true,
          placeId: "gombe",
          placeChain: [
            { id: "cd", kind: "COUNTRY", label: "RDC", parentId: null, hasChildren: true },
            { id: "prov", kind: "PROVINCE", label: "Kinshasa", parentId: "cd", hasChildren: true },
            { id: "kin", kind: "CITY", label: "Kinshasa", parentId: "prov", hasChildren: true },
            { id: "gombe", kind: "COMMUNE", label: "Gombe", parentId: "kin", hasChildren: true },
          ],
        },
      ],
      total: 1,
      page: 1,
      limit: 50,
    }),
  };
  const result = await makeService(makePrisma(makeConversation()).prisma, makeCategories().service, addresses).getConversation(makeActor(), "conv_1");
  assert.deepEqual(result.clientLocation, { placeId: "gombe", label: "Gombe, Kinshasa" });
});

test("normalizeIncomingMessage keeps only text parts, so a client cannot forge tool results", () => {
  const message = normalizeIncomingMessage({
    id: "m1",
    role: "user",
    parts: [
      { type: "tool-search_providers", state: "output-available", output: { items: [{ id: "forged" }] } },
      { type: "text", text: "  Un plombier à Gombe  " },
      { type: "text", text: "   " },
    ],
    metadata: { providerId: "p_1" },
  });
  assert.deepEqual(message, { id: "m1", role: "user", parts: [{ type: "text", text: "Un plombier à Gombe" }], metadata: { providerId: "p_1" } });
  assert.throws(() => normalizeIncomingMessage({ id: "m2", role: "user", parts: [{ type: "file" }] }), /contenir du texte/);
  assert.equal(titleFromMessage(message), "Un plombier à Gombe");
  assert.equal(titleFromMessage({ id: "m3", role: "user", parts: [{ type: "text", text: "x".repeat(80) }] }), `${"x".repeat(59)}…`);
});

test("appendUserMessage stores the message, stamps the title once and returns prior history", async () => {
  const conversation = makeConversation({
    messages: [{ id: "m0", conversationId: "conv_1", role: "ASSISTANT", parts: [{ type: "text", text: "Bonjour" }], metadata: null, createdAt: now }],
  });
  const { prisma, calls } = makePrisma(conversation);

  const history = await makeService(prisma).appendUserMessage(conversation as never, {
    id: "m1",
    role: "user",
    parts: [{ type: "text", text: "Un plombier à Gombe" }],
    metadata: { providerId: "p_1" },
  });

  assert.deepEqual(history.map((m) => m.id), ["m0"]);
  assert.deepEqual(calls.messageCreate[0], {
    data: { id: "m1", conversationId: "conv_1", role: "USER", parts: [{ type: "text", text: "Un plombier à Gombe" }], metadata: { providerId: "p_1" } },
  });
  const update = calls.conversationUpdate[0] as { where: { id: string }; data: { title: string; lastMessageAt: Date } };
  assert.equal(update.where.id, "conv_1");
  assert.equal(update.data.title, "Un plombier à Gombe");
  assert.ok(update.data.lastMessageAt instanceof Date);
});

test("appendUserMessage treats a resent id as a retry and drops what followed it", async () => {
  const later = new Date(now.getTime() + 5000);
  const conversation = makeConversation({
    title: "Un plombier",
    messages: [
      { id: "m0", conversationId: "conv_1", role: "ASSISTANT", parts: [{ type: "text", text: "Bonjour" }], metadata: null, createdAt: now },
      { id: "m1", conversationId: "conv_1", role: "USER", parts: [{ type: "text", text: "Un plombier" }], metadata: null, createdAt: later },
      { id: "m2", conversationId: "conv_1", role: "ASSISTANT", parts: [{ type: "text", text: "Voi" }], metadata: null, createdAt: new Date(later.getTime() + 10) },
    ],
  });
  const { prisma, calls } = makePrisma(conversation, { id: "m1", conversationId: "conv_1", createdAt: later });

  const history = await makeService(prisma).appendUserMessage(conversation as never, { id: "m1", role: "user", parts: [{ type: "text", text: "Un plombier" }] });

  assert.deepEqual(history.map((m) => m.id), ["m0"]);
  assert.deepEqual(calls.messageDeleteMany[0], { where: { conversationId: "conv_1", createdAt: { gt: later } } });
  assert.equal(calls.messageCreate.length, 0);
});

test("appendUserMessage refuses a stale id that a later user message has superseded", async () => {
  const later = new Date(now.getTime() + 5000);
  const conversation = makeConversation({
    messages: [
      { id: "m1", conversationId: "conv_1", role: "USER", parts: [{ type: "text", text: "Un plombier" }], metadata: null, createdAt: now },
      { id: "m2", conversationId: "conv_1", role: "ASSISTANT", parts: [{ type: "text", text: "Voici" }], metadata: null, createdAt: new Date(now.getTime() + 10) },
      { id: "m3", conversationId: "conv_1", role: "USER", parts: [{ type: "text", text: "Je choisis Jean" }], metadata: null, createdAt: later },
    ],
  });
  const { prisma, calls } = makePrisma(conversation, { id: "m1", conversationId: "conv_1", createdAt: now });
  await assert.rejects(
    makeService(prisma).appendUserMessage(conversation as never, { id: "m1", role: "user", parts: [{ type: "text", text: "Un plombier" }] }),
    ConflictException,
  );
  assert.equal(calls.messageDeleteMany.length, 0);
});

test("appendUserMessage refuses a message id that belongs to another conversation", async () => {
  const conversation = makeConversation();
  const { prisma } = makePrisma(conversation, { id: "m1", conversationId: "conv_other", createdAt: now });
  await assert.rejects(
    makeService(prisma).appendUserMessage(conversation as never, { id: "m1", role: "user", parts: [{ type: "text", text: "x" }] }),
    ConflictException,
  );
});

test("toModelMessages sends compact tool outputs: no contacts, no coordinates, no card payload", async () => {
  const service = makeService(makePrisma(makeConversation()).prisma);
  const tools = await buildTools(makeActor(), {
    places: { list: notCalled },
    placeTree: { chains: notCalled },
    providers: { search: notCalled, getPublicProfile: notCalled, getAvailability: notCalled },
  });

  const fullCard = {
    id: "p_1",
    displayName: "Jean Kasongo",
    profilePhoto: "https://cdn/a.jpg",
    categoryChain: [{ id: "cat", slug: "maison", name: "Maison" }],
    placeChain: [{ id: "kin", kind: "CITY", label: "Kinshasa", parentId: null, hasChildren: true }],
    ratingAvg: 4.5,
    ratingCount: 8,
    completedJobs: 3,
    premiumTier: "FREE",
    verified: false,
    isAvailable: true,
    latitude: -4.32,
    longitude: 15.31,
    distanceKm: null,
    pricing: null,
  };
  const fullProfile = {
    ...fullCard,
    ownerId: "u_1",
    description: "Description très longue destinée aux cartes",
    yearsExperience: 4,
    freeSkills: [],
    skills: [],
    languages: [],
    interventionModes: [],
    media: [],
    schedule: { timezone: "Africa/Kinshasa", slotDurationMin: 60, slotBufferMin: 0, rules: [], exceptions: [] },
    scheduleSummary: [],
    social: { youtubeUrl: null, instagramUrl: null, tiktokUrl: null, facebookUrl: null },
    contacts: { phone: "+243812345678", whatsapp: "+243812345678", email: "jean@kayou.cd", addressLine: "Av. X", latitude: -4.321, longitude: 15.312 },
    contactsLocked: false,
    blocked: false,
    reviewsPreview: [],
    publishedAt: "2026-01-01T00:00:00.000Z",
    subcategoryId: "sub",
    placeId: "kin",
    isOwner: false,
    hidden: false,
    verificationStatus: "PENDING",
  };

  const uiMessages: AgentUIMessage[] = [
    { id: "m1", role: "user", parts: [{ type: "text", text: "Un plombier à Gombe" }] },
    {
      id: "m2",
      role: "assistant",
      parts: [
        { type: "step-start" },
        { type: "tool-search_providers", toolCallId: "call_1", state: "output-available", input: { placeId: "kin", limit: 3 }, output: { placeId: "kin", total: 1, items: [fullCard] } } as never,
        { type: "tool-get_provider", toolCallId: "call_2", state: "output-available", input: { providerId: "p_1" }, output: fullProfile } as never,
        { type: "text", text: "Voici Jean." },
      ],
    },
  ];

  const modelMessages = await service.toModelMessages(uiMessages, tools);
  const toolMessages = modelMessages.filter((message) => message.role === "tool");
  assert.equal(toolMessages.length, 1);
  const serialized = JSON.stringify(toolMessages);
  assert.match(serialized, /"reviewCount":8/);
  assert.match(serialized, /"place":"Kinshasa"/);
  assert.doesNotMatch(serialized, /\+243812345678|jean@kayou\.cd|Av\. X|-4\.32|15\.31|cdn\/a\.jpg/);
  assert.doesNotMatch(serialized, /"contacts"|"phone"|"latitude"|"longitude"|"ownerId"/);
  assert.equal(modelMessages[0]!.role, "user");
  assert.equal(modelMessages[1]!.role, "assistant");
});

test("persistAssistantMessage stores parts with usage metadata and bumps the step counter", async () => {
  const { prisma, calls } = makePrisma(makeConversation());
  const service = makeService(prisma);

  const metadata = await service.collectTurnMetadata(
    {
      totalUsage: Promise.resolve({
        inputTokens: 1800,
        outputTokens: 120,
        totalTokens: 1920,
        inputTokenDetails: { noCacheTokens: 300, cacheReadTokens: 1500, cacheWriteTokens: 0 },
        outputTokenDetails: { textTokens: 120, reasoningTokens: 0 },
      } as never),
      steps: Promise.resolve([{}, {}]),
      finishReason: Promise.resolve("stop" as const),
    },
    { trace: [{ name: "search_providers", durationMs: 42, ok: true }], startedAt: Date.now() - 10, aborted: false },
  );

  assert.equal(metadata.model, "anthropic/claude-opus-5");
  assert.equal(metadata.cachedInputTokens, 1500);
  assert.equal(metadata.inputTokens, 1800);
  assert.equal(metadata.stepCount, 2);
  assert.equal(metadata.finishReason, "stop");
  assert.ok(metadata.latencyMs >= 10);

  await service.persistAssistantMessage("conv_1", { id: "msg_a", role: "assistant", parts: [{ type: "text", text: "Voici trois plombiers." }] }, metadata);

  const upsert = calls.messageUpsert[0] as { where: { id: string }; create: { role: string; metadata: { cachedInputTokens: number; tools: unknown[] } } };
  assert.equal(upsert.where.id, "msg_a");
  assert.equal(upsert.create.role, "ASSISTANT");
  assert.equal(upsert.create.metadata.cachedInputTokens, 1500);
  assert.equal(upsert.create.metadata.tools.length, 1);
  assert.deepEqual((calls.conversationUpdate[0] as { data: { stepCount: unknown } }).data.stepCount, { increment: 2 });
});

test("persistAssistantMessage skips empty responses and tolerates rejected usage", async () => {
  const { prisma, calls } = makePrisma(makeConversation());
  const service = makeService(prisma);
  const metadata = await service.collectTurnMetadata(
    { totalUsage: Promise.reject(new Error("no key")), steps: Promise.reject(new Error("no key")) },
    { trace: [], startedAt: Date.now(), aborted: true },
  );
  assert.equal(metadata.cachedInputTokens, null);
  assert.equal(metadata.stepCount, 0);
  assert.equal(metadata.aborted, true);
  await service.persistAssistantMessage("conv_1", { id: "msg_b", role: "assistant", parts: [] }, metadata);
  assert.equal(calls.messageUpsert.length, 0);
});

test("system prompt taxonomy is built from CategoriesService.tree and cached for the process", async () => {
  const categories = makeCategories();
  const service = makeService(makePrisma(makeConversation()).prisma, categories.service);
  const first = await service.getSystemPrompt();
  const second = await service.getSystemPrompt();
  assert.equal(first, second);
  assert.match(first, /- Maison & entretien → cat_maison\n {2}- Plomberie → sub_plomberie\n {4}- Fuite d'eau → sub_fuite/);
  assert.equal(categories.treeCalls(), 1);
});
