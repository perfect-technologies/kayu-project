import assert from "node:assert/strict";
import test from "node:test";
import { HttpException } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { MediaController } from "./media.controller";
import { StorageService } from "./storage.service";

function fakeSupabase(removed: string[][] = []) {
  return {
    storage: {
      from: (bucket: string) => ({
        createSignedUrl: async (path: string) => ({ data: { signedUrl: `https://signed/${bucket}/${path}` }, error: null }),
        createSignedUploadUrl: async (path: string) => ({ data: { signedUrl: "https://up", token: "tok", path }, error: null }),
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://cdn.example/storage/v1/object/public/${bucket}/${path}` },
        }),
        remove: async (paths: string[]) => {
          removed.push(paths);
          return { data: [], error: null };
        },
      }),
    },
  };
}

function actor(id: string, role: Actor["role"] = "CLIENT"): Actor {
  return { id, role, isActive: true } as Actor;
}

function setup(options: { participantMessage?: boolean; avatar?: string | null; providerPhoto?: string | null } = {}) {
  const removed: string[][] = [];
  const storage = new StorageService(fakeSupabase(removed) as never);
  const calls: Record<string, unknown> = {};
  const prisma = {
    message: {
      findFirst: async (args: unknown) => {
        calls.messageQuery = args;
        return options.participantMessage ? { id: "message_1" } : null;
      },
    },
    user: {
      findUnique: async () => ({ avatar: options.avatar ?? null }),
      update: async (args: unknown) => {
        calls.userUpdate = args;
      },
    },
    provider: {
      findUnique: async () => (options.providerPhoto === undefined ? null : { profilePhoto: options.providerPhoto }),
    },
  };
  return { controller: new MediaController(storage, prisma as never), storage, calls, removed };
}

const status = (expected: number) => (error: unknown) =>
  error instanceof HttpException && error.getStatus() === expected;

test("sign-read: the owner and admins get a signed URL for private objects", async () => {
  const { controller } = setup();
  const own = await controller.signRead(actor("user_1"), { path: "verification/user_1/abc-id.jpg" });
  assert.match(own.url, /^https:\/\/signed\/verification-docs\//);

  const admin = await controller.signRead(actor("admin_1", "ADMIN"), { path: "verification/user_1/abc-id.jpg" });
  assert.ok(admin.expiresAt);
});

test("sign-read: a conversation participant can read an attachment it did not upload", async () => {
  const { controller, calls } = setup({ participantMessage: true });
  const result = await controller.signRead(actor("provider_user"), { path: "attachments/client_1/abc-photo.jpg" });
  assert.match(result.url, /message-attachments/);
  const where = (calls.messageQuery as { where: Record<string, unknown> }).where;
  assert.deepEqual(where.attachments, { array_contains: [{ path: "attachments/client_1/abc-photo.jpg" }] });
  assert.equal(where.deletedAt, null);
});

test("sign-read: strangers are refused and verification docs never open to participants", async () => {
  const { controller } = setup({ participantMessage: false });
  await assert.rejects(
    () => controller.signRead(actor("stranger"), { path: "attachments/client_1/abc-photo.jpg" }),
    status(403),
  );
  const participant = setup({ participantMessage: true }).controller;
  await assert.rejects(
    () => participant.signRead(actor("stranger"), { path: "verification/client_1/abc-id.jpg" }),
    status(403),
  );
});

test("sign-read: public purposes and malformed paths are rejected with 400", async () => {
  const { controller } = setup();
  await assert.rejects(() => controller.signRead(actor("user_1"), { path: "media/user_1/abc-photo.jpg" }), status(400));
  await assert.rejects(() => controller.signRead(actor("user_1"), { path: "avatar/user_1/abc.jpg" }), status(400));
  await assert.rejects(() => controller.signRead(actor("user_1"), { path: "nope/user_1/abc.jpg" }), status(400));
});

test("sign: refuses a mime type outside the purpose allow-list", async () => {
  const { controller } = setup();
  assert.throws(
    () => controller.sign(actor("user_1"), { purpose: "avatar", fileName: "a.mp4", mimeType: "video/mp4" }),
    status(400),
  );
  const signed = await controller.sign(actor("user_1"), { purpose: "attachments", fileName: "v.webm", mimeType: "audio/webm" });
  assert.equal(signed.bucket, "message-attachments");
});

test("avatar: stores the public URL and removes the previous owned avatar unless reused as provider photo", async () => {
  const previous = "https://cdn.example/storage/v1/object/public/avatars/avatar/user_1/old.jpg";
  const { controller, removed, calls } = setup({ avatar: previous });
  const result = await controller.setAvatar(actor("user_1"), { path: "avatar/user_1/new.jpg" });
  assert.equal(result.success, true);
  assert.match(result.avatarUrl, /avatars\/avatar\/user_1\/new\.jpg$/);
  assert.ok(calls.userUpdate);
  assert.deepEqual(removed, [["avatar/user_1/old.jpg"]]);

  const reused = setup({ avatar: previous, providerPhoto: previous });
  await reused.controller.setAvatar(actor("user_1"), { path: "avatar/user_1/new.jpg" });
  assert.deepEqual(reused.removed, []);

  await assert.rejects(
    () => controller.setAvatar(actor("user_1"), { path: "avatar/user_2/new.jpg" }),
    status(403),
  );
});
