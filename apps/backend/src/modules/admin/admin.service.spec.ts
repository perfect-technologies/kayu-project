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

test("support booking lookup exposes active dispute metadata", async () => {
  const prisma = {
    booking: {
      count: async () => 1,
      findMany: async () => [
        {
          id: "booking_1",
          title: "Réparation climatisation",
          status: "CONFIRMED",
          scheduledDate: new Date("2026-04-23T09:00:00.000Z"),
          createdAt: new Date("2026-04-22T08:00:00.000Z"),
          price: 45000,
          city: "Kinshasa",
          address: "Gombe",
          isPaid: false,
          paymentMethod: "cash",
          client: {
            id: "client_1",
            firstName: "Paul",
            lastName: "Kabasele",
            email: "paul@example.com",
            phone: "+243900000001",
          },
          provider: {
            id: "provider_1",
            userId: "provider_user_1",
            profession: "Frigoriste",
            user: {
              id: "provider_user_1",
              firstName: "Jean",
              lastName: "Kasongo",
              email: "jean@example.com",
              phone: "+243900000002",
            },
          },
          disputes: [
            {
              id: "dispute_1",
              status: "INVESTIGATING",
              severity: "HIGH",
              createdAt: new Date("2026-04-22T10:00:00.000Z"),
            },
          ],
        },
      ],
    },
  };

  const service = new AdminService(
    prisma as never,
    { create: async () => undefined } as never,
  );

  const result = await service.listSupportBookings({
    page: 1,
    limit: 10,
    search: "clim",
  });

  assert.equal(result.bookings.length, 1);
  assert.equal(result.bookings[0].support.activeDisputeId, "dispute_1");
  assert.equal(result.bookings[0].support.activeDisputeStatus, "INVESTIGATING");
  assert.equal(result.pagination.total, 1);
});

test("admin can create a dispute from a booking without an active ticket", async () => {
  const notifications: unknown[] = [];
  const activityLogs: unknown[] = [];

  const tx = {
    dispute: {
      create: async () => ({
        id: "dispute_1",
        bookingId: "booking_1",
        origin: "CLIENT",
        openedById: "client_1",
        reason: "Paiement contesté après intervention",
        clientStatement: "Le client conteste le montant final demandé.",
        proStatement: null,
        status: "PENDING_PRO",
        severity: "HIGH",
        resolution: null,
        resolutionPct: null,
        resolvedAt: null,
        deadlineAt: null,
        createdAt: new Date("2026-04-22T11:00:00.000Z"),
        updatedAt: new Date("2026-04-22T11:00:00.000Z"),
        evidences: [],
        booking: {
          id: "booking_1",
          title: "Réparation climatisation",
          status: "CONFIRMED",
          price: 45000,
          scheduledDate: new Date("2026-04-23T09:00:00.000Z"),
          client: {
            id: "client_1",
            firstName: "Paul",
            lastName: "Kabasele",
            email: "paul@example.com",
            phone: "+243900000001",
            avatar: null,
          },
          provider: {
            id: "provider_1",
            userId: "provider_user_1",
            profession: "Frigoriste",
            user: {
              id: "provider_user_1",
              firstName: "Jean",
              lastName: "Kasongo",
              email: "jean@example.com",
              phone: "+243900000002",
            },
          },
        },
      }),
    },
    activityLog: {
      create: async (input: unknown) => {
        activityLogs.push(input);
      },
    },
  };

  const prisma = {
    booking: {
      findUnique: async () => ({
        id: "booking_1",
        title: "Réparation climatisation",
        clientId: "client_1",
        providerId: "provider_1",
        provider: {
          userId: "provider_user_1",
        },
      }),
    },
    dispute: {
      findFirst: async () => null,
    },
    $transaction: async <T>(
      callback: (client: typeof tx) => Promise<T>,
    ) => callback(tx),
  };

  const service = new AdminService(
    prisma as never,
    {
      create: async (input: unknown) => {
        notifications.push(input);
      },
    } as never,
  );

  const result = await service.createDispute(
    makeAdminActor() as never,
    {
      bookingId: "booking_1",
      reporterRole: "CLIENT",
      severity: "HIGH",
      reason: "Paiement contesté après intervention",
      statement: "Le client conteste le montant final demandé.",
    },
    "127.0.0.1",
  );

  assert.equal(result.dispute.status, "PENDING_PRO");
  assert.equal(result.dispute.booking?.id, "booking_1");
  assert.equal(notifications.length, 2);
  assert.equal(activityLogs.length, 1);
});

test("admin can resolve a dispute with a resolution note", async () => {
  const notifications: unknown[] = [];
  const activityLogs: unknown[] = [];

  const tx = {
    dispute: {
      update: async () => ({
        id: "dispute_1",
        bookingId: "booking_1",
        origin: "CLIENT",
        openedById: "client_1",
        reason: "Paiement contesté après intervention",
        clientStatement: "Le client conteste le montant final demandé.",
        proStatement: "Le prestataire a fourni les justificatifs.",
        status: "RESOLVED",
        severity: "MEDIUM",
        resolution: "Remboursement partiel validé par ops.",
        resolutionPct: 40,
        resolvedAt: new Date("2026-04-22T12:00:00.000Z"),
        deadlineAt: null,
        createdAt: new Date("2026-04-22T11:00:00.000Z"),
        updatedAt: new Date("2026-04-22T12:00:00.000Z"),
        evidences: [],
        booking: {
          id: "booking_1",
          title: "Réparation climatisation",
          status: "CONFIRMED",
          price: 45000,
          scheduledDate: new Date("2026-04-23T09:00:00.000Z"),
          client: {
            id: "client_1",
            firstName: "Paul",
            lastName: "Kabasele",
            email: "paul@example.com",
            phone: "+243900000001",
            avatar: null,
          },
          provider: {
            id: "provider_1",
            userId: "provider_user_1",
            profession: "Frigoriste",
            user: {
              id: "provider_user_1",
              firstName: "Jean",
              lastName: "Kasongo",
              email: "jean@example.com",
              phone: "+243900000002",
            },
          },
        },
      }),
    },
    activityLog: {
      create: async (input: unknown) => {
        activityLogs.push(input);
      },
    },
  };

  const prisma = {
    dispute: {
      findUnique: async () => ({
        id: "dispute_1",
        status: "INVESTIGATING",
        severity: "MEDIUM",
        booking: {
          title: "Réparation climatisation",
          clientId: "client_1",
          provider: {
            userId: "provider_user_1",
          },
        },
      }),
    },
    $transaction: async <T>(
      callback: (client: typeof tx) => Promise<T>,
    ) => callback(tx),
  };

  const service = new AdminService(
    prisma as never,
    {
      create: async (input: unknown) => {
        notifications.push(input);
      },
    } as never,
  );

  const result = await service.updateDispute(
    makeAdminActor() as never,
    {
      disputeId: "dispute_1",
      status: "RESOLVED",
      severity: "MEDIUM",
      resolution: "Remboursement partiel validé par ops.",
      resolutionPct: 40,
    },
    "127.0.0.1",
  );

  assert.equal(result.dispute.status, "RESOLVED");
  assert.equal(result.dispute.resolutionPct, 40);
  assert.equal(notifications.length, 2);
  assert.equal(activityLogs.length, 1);
});

test("editing an already resolved dispute does not resend resolved notifications", async () => {
  const notifications: unknown[] = [];

  const tx = {
    dispute: {
      update: async () => ({
        id: "dispute_1",
        bookingId: "booking_1",
        origin: "CLIENT",
        openedById: "client_1",
        reason: "Paiement contesté après intervention",
        clientStatement: "Le client conteste le montant final demandé.",
        proStatement: "Le prestataire a fourni les justificatifs.",
        status: "RESOLVED",
        severity: "MEDIUM",
        resolution: "Note ops mise à jour.",
        resolutionPct: 40,
        resolvedAt: new Date("2026-04-22T12:00:00.000Z"),
        deadlineAt: null,
        createdAt: new Date("2026-04-22T11:00:00.000Z"),
        updatedAt: new Date("2026-04-22T12:30:00.000Z"),
        evidences: [],
        booking: {
          id: "booking_1",
          title: "Réparation climatisation",
          status: "CONFIRMED",
          price: 45000,
          scheduledDate: new Date("2026-04-23T09:00:00.000Z"),
          client: {
            id: "client_1",
            firstName: "Paul",
            lastName: "Kabasele",
            email: "paul@example.com",
            phone: "+243900000001",
            avatar: null,
          },
          provider: {
            id: "provider_1",
            userId: "provider_user_1",
            profession: "Frigoriste",
            user: {
              id: "provider_user_1",
              firstName: "Jean",
              lastName: "Kasongo",
              email: "jean@example.com",
              phone: "+243900000002",
            },
          },
        },
      }),
    },
    activityLog: {
      create: async () => undefined,
    },
  };

  const prisma = {
    dispute: {
      findUnique: async () => ({
        id: "dispute_1",
        status: "RESOLVED",
        severity: "MEDIUM",
        booking: {
          title: "Réparation climatisation",
          clientId: "client_1",
          provider: {
            userId: "provider_user_1",
          },
        },
      }),
    },
    $transaction: async <T>(
      callback: (client: typeof tx) => Promise<T>,
    ) => callback(tx),
  };

  const service = new AdminService(
    prisma as never,
    {
      create: async (input: unknown) => {
        notifications.push(input);
      },
    } as never,
  );

  const result = await service.updateDispute(
    makeAdminActor() as never,
    {
      disputeId: "dispute_1",
      severity: "MEDIUM",
      resolution: "Note ops mise à jour.",
      resolutionPct: 40,
    },
    "127.0.0.1",
  );

  assert.equal(result.dispute.status, "RESOLVED");
  assert.equal(notifications.length, 0);
});
