import assert from "node:assert/strict";
import test from "node:test";
import type { Actor } from "../../common/auth/types";
import { VerificationService } from "./verification.service";

function makeActor(overrides: Partial<Actor> = {}): Actor {
  return {
    id: "user_provider_1",
    authUserId: "auth_provider_1",
    email: "pro@example.com",
    phone: "+243810000111",
    firstName: "Jean",
    lastName: "Kasongo",
    role: "PROVIDER",
    isActive: true,
    ...overrides,
  } as Actor;
}

test("verification upload stores launch stub metadata and resets rejected providers to pending", async () => {
  const calls: Record<string, unknown> = {};

  const tx = {
    verificationDoc: {
      findFirst: async (args: unknown) => {
        calls.findExistingDoc = args;
        return null;
      },
      findMany: async () => [
        {
          id: "doc_1",
          providerId: "provider_1",
          kind: "SELFIE",
          url: "launch-stub://verification/provider_1/selfie/original",
          fileName: "selfie-face.jpg",
          fileSize: 123456,
          mimeType: "image/jpeg",
          uploadedAt: new Date("2026-04-22T10:00:00.000Z"),
          reviewedAt: null,
          reviewedBy: null,
          decision: null,
          rejectionReason: null,
        },
      ],
      create: async (args: { data: Record<string, unknown> }) => {
        calls.createDoc = args;
        return {
          id: "doc_1",
          providerId: "provider_1",
          kind: "SELFIE",
          url: args.data.url,
          fileName: args.data.fileName,
          fileSize: args.data.fileSize ?? null,
          mimeType: args.data.mimeType ?? null,
          uploadedAt: new Date("2026-04-22T10:00:00.000Z"),
          reviewedAt: null,
          reviewedBy: null,
          decision: null,
          rejectionReason: null,
        };
      },
    },
    provider: {
      findUniqueOrThrow: async () => ({ verificationStatus: "REJECTED" }),
      update: async (args: unknown) => {
        calls.providerUpdate = args;
      },
    },
  };

  const prisma = {
    provider: {
      findUnique: async () => ({ id: "provider_1" }),
    },
    $transaction: async <T>(
      callback: (client: typeof tx) => Promise<T>,
    ) => callback(tx),
  };

  const service = new VerificationService(prisma as never);
  const result = await service.uploadDoc(makeActor(), {
    kind: "SELFIE",
    fileName: "selfie face.jpg",
    fileSize: 123456,
    mimeType: "image/jpeg",
  });

  const created = calls.createDoc as { data: Record<string, unknown> };
  assert.equal(created.data.fileName, "selfie-face.jpg");
  assert.match(String(created.data.url), /^launch-stub:\/\/verification\//);
  assert.deepEqual(calls.providerUpdate, {
    where: { id: "provider_1" },
    data: { verificationStatus: "PENDING" },
  });
  assert.equal(result.doc.storagePolicy, "LAUNCH_STUB_METADATA_ONLY");
  assert.equal(result.doc.fileName, "selfie-face.jpg");
});

test("removing a required verification document downgrades a verified provider back to pending", async () => {
  const calls: Record<string, unknown> = {};

  const tx = {
    provider: {
      findUniqueOrThrow: async () => ({ verificationStatus: "VERIFIED" }),
      update: async (args: unknown) => {
        calls.providerUpdate = args;
      },
    },
    verificationDoc: {
      findUnique: async () => ({
        id: "doc_selfie",
        providerId: "provider_1",
      }),
      delete: async (args: unknown) => {
        calls.deletedDoc = args;
      },
      findMany: async () => [
        {
          id: "doc_front",
          providerId: "provider_1",
          kind: "ID_FRONT",
          url: "launch-stub://front",
          fileName: "front.jpg",
          fileSize: null,
          mimeType: "image/jpeg",
          uploadedAt: new Date("2026-04-22T09:00:00.000Z"),
          reviewedAt: new Date("2026-04-22T09:30:00.000Z"),
          reviewedBy: "admin_1",
          decision: "APPROVED",
          rejectionReason: null,
        },
        {
          id: "doc_back",
          providerId: "provider_1",
          kind: "ID_BACK",
          url: "launch-stub://back",
          fileName: "back.jpg",
          fileSize: null,
          mimeType: "image/jpeg",
          uploadedAt: new Date("2026-04-22T09:01:00.000Z"),
          reviewedAt: new Date("2026-04-22T09:30:00.000Z"),
          reviewedBy: "admin_1",
          decision: "APPROVED",
          rejectionReason: null,
        },
        {
          id: "doc_address",
          providerId: "provider_1",
          kind: "ADDRESS",
          url: "launch-stub://address",
          fileName: "address.pdf",
          fileSize: null,
          mimeType: "application/pdf",
          uploadedAt: new Date("2026-04-22T09:02:00.000Z"),
          reviewedAt: new Date("2026-04-22T09:30:00.000Z"),
          reviewedBy: "admin_1",
          decision: "APPROVED",
          rejectionReason: null,
        },
      ],
    },
  };

  const prisma = {
    provider: {
      findUnique: async () => ({ id: "provider_1" }),
    },
    $transaction: async <T>(
      callback: (client: typeof tx) => Promise<T>,
    ) => callback(tx),
  };

  const service = new VerificationService(prisma as never);
  await service.removeDoc(makeActor(), "doc_selfie");

  assert.deepEqual(calls.deletedDoc, { where: { id: "doc_selfie" } });
  assert.deepEqual(calls.providerUpdate, {
    where: { id: "provider_1" },
    data: { verificationStatus: "PENDING" },
  });
});

test("verification state does not stay verified when required documents are missing", async () => {
  const prisma = {
    provider: {
      findUnique: async () => ({ id: "provider_1" }),
      findUniqueOrThrow: async () => ({
        verificationStatus: "VERIFIED",
        updatedAt: new Date("2026-04-22T11:00:00.000Z"),
      }),
    },
    verificationDoc: {
      findMany: async () => [
        {
          id: "doc_front",
          providerId: "provider_1",
          kind: "ID_FRONT",
          url: "launch-stub://front",
          fileName: "front.jpg",
          fileSize: null,
          mimeType: "image/jpeg",
          uploadedAt: new Date("2026-04-22T09:00:00.000Z"),
          reviewedAt: new Date("2026-04-22T09:30:00.000Z"),
          reviewedBy: "admin_1",
          decision: "APPROVED",
          rejectionReason: null,
        },
        {
          id: "doc_back",
          providerId: "provider_1",
          kind: "ID_BACK",
          url: "launch-stub://back",
          fileName: "back.jpg",
          fileSize: null,
          mimeType: "image/jpeg",
          uploadedAt: new Date("2026-04-22T09:01:00.000Z"),
          reviewedAt: new Date("2026-04-22T09:30:00.000Z"),
          reviewedBy: "admin_1",
          decision: "APPROVED",
          rejectionReason: null,
        },
        {
          id: "doc_address",
          providerId: "provider_1",
          kind: "ADDRESS",
          url: "launch-stub://address",
          fileName: "address.pdf",
          fileSize: null,
          mimeType: "application/pdf",
          uploadedAt: new Date("2026-04-22T09:02:00.000Z"),
          reviewedAt: new Date("2026-04-22T09:30:00.000Z"),
          reviewedBy: "admin_1",
          decision: "APPROVED",
          rejectionReason: null,
        },
      ],
    },
  };

  const service = new VerificationService(prisma as never);
  const state = await service.getState(makeActor());

  assert.equal(state.state, "IN_PROGRESS");
  assert.deepEqual(state.missingKinds, ["SELFIE"]);
});
