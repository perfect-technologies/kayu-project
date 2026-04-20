import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { MessagingService } from "./messaging.service";

const now = new Date("2026-04-19T10:00:00.000Z");

function makeActor(overrides: Partial<Actor> = {}): Actor {
  return {
    id: "client_user_1",
    authUserId: "auth_client_1",
    email: "client@example.com",
    phone: "+243897000002",
    firstName: "Client",
    lastName: "User",
    role: "CLIENT",
    isActive: true,
    ...overrides,
  } as Actor;
}

function makeService(options: { allowMessages?: boolean; recipientId?: string } = {}) {
  const recipientId = options.recipientId ?? "provider_user_1";
  const calls: {
    upsert?: Record<string, unknown>;
    messageCreate?: { data: Record<string, unknown> };
    conversationUpdates: unknown[];
    notifications: Array<{ input: Record<string, unknown>; tx: unknown }>;
    transactionStarted: boolean;
  } = {
    conversationUpdates: [],
    notifications: [],
    transactionStarted: false,
  };

  const tx = {
    conversation: {
      upsert: async (input: Record<string, unknown>) => {
        calls.upsert = input;
        return { id: "conversation_1" };
      },
      update: async (input: unknown) => {
        calls.conversationUpdates.push(input);
      },
    },
    message: {
      create: async (input: { data: Record<string, unknown> }) => {
        calls.messageCreate = input;
        return {
          id: "message_1",
          conversationId: input.data.conversationId,
          senderId: input.data.senderId,
          content: input.data.content,
          type: input.data.type,
          fileUrl: input.data.fileUrl,
          isRead: false,
          readAt: null,
          isDeleted: false,
          createdAt: now,
          sender: {
            id: input.data.senderId,
            firstName: "Client",
            lastName: "User",
            avatar: null,
          },
        };
      },
    },
  };

  const prisma = {
    user: {
      findUnique: async () => ({
        id: recipientId,
        visibilitySettings:
          options.allowMessages === undefined
            ? null
            : { allowMessages: options.allowMessages },
      }),
    },
    $transaction: async <T>(callback: (client: typeof tx) => Promise<T>) => {
      calls.transactionStarted = true;
      return callback(tx);
    },
  };

  const notifications = {
    create: async (input: Record<string, unknown>, txArg: unknown) => {
      calls.notifications.push({ input, tx: txArg });
    },
  };

  return {
    service: new MessagingService(prisma as never, notifications as never),
    calls,
  };
}

test("first message creates a conversation and returns enough data to bind chat UI", async () => {
  const actor = makeActor();
  const { service, calls } = makeService();

  const result = await service.sendMessage(actor, {
    recipientId: "provider_user_1",
    content: "Bonjour, êtes-vous disponible ?",
    type: "TEXT",
  });

  assert.equal(result.success, true);
  assert.equal(result.conversationId, "conversation_1");
  assert.equal(result.message.conversationId, "conversation_1");
  assert.equal(result.message.id, "message_1");
  assert.equal(calls.messageCreate?.data.conversationId, "conversation_1");
  assert.equal(calls.messageCreate?.data.senderId, actor.id);
  assert.equal(calls.notifications.length, 1);
  assert.deepEqual(calls.notifications[0]?.input.data, {
    conversationId: "conversation_1",
    messageId: "message_1",
  });
});

test("send message rejects recipients who disabled messaging", async () => {
  const { service, calls } = makeService({ allowMessages: false });

  await assert.rejects(
    () =>
      service.sendMessage(makeActor(), {
        recipientId: "provider_user_1",
        content: "Bonjour",
        type: "TEXT",
      }),
    (error) => error instanceof BadRequestException,
  );

  assert.equal(calls.transactionStarted, false);
});

test("send message rejects self messages", async () => {
  const { service, calls } = makeService({ recipientId: "client_user_1" });

  await assert.rejects(
    () =>
      service.sendMessage(makeActor(), {
        recipientId: "client_user_1",
        content: "Bonjour",
        type: "TEXT",
      }),
    (error) => error instanceof BadRequestException,
  );

  assert.equal(calls.transactionStarted, false);
});
