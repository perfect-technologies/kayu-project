import assert from "node:assert/strict";
import test from "node:test";
import { HttpException } from "@nestjs/common";
import type { VerificationDoc } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import { VerificationService } from "./verification.service";

const actor = { id: "user_provider_1", role: "PROVIDER", isActive: true } as Actor;

function doc(overrides: Partial<VerificationDoc>): VerificationDoc {
  return {
    id: `doc_${overrides.kind ?? "x"}`,
    providerId: "provider_1",
    kind: "ID_FRONT",
    storagePath: `verification/user_provider_1/${(overrides.kind ?? "x").toLowerCase()}.jpg`,
    fileName: "file.jpg",
    mime: "image/jpeg",
    bytes: 1000,
    uploadedAt: new Date("2026-09-10T09:00:00.000Z"),
    reviewedAt: null,
    reviewedById: null,
    decision: null,
    rejectionReason: null,
    ...overrides,
  };
}

const approvedRequired = (["ID_FRONT", "ID_BACK", "SELFIE", "ADDRESS"] as const).map((kind) =>
  doc({ kind, decision: "APPROVED", reviewedAt: new Date("2026-09-11T09:00:00.000Z"), reviewedById: "admin_1" }),
);

function setup(options: { status?: string; docs?: VerificationDoc[]; existingPath?: string | null } = {}) {
  const calls: Record<string, unknown> = { removed: [] as unknown[] };
  let docs = [...(options.docs ?? [])];
  const tx = {
    provider: {
      findUniqueOrThrow: async () => ({ verificationStatus: options.status ?? "PENDING" }),
      update: async (args: unknown) => {
        calls.providerUpdate = args;
      },
    },
    verificationDoc: {
      findUnique: async ({ where }: { where: { id?: string; providerId_kind?: unknown } }) => {
        if (where.providerId_kind) return options.existingPath ? { storagePath: options.existingPath } : null;
        return docs.find((item) => item.id === where.id) ?? null;
      },
      upsert: async (args: { create: Partial<VerificationDoc>; update: Partial<VerificationDoc> }) => {
        calls.upsert = args;
        const saved = doc({ ...args.create, id: "doc_saved" });
        docs = [...docs.filter((item) => item.kind !== saved.kind), saved];
        return saved;
      },
      findMany: async () => docs,
      delete: async ({ where }: { where: { id: string } }) => {
        calls.deleted = where;
        docs = docs.filter((item) => item.id !== where.id);
      },
    },
  };
  const prisma = {
    provider: {
      findUnique: async () => ({ id: "provider_1" }),
      findUniqueOrThrow: tx.provider.findUniqueOrThrow,
      update: async (args: unknown) => {
        calls.providerUpdate = args;
        return { verificationStatus: "UNDER_REVIEW" };
      },
    },
    verificationDoc: { findMany: async () => docs },
    $transaction: async <T>(cb: (client: typeof tx) => Promise<T>) => cb(tx),
  };
  const storage = {
    assertOwnedPath: (_purpose: string, userId: string, path: string) => {
      if (!path.startsWith(`verification/${userId}/`)) throw new HttpException("foreign", 403);
      return true;
    },
    assertUploadAllowed: (_purpose: string, mime: string) => {
      if (!["image/jpeg", "application/pdf"].includes(mime)) throw new HttpException("mime", 400);
    },
    removeObjects: async (objects: unknown[]) => {
      (calls.removed as unknown[]).push(...objects);
    },
  };
  return { service: new VerificationService(prisma as never, storage as never), calls };
}

test("uploadDoc upserts on (provider, kind) with the new columns and resets the review", async () => {
  const { service, calls } = setup({ status: "REJECTED", docs: [doc({ kind: "SELFIE", decision: "REJECTED" })] });
  const result = await service.uploadDoc(actor, {
    kind: "SELFIE",
    path: "verification/user_provider_1/abc-selfie face.jpg",
    fileName: "selfie face.jpg",
    mime: "image/jpeg",
    bytes: 123456,
  });

  const upsert = calls.upsert as { update: Record<string, unknown> };
  assert.equal(upsert.update.fileName, "selfie-face.jpg");
  assert.equal(upsert.update.bytes, 123456);
  assert.equal(upsert.update.mime, "image/jpeg");
  assert.equal(upsert.update.decision, null);
  assert.equal(upsert.update.reviewedById, null);
  assert.deepEqual(calls.providerUpdate, { where: { id: "provider_1" }, data: { verificationStatus: "PENDING" } });
  assert.equal(result.success, true);
  assert.equal(result.doc.storagePolicy, "SUPABASE_PRIVATE");
  assert.equal(result.doc.storagePath, "verification/user_provider_1/abc-selfie face.jpg");
  assert.deepEqual(calls.removed, []);
});

test("replacing a document removes the previous object after the commit", async () => {
  const { service, calls } = setup({ existingPath: "verification/user_provider_1/old-front.jpg" });
  await service.uploadDoc(actor, {
    kind: "ID_FRONT",
    path: "verification/user_provider_1/new-front.jpg",
    mime: "image/jpeg",
    bytes: 10,
  });
  assert.deepEqual(calls.removed, [{ purpose: "verification", path: "verification/user_provider_1/old-front.jpg" }]);
});

test("uploadDoc refuses foreign paths and unsupported types", async () => {
  const { service } = setup();
  await assert.rejects(
    () => service.uploadDoc(actor, { kind: "ID_FRONT", path: "verification/someone/x.jpg", mime: "image/jpeg", bytes: 1 }),
    (error: unknown) => error instanceof HttpException && error.getStatus() === 403,
  );
  await assert.rejects(
    () => service.uploadDoc(actor, { kind: "ID_FRONT", path: "verification/user_provider_1/x.exe", mime: "application/x-msdownload", bytes: 1 }),
    (error: unknown) => error instanceof HttpException && error.getStatus() === 400,
  );
});

test("removing a required document downgrades a verified provider and deletes the object", async () => {
  const { service, calls } = setup({ status: "VERIFIED", docs: approvedRequired });
  await service.removeDoc(actor, "doc_SELFIE");
  assert.deepEqual(calls.deleted, { id: "doc_SELFIE" });
  assert.deepEqual(calls.providerUpdate, { where: { id: "provider_1" }, data: { verificationStatus: "PENDING" } });
  assert.deepEqual(calls.removed, [{ purpose: "verification", path: "verification/user_provider_1/selfie.jpg" }]);

  await assert.rejects(() => service.removeDoc(actor, "doc_missing"), (error: unknown) => error instanceof HttpException && error.getStatus() === 404);
});

test("state does not stay verified when a required document is missing", async () => {
  const { service } = setup({ status: "VERIFIED", docs: approvedRequired.filter((item) => item.kind !== "SELFIE") });
  const state = await service.getState(actor);
  assert.equal(state.state, "IN_PROGRESS");
  assert.deepEqual(state.missingKinds, ["SELFIE"]);
  assert.equal(state.docs[0]!.reviewedById, "admin_1");
});

test("submit requires every required kind, then moves to UNDER_REVIEW", async () => {
  const incomplete = setup({ docs: [doc({ kind: "ID_FRONT" })] });
  await assert.rejects(() => incomplete.service.submit(actor), (error: unknown) => error instanceof HttpException && error.getStatus() === 400);

  const complete = setup({ docs: (["ID_FRONT", "ID_BACK", "SELFIE", "ADDRESS"] as const).map((kind) => doc({ kind })) });
  const state = await complete.service.submit(actor);
  assert.equal(state.state, "IN_REVIEW");
  assert.equal(state.progress, 75);
});

test("non-providers are refused", async () => {
  const { service } = setup();
  await assert.rejects(
    () => service.getState({ id: "client", role: "CLIENT" } as Actor),
    (error: unknown) => error instanceof HttpException && error.getStatus() === 403,
  );
});
