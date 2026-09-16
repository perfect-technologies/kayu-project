import assert from "node:assert/strict";
import test from "node:test";
import { HttpException } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { StorageService } from "../storage/storage.service";
import { MessagingService } from "./messaging.service";

const base = new Date("2026-09-16T10:00:00.000Z");

type Conv = {
  id: string;
  clientId: string;
  providerId: string;
  subject: string | null;
  lastMessageAt: Date;
  lastPreview: string | null;
  clientUnread: number;
  providerUnread: number;
  createdAt: Date;
};
type Msg = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string | null;
  attachments: unknown;
  createdAt: Date;
  deletedAt: Date | null;
};

function world(options: { blocked?: boolean; providerActive?: boolean; clientActive?: boolean; hidden?: boolean } = {}) {
  const users: Record<string, { id: string; firstName: string; lastName: string; avatar: string | null; isActive: boolean }> = {
    client_1: { id: "client_1", firstName: "Paul", lastName: "Kabasele", avatar: null, isActive: options.clientActive ?? true },
    pro_user: { id: "pro_user", firstName: "Jean", lastName: "Mukendi", avatar: null, isActive: options.providerActive ?? true },
  };
  const provider = {
    id: "provider_1",
    userId: "pro_user",
    displayName: "Jean Plomberie",
    profilePhoto: "https://cdn/p.jpg",
    hidden: options.hidden ?? false,
  };
  const conversations: Conv[] = [];
  const messages: Msg[] = [];
  const notifications: Array<Record<string, unknown>> = [];
  const locks: string[] = [];
  let clock = 0;

  const withIncludes = (conv: Conv) => ({
    ...conv,
    client: users[conv.clientId],
    provider: { ...provider, user: { isActive: users[provider.userId]!.isActive } },
  });
  const applyCounter = (value: number, patch: unknown) =>
    typeof patch === "number" ? patch : patch && typeof patch === "object" ? value + (patch as { increment: number }).increment : value;

  const client = {
    $queryRaw: async (query: { values: unknown[] }) => {
      locks.push(String(query.values[0]));
      return [];
    },
    provider: {
      findUnique: async ({ where }: { where: { id?: string; userId?: string } }) => {
        if (where.id === provider.id || where.userId === provider.userId) {
          return { ...provider, user: { isActive: users[provider.userId]!.isActive } };
        }
        return null;
      },
    },
    conversation: {
      upsert: async ({ where, create }: { where: { clientId_providerId: { clientId: string; providerId: string } }; create: Partial<Conv> }) => {
        let conv = conversations.find(
          (item) => item.clientId === where.clientId_providerId.clientId && item.providerId === where.clientId_providerId.providerId,
        );
        if (!conv) {
          conv = {
            id: `conv_${conversations.length + 1}`,
            clientId: create.clientId!,
            providerId: create.providerId!,
            subject: create.subject ?? null,
            lastMessageAt: base,
            lastPreview: null,
            clientUnread: 0,
            providerUnread: 0,
            createdAt: base,
          };
          conversations.push(conv);
        }
        return withIncludes(conv);
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        const conv = conversations.find((item) => item.id === where.id);
        return conv ? withIncludes(conv) : null;
      },
      findUniqueOrThrow: async ({ where }: { where: { id: string } }) => withIncludes(conversations.find((item) => item.id === where.id)!),
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const conv = conversations.find((item) => item.id === where.id)!;
        if ("clientUnread" in data) conv.clientUnread = applyCounter(conv.clientUnread, data.clientUnread);
        if ("providerUnread" in data) conv.providerUnread = applyCounter(conv.providerUnread, data.providerUnread);
        if (data.lastPreview !== undefined) conv.lastPreview = data.lastPreview as string;
        if (data.lastMessageAt) conv.lastMessageAt = data.lastMessageAt as Date;
        return conv;
      },
      count: async () => conversations.length,
      findMany: async () => conversations.map(withIncludes),
      aggregate: async ({ where, _sum }: { where: { clientId?: string; providerId?: string }; _sum: Record<string, boolean> }) => {
        const rows = conversations.filter((conv) =>
          where.clientId ? conv.clientId === where.clientId : conv.providerId === where.providerId,
        );
        const field = Object.keys(_sum)[0] as "clientUnread" | "providerUnread";
        return { _sum: { [field]: rows.reduce((sum, row) => sum + row[field], 0) } };
      },
    },
    message: {
      create: async ({ data }: { data: Omit<Msg, "id" | "createdAt" | "deletedAt"> }) => {
        clock += 1;
        const message = { id: `msg_${clock}`, createdAt: new Date(base.getTime() + clock * 1000), deletedAt: null, ...data };
        messages.push(message);
        return message;
      },
      count: async ({ where }: { where: { conversationId: string } }) =>
        messages.filter((message) => message.conversationId === where.conversationId).length,
      findMany: async ({ where, skip, take }: { where: { conversationId: string }; skip: number; take: number }) =>
        messages
          .filter((message) => message.conversationId === where.conversationId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(skip, skip + take),
      findFirst: async ({ where, include }: { where: { id?: string; conversationId: string }; include?: unknown }) => {
        const rows = messages
          .filter((message) => message.conversationId === where.conversationId && (!where.id || message.id === where.id))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const row = rows[0];
        if (!row) return null;
        if (!include) return row;
        const conv = conversations.find((item) => item.id === row.conversationId)!;
        return { ...row, conversation: { clientId: conv.clientId, provider: { userId: provider.userId } } };
      },
      update: async ({ where, data }: { where: { id: string }; data: Partial<Msg> }) => {
        const message = messages.find((item) => item.id === where.id)!;
        Object.assign(message, data);
        return message;
      },
    },
    notification: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        notifications.push(data);
        return { ...data, id: "n", isRead: false, readAt: null, createdAt: base };
      },
    },
  };
  const prisma = { ...client, $transaction: async (cb: (tx: typeof client) => Promise<unknown>) => cb(client) };
  const safety = {
    isBlocked: async () => Boolean(options.blocked),
    blockedUserIds: async () => (options.blocked ? ["pro_user"] : []),
  };
  const storage = new StorageService({} as never);
  const notificationsService = {
    create: async (params: Record<string, unknown>, tx: typeof client) => tx.notification.create({ data: params }),
  };
  const service = new MessagingService(prisma as never, notificationsService as never, safety as never, storage);
  return { service, conversations, messages, notifications, locks };
}

const clientActor = { id: "client_1", role: "CLIENT", firstName: "Paul", lastName: "Kabasele", isActive: true } as Actor;
const providerActor = { id: "pro_user", role: "PROVIDER", isActive: true } as Actor;
const stranger = { id: "stranger", role: "CLIENT", isActive: true } as Actor;
const status = (code: number, apiCode?: string) => (error: unknown) =>
  error instanceof HttpException &&
  error.getStatus() === code &&
  (!apiCode || (error.getResponse() as { code?: string }).code === apiCode);

const noAttachments = { attachments: [] };

test("start upserts one conversation per client/provider pair and sends the first message", async () => {
  const w = world();
  const first = await w.service.start(clientActor, { providerId: "provider_1", subject: "Fuite", body: "Bonjour", ...noAttachments });
  const second = await w.service.start(clientActor, { providerId: "provider_1", body: "Toujours là ?", ...noAttachments });

  assert.equal(w.conversations.length, 1);
  assert.equal(first.conversation.id, second.conversation.id);
  assert.equal(first.conversation.subject, "Fuite");
  assert.equal(second.conversation.side, "client");
  assert.equal(second.conversation.counterpart.providerId, "provider_1");
  assert.equal(second.message.mine, true);
  assert.equal(w.conversations[0]!.providerUnread, 2);
  assert.deepEqual(w.locks, ["conv_1", "conv_1"]);
  assert.equal(w.notifications[0]!.userId, "pro_user");
  assert.equal(w.notifications[0]!.type, "NEW_MESSAGE");
  assert.deepEqual(w.notifications[0]!.data, { conversationId: "conv_1", messageId: "msg_1" });
});

test("start refuses hidden providers, self, blocks and suspended recipients", async () => {
  await assert.rejects(() => world({ hidden: true }).service.start(clientActor, { providerId: "provider_1", body: "x", ...noAttachments }), status(404));
  await assert.rejects(
    () => world().service.start({ ...providerActor, role: "CLIENT" } as Actor, { providerId: "provider_1", body: "x", ...noAttachments }),
    status(400, "SELF_ACTION"),
  );
  await assert.rejects(() => world({ blocked: true }).service.start(clientActor, { providerId: "provider_1", body: "x", ...noAttachments }), status(403, "BLOCKED"));
  await assert.rejects(
    () => world({ providerActive: false }).service.start(clientActor, { providerId: "provider_1", body: "x", ...noAttachments }),
    status(403, "RECIPIENT_UNAVAILABLE"),
  );
});

test("attachments must live under the sender's attachments namespace", async () => {
  const w = world();
  const foreign = [{ kind: "image" as const, path: "attachments/pro_user/abc.jpg", mime: "image/jpeg", bytes: 10 }];
  await assert.rejects(() => w.service.start(clientActor, { providerId: "provider_1", attachments: foreign }), status(403));

  const own = [{ kind: "audio" as const, path: "attachments/client_1/abc-voice.webm", mime: "audio/webm", bytes: 10 }];
  const { message, conversation } = await w.service.start(clientActor, { providerId: "provider_1", attachments: own });
  assert.deepEqual(message.attachments, own);
  assert.equal(message.body, null);
  assert.equal(w.conversations[0]!.lastPreview, "Pièce jointe");
  assert.equal(conversation.lastPreview, "Pièce jointe");
});

test("replies swap unread counters, trim the preview and notify the client", async () => {
  const w = world();
  const { conversation } = await w.service.start(clientActor, { providerId: "provider_1", body: "Bonjour", ...noAttachments });
  const longBody = "x".repeat(200);
  await w.service.send(providerActor, conversation.id, { body: longBody, ...noAttachments });

  const stored = w.conversations[0]!;
  assert.equal(stored.providerUnread, 0);
  assert.equal(stored.clientUnread, 1);
  assert.equal(stored.lastPreview, "x".repeat(120));
  assert.equal(w.notifications[1]!.userId, "client_1");

  await assert.rejects(() => w.service.send(stranger, conversation.id, { body: "hi", ...noAttachments }), status(404));
});

test("send refuses when blocked or when the counterpart is suspended", async () => {
  const blocked = world();
  const { conversation } = await blocked.service.start(clientActor, { providerId: "provider_1", body: "Bonjour", ...noAttachments });
  const safetyBlocked = world({ blocked: true });
  safetyBlocked.conversations.push(...blocked.conversations);
  await assert.rejects(() => safetyBlocked.service.send(providerActor, conversation.id, { body: "x", ...noAttachments }), status(403, "BLOCKED"));

  const suspended = world({ clientActive: false });
  suspended.conversations.push(...blocked.conversations);
  await assert.rejects(
    () => suspended.service.send(providerActor, conversation.id, { body: "x", ...noAttachments }),
    status(403, "RECIPIENT_UNAVAILABLE"),
  );
});

test("list returns the viewer side, unread and unreadTotal across both sides", async () => {
  const w = world();
  await w.service.start(clientActor, { providerId: "provider_1", body: "Un", ...noAttachments });
  await w.service.start(clientActor, { providerId: "provider_1", body: "Deux", ...noAttachments });

  const forProvider = await w.service.list(providerActor, { page: 1, limit: 20 });
  assert.equal(forProvider.total, 1);
  assert.equal(forProvider.unreadTotal, 2);
  assert.equal(forProvider.items[0]!.side, "provider");
  assert.equal(forProvider.items[0]!.unread, 2);
  assert.deepEqual(forProvider.items[0]!.counterpart, { userId: "client_1", providerId: null, name: "Paul Kabasele", photo: null });

  const forClient = await w.service.list(clientActor, { page: 1, limit: 20 });
  assert.equal(forClient.unreadTotal, 0);
  assert.equal(forClient.items[0]!.blocked, false);
});

test("messages pages from the newest block, ascending inside the page, and reset the viewer's unread", async () => {
  const w = world();
  const { conversation } = await w.service.start(clientActor, { providerId: "provider_1", body: "m1", ...noAttachments });
  for (const body of ["m2", "m3", "m4", "m5"]) {
    await w.service.send(clientActor, conversation.id, { body, ...noAttachments });
  }

  const page1 = await w.service.messages(providerActor, conversation.id, { page: 1, limit: 2 });
  assert.deepEqual(page1.items.map((item) => item.body), ["m4", "m5"]);
  assert.equal(page1.total, 5);
  assert.equal(page1.conversation.unread, 0);
  assert.equal(w.conversations[0]!.providerUnread, 0);

  const page3 = await w.service.messages(providerActor, conversation.id, { page: 3, limit: 2 });
  assert.deepEqual(page3.items.map((item) => item.body), ["m1"]);

  await assert.rejects(() => w.service.messages(stranger, conversation.id, { page: 1, limit: 2 }), status(404));
});

test("soft delete: sender only, tombstone for participants, preview updated when latest", async () => {
  const w = world();
  const { conversation, message } = await w.service.start(clientActor, { providerId: "provider_1", body: "Oups", ...noAttachments });

  await assert.rejects(() => w.service.deleteMessage(providerActor, conversation.id, message.id), status(403));
  await assert.rejects(() => w.service.deleteMessage(stranger, conversation.id, message.id), status(404));
  await assert.rejects(() => w.service.deleteMessage(clientActor, conversation.id, "missing"), status(404));

  assert.deepEqual(await w.service.deleteMessage(clientActor, conversation.id, message.id), { ok: true });
  assert.equal(w.conversations[0]!.lastPreview, "Message supprimé");
  assert.equal(w.messages[0]!.body, "Oups");

  const page = await w.service.messages(providerActor, conversation.id, { page: 1, limit: 10 });
  assert.equal(page.items[0]!.body, null);
  assert.deepEqual(page.items[0]!.attachments, []);
  assert.ok(page.items[0]!.deletedAt);

  const admin = { id: "admin_1", role: "ADMIN", isActive: true } as Actor;
  const reply = await w.service.send(providerActor, conversation.id, { body: "Pas grave", ...noAttachments });
  assert.deepEqual(await w.service.deleteMessage(admin, conversation.id, reply.id), { ok: true });
});
