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

test("getCategory returns a category with sorted subcategories and stats", async () => {
  const fakeCategory = {
    id: "cat_1",
    name: "Plomberie",
    slug: "plomberie",
    description: "Plombiers",
    icon: "Wrench",
    image: null,
    color: "#1E40AF",
    order: 1,
    isActive: true,
    createdAt: new Date("2026-04-01T00:00:00.000Z"),
    subcategories: [
      {
        id: "sub_1",
        categoryId: "cat_1",
        name: "Dépannage",
        slug: "depannage",
        description: null,
        icon: null,
        order: 0,
        isActive: true,
        createdAt: new Date("2026-04-01T00:00:00.000Z"),
      },
      {
        id: "sub_2",
        categoryId: "cat_1",
        name: "Installation",
        slug: "installation",
        description: null,
        icon: null,
        order: 1,
        isActive: true,
        createdAt: new Date("2026-04-01T00:00:00.000Z"),
      },
    ],
    _count: { providers: 5, subcategories: 2 },
  };

  let findUniqueArgs: unknown;
  const prisma = {
    category: {
      findUnique: async (args: unknown) => {
        findUniqueArgs = args;
        return fakeCategory;
      },
    },
  };

  const service = new AdminService(prisma as never, {} as never);
  const result = await service.getCategory("cat_1");

  assert.equal(result.success, true);
  assert.equal(result.category.id, "cat_1");
  assert.equal(result.category.subcategories[0].slug, "depannage");
  assert.equal(result.category.subcategories[1].slug, "installation");
  assert.deepEqual(result.category.stats, {
    providerCount: 5,
    subcategoryCount: 2,
  });
  assert.deepEqual(findUniqueArgs, {
    where: { id: "cat_1" },
    include: {
      subcategories: {
        orderBy: [{ order: "asc" }, { name: "asc" }],
      },
      _count: {
        select: {
          providers: true,
          subcategories: true,
        },
      },
    },
  });
});

test("getCategory throws NotFoundException when the category is missing", async () => {
  const prisma = {
    category: {
      findUnique: async () => null,
    },
  };
  const service = new AdminService(prisma as never, {} as never);

  await assert.rejects(
    () => service.getCategory("missing"),
    (err: Error) => err.message.includes("Category not found"),
  );
});

test("createSubcategory inserts and writes activity log", async () => {
  const calls: Record<string, unknown> = {};
  const prisma = {
    category: {
      findUnique: async (args: { where: { id: string } }) => {
        calls.categoryFindUnique = args;
        return { id: args.where.id };
      },
    },
    subcategory: {
      findMany: async () => [],
      create: async (args: { data: Record<string, unknown> }) => {
        calls.subcategoryCreate = args;
        return {
          id: "sub_new",
          categoryId: args.data.categoryId,
          name: args.data.name,
          slug: args.data.slug,
          description: args.data.description ?? null,
          icon: args.data.icon ?? null,
          order: args.data.order ?? 0,
          isActive: true,
          createdAt: new Date("2026-05-10T00:00:00.000Z"),
        };
      },
    },
    activityLog: {
      create: async (args: unknown) => {
        calls.activityLog = args;
      },
    },
  };
  const service = new AdminService(prisma as never, {} as never);

  const result = await service.createSubcategory(
    makeAdminActor() as never,
    {
      categoryId: "cat_1",
      name: "Vidange",
      slug: "vidange",
      description: "Vidange chauffe-eau",
      order: 2,
    },
    "127.0.0.1",
  );

  assert.equal(result.success, true);
  assert.equal(result.subcategory.slug, "vidange");
  assert.deepEqual(calls.categoryFindUnique, { where: { id: "cat_1" } });
  assert.equal(
    (calls.activityLog as { data: { action: string } }).data.action,
    "CREATE_SUBCATEGORY",
  );
});

test("createSubcategory throws when the parent category is missing", async () => {
  const prisma = {
    category: {
      findUnique: async () => null,
    },
  };
  const service = new AdminService(prisma as never, {} as never);

  await assert.rejects(
    () =>
      service.createSubcategory(
        makeAdminActor() as never,
        {
          categoryId: "missing",
          name: "X",
          slug: "x",
        },
        "127.0.0.1",
      ),
    (err: Error) => err.message.includes("Category not found"),
  );
});

test("createSubcategory throws when the slug already exists", async () => {
  const prisma = {
    category: {
      findUnique: async () => ({ id: "cat_1" }),
    },
    subcategory: {
      findMany: async () => [{ id: "sub_existing" }],
    },
  };
  const service = new AdminService(prisma as never, {} as never);

  await assert.rejects(
    () =>
      service.createSubcategory(
        makeAdminActor() as never,
        {
          categoryId: "cat_1",
          name: "Vidange",
          slug: "vidange",
        },
        "127.0.0.1",
      ),
    (err: Error) => err.message.toLowerCase().includes("slug"),
  );
});

test("updateSubcategory updates fields and writes activity log", async () => {
  const calls: Record<string, unknown> = {};
  const prisma = {
    subcategory: {
      findUnique: async () => ({
        id: "sub_1",
        categoryId: "cat_1",
        slug: "depannage",
      }),
      findMany: async () => [],
      update: async (args: { data: Record<string, unknown> }) => {
        calls.subcategoryUpdate = args;
        return {
          id: "sub_1",
          categoryId: "cat_1",
          name: (args.data.name as string) ?? "Dépannage",
          slug: (args.data.slug as string) ?? "depannage",
          description: (args.data.description as string) ?? null,
          icon: (args.data.icon as string) ?? null,
          order: (args.data.order as number) ?? 0,
          isActive: (args.data.isActive as boolean) ?? true,
          createdAt: new Date(),
        };
      },
    },
    activityLog: {
      create: async (args: unknown) => {
        calls.activityLog = args;
      },
    },
  };
  const service = new AdminService(prisma as never, {} as never);

  const result = await service.updateSubcategory(
    makeAdminActor() as never,
    {
      id: "sub_1",
      name: "Dépannage urgent",
      isActive: false,
    },
    "127.0.0.1",
  );

  assert.equal(result.success, true);
  assert.equal(
    (calls.activityLog as { data: { action: string } }).data.action,
    "UPDATE_SUBCATEGORY",
  );
});

test("updateSubcategory skips the slug uniqueness check when the slug is unchanged", async () => {
  let findManyCalled = false;
  const prisma = {
    subcategory: {
      findUnique: async () => ({
        id: "sub_1",
        categoryId: "cat_1",
        slug: "depannage",
      }),
      findMany: async () => {
        findManyCalled = true;
        return [];
      },
      update: async () => ({
        id: "sub_1",
        categoryId: "cat_1",
        name: "x",
        slug: "depannage",
        description: null,
        icon: null,
        order: 0,
        isActive: true,
        createdAt: new Date(),
      }),
    },
    activityLog: { create: async () => {} },
  };
  const service = new AdminService(prisma as never, {} as never);

  await service.updateSubcategory(
    makeAdminActor() as never,
    { id: "sub_1", slug: "depannage" },
    "127.0.0.1",
  );

  assert.equal(findManyCalled, false);
});

test("updateSubcategory excludes the current id when checking slug uniqueness on a slug change", async () => {
  let findManyArgs: unknown;
  const prisma = {
    subcategory: {
      findUnique: async () => ({
        id: "sub_1",
        categoryId: "cat_1",
        slug: "old-slug",
      }),
      findMany: async (args: unknown) => {
        findManyArgs = args;
        return [];
      },
      update: async () => ({
        id: "sub_1",
        categoryId: "cat_1",
        name: "x",
        slug: "new-slug",
        description: null,
        icon: null,
        order: 0,
        isActive: true,
        createdAt: new Date(),
      }),
    },
    activityLog: { create: async () => {} },
  };
  const service = new AdminService(prisma as never, {} as never);

  await service.updateSubcategory(
    makeAdminActor() as never,
    { id: "sub_1", slug: "new-slug" },
    "127.0.0.1",
  );

  assert.deepEqual(findManyArgs, {
    where: { slug: "new-slug", NOT: { id: "sub_1" } },
    select: { id: true },
  });
});

test("updateSubcategory throws when the subcategory is missing", async () => {
  const prisma = {
    subcategory: {
      findUnique: async () => null,
    },
  };
  const service = new AdminService(prisma as never, {} as never);

  await assert.rejects(
    () =>
      service.updateSubcategory(
        makeAdminActor() as never,
        { id: "missing", name: "X" },
        "127.0.0.1",
      ),
    (err: Error) => err.message.includes("Subcategory not found"),
  );
});

test("deleteSubcategory deletes when no providers are using it", async () => {
  const calls: Record<string, unknown> = {};
  const prisma = {
    providerSubcategory: {
      count: async (args: unknown) => {
        calls.count = args;
        return 0;
      },
    },
    subcategory: {
      delete: async (args: unknown) => {
        calls.delete = args;
        return { id: "sub_1" };
      },
    },
    activityLog: {
      create: async (args: unknown) => {
        calls.activityLog = args;
      },
    },
  };
  const service = new AdminService(prisma as never, {} as never);

  const result = await service.deleteSubcategory(
    makeAdminActor() as never,
    "sub_1",
    "127.0.0.1",
  );

  assert.equal(result.success, true);
  assert.deepEqual(calls.count, { where: { subcategoryId: "sub_1" } });
  assert.deepEqual(calls.delete, { where: { id: "sub_1" } });
  assert.equal(
    (calls.activityLog as { data: { action: string } }).data.action,
    "DELETE_SUBCATEGORY",
  );
});

test("deleteSubcategory rejects when providers are using it", async () => {
  const prisma = {
    providerSubcategory: {
      count: async () => 3,
    },
  };
  const service = new AdminService(prisma as never, {} as never);

  await assert.rejects(
    () =>
      service.deleteSubcategory(
        makeAdminActor() as never,
        "sub_1",
        "127.0.0.1",
      ),
    (err: Error) =>
      err.message.includes("provider association") || err.message.includes("3"),
  );
});
