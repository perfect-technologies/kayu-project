import assert from "node:assert/strict";
import test from "node:test";
import { AdminService } from "./admin.service";

function makeAdminActor() {
  return {
    id: "admin_1",
    email: "admin@example.com",
    firstName: "Ops",
    lastName: "Lead",
    role: "ADMIN",
    isActive: true,
  };
}

test("admin document approval verifies the provider when all required docs are approved", async () => {
  const calls: Record<string, unknown> = {};
  const notifications: unknown[] = [];
  const reviewedAt = new Date("2026-04-22T11:00:00.000Z");

  const approvedDocs = [
    {
      id: "doc_front",
      providerId: "provider_1",
      kind: "ID_FRONT",
      url: "launch-stub://front",
      fileName: "front.jpg",
      fileSize: null,
      mimeType: "image/jpeg",
      uploadedAt: new Date("2026-04-22T09:00:00.000Z"),
      reviewedAt,
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
      uploadedAt: new Date("2026-04-22T09:00:00.000Z"),
      reviewedAt,
      reviewedBy: "admin_1",
      decision: "APPROVED",
      rejectionReason: null,
    },
    {
      id: "doc_selfie",
      providerId: "provider_1",
      kind: "SELFIE",
      url: "launch-stub://selfie",
      fileName: "selfie.jpg",
      fileSize: null,
      mimeType: "image/jpeg",
      uploadedAt: new Date("2026-04-22T09:10:00.000Z"),
      reviewedAt,
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
      uploadedAt: new Date("2026-04-22T09:15:00.000Z"),
      reviewedAt,
      reviewedBy: "admin_1",
      decision: "APPROVED",
      rejectionReason: null,
    },
  ];

  const tx = {
    provider: {
      findUnique: async () => ({
        id: "provider_1",
        userId: "user_1",
        verificationStatus: "UNDER_REVIEW",
        user: { id: "user_1" },
      }),
      update: async (args: unknown) => {
        calls.providerUpdate = args;
      },
    },
    verificationDoc: {
      findFirst: async () => ({
        ...approvedDocs[3],
        decision: null,
        reviewedAt: null,
        reviewedBy: null,
      }),
      update: async (args: { data: Record<string, unknown> }) => {
        calls.reviewedDocUpdate = args;
        return approvedDocs[3];
      },
      findMany: async () => approvedDocs,
    },
    user: {
      update: async (args: unknown) => {
        calls.userUpdate = args;
      },
    },
    activityLog: {
      create: async (args: unknown) => {
        calls.activityLog = args;
      },
    },
  };

  const prisma = {
    $transaction: async <T>(
      callback: (client: typeof tx) => Promise<T>,
    ) => callback(tx),
  };
  const notificationsService = {
    create: async (input: unknown) => {
      notifications.push(input);
    },
  };

  const service = new AdminService(
    prisma as never,
    notificationsService as never,
  );
  (
    service as unknown as {
      syncProviderTrustArtifacts: () => Promise<void>;
    }
  ).syncProviderTrustArtifacts = async () => {};

  const result = await service.reviewVerificationDoc(
    makeAdminActor() as never,
    {
      providerId: "provider_1",
      docId: "doc_address",
      decision: "APPROVED",
    },
    "127.0.0.1",
  );

  assert.equal(result.verificationStatus, "VERIFIED");
  assert.deepEqual(calls.providerUpdate, {
    where: { id: "provider_1" },
    data: { verificationStatus: "VERIFIED" },
  });
  assert.deepEqual(calls.userUpdate, {
    where: { id: "user_1" },
    data: {
      isVerified: true,
      emailVerifiedAt: (calls.userUpdate as { data: { emailVerifiedAt: Date } }).data
        .emailVerifiedAt,
      phoneVerifiedAt: (calls.userUpdate as { data: { phoneVerifiedAt: Date } }).data
        .phoneVerifiedAt,
    },
  });
  assert.equal(notifications.length, 1);
});

test("manual provider rejection writes the reason onto verification docs and clears provider verification", async () => {
  const calls: Record<string, unknown> = {};
  const notifications: unknown[] = [];

  const tx = {
    provider: {
      update: async (args: unknown) => {
        calls.providerUpdate = args;
      },
      findUnique: async () => ({
        id: "provider_1",
        verificationStatus: "REJECTED",
        isPremium: false,
        isAvailable: true,
        user: {
          id: "user_1",
          firstName: "Jean",
          lastName: "Kasongo",
          isVerified: false,
        },
      }),
    },
    verificationDoc: {
      findMany: async () => [
        {
          id: "doc_1",
          providerId: "provider_1",
          kind: "ID_FRONT",
          url: "launch-stub://front",
          fileName: "front.jpg",
          fileSize: null,
          mimeType: "image/jpeg",
          uploadedAt: new Date("2026-04-22T08:00:00.000Z"),
          reviewedAt: null,
          reviewedBy: null,
          decision: null,
          rejectionReason: null,
        },
      ],
      update: async (args: unknown) => {
        calls.verificationDocUpdate = args;
      },
    },
    user: {
      update: async (args: unknown) => {
        calls.userUpdate = args;
      },
    },
    activityLog: {
      create: async (args: unknown) => {
        calls.activityLog = args;
      },
    },
  };

  const prisma = {
    provider: {
      findUnique: async () => ({
        id: "provider_1",
        userId: "user_1",
        verificationStatus: "UNDER_REVIEW",
        isPremium: false,
        isAvailable: true,
      }),
    },
    $transaction: async <T>(
      callback: (client: typeof tx) => Promise<T>,
    ) => callback(tx),
  };
  const notificationsService = {
    create: async (input: unknown) => {
      notifications.push(input);
    },
  };

  const service = new AdminService(
    prisma as never,
    notificationsService as never,
  );
  (
    service as unknown as {
      syncProviderTrustArtifacts: () => Promise<void>;
    }
  ).syncProviderTrustArtifacts = async () => {};

  const result = await service.updateProvider(
    makeAdminActor() as never,
    {
      providerId: "provider_1",
      verificationStatus: "REJECTED",
      rejectionReason: "Document flou",
    },
    "127.0.0.1",
  );

  assert.equal(result.provider.verificationStatus, "REJECTED");
  assert.deepEqual(calls.verificationDocUpdate, {
    where: { id: "doc_1" },
    data: {
      decision: "REJECTED",
      rejectionReason: "Document flou",
      reviewedAt: (calls.verificationDocUpdate as { data: { reviewedAt: Date } }).data
        .reviewedAt,
      reviewedBy: "admin_1",
    },
  });
  assert.deepEqual(calls.userUpdate, {
    where: { id: "user_1" },
    data: {
      isVerified: false,
    },
  });
  assert.equal(notifications.length, 1);
});
