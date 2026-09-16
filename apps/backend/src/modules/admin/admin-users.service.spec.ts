import assert from "node:assert/strict";
import test from "node:test";
import { HttpException } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { AdminUsersService } from "./admin-users.service";

type UserRow = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  role: "CLIENT" | "PROVIDER" | "ADMIN";
  isActive: boolean;
  suspendedAt: Date | null;
  suspendedReason: string | null;
  placeId: string | null;
  place: { label: string } | null;
  createdAt: Date;
  lastLoginAt: Date | null;
  provider: { id: string; displayName: string; hidden: boolean; verificationStatus: string } | null;
};

const now = new Date("2026-09-16T10:00:00.000Z");

function user(overrides: Partial<UserRow>): UserRow {
  return {
    id: "user_1",
    firstName: "Paul",
    lastName: "Kabasele",
    email: "paul@example.cd",
    phone: "+243810000001",
    avatar: null,
    role: "CLIENT",
    isActive: true,
    suspendedAt: null,
    suspendedReason: null,
    placeId: "gombe",
    place: { label: "Gombe" },
    createdAt: now,
    lastLoginAt: now,
    provider: null,
    ...overrides,
  };
}

const admin = { id: "admin_1", role: "ADMIN", isActive: true } as Actor;

function makeService(rows: UserRow[]) {
  const calls = {
    queryRaw: 0,
    transactions: 0,
    findMany: [] as unknown[],
    userUpdates: [] as Array<{ where: { id: string }; data: Record<string, unknown> }>,
    providerUpdates: [] as unknown[],
    logs: [] as Array<{ entry: Record<string, any>; client: unknown }>,
  };
  const tx = {
    $queryRaw: async () => {
      calls.queryRaw += 1;
      return [];
    },
    user: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const row = rows.find((item) => item.id === where.id);
        return row ? { ...row } : null;
      },
      findMany: async (args: unknown) => {
        calls.findMany.push(args);
        return rows;
      },
      count: async ({ where }: { where?: { role?: string; isActive?: boolean; id?: { not: string } } } = {}) =>
        rows.filter(
          (row) =>
            (!where?.role || row.role === where.role) &&
            (where?.isActive === undefined || row.isActive === where.isActive) &&
            (!where?.id || row.id !== where.id.not),
        ).length,
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        calls.userUpdates.push({ where, data });
        const row = rows.find((item) => item.id === where.id)!;
        Object.assign(row, data);
        return { ...row };
      },
    },
    provider: {
      update: async (args: unknown) => {
        calls.providerUpdates.push(args);
        return {};
      },
    },
  };
  const prisma = {
    ...tx,
    $transaction: async <T>(callback: (client: typeof tx) => Promise<T>) => {
      calls.transactions += 1;
      return callback(tx);
    },
  };
  const activity = {
    log: async (entry: Record<string, unknown>, client: unknown) => {
      calls.logs.push({ entry, client });
    },
  };
  const service = new AdminUsersService(prisma as never, activity as never, {} as never);
  return { service, calls, tx };
}

function expectCode(status: number, code: string) {
  return (error: unknown) => {
    assert.ok(error instanceof HttpException);
    assert.equal(error.getStatus(), status);
    assert.equal((error.getResponse() as { code: string }).code, code);
    return true;
  };
}

test("list filters by role, suspension and a search over names, contacts and place", async () => {
  const { service, calls } = makeService([
    user({
      provider: { id: "provider_1", displayName: "Plomberie Paul", hidden: false, verificationStatus: "VERIFIED" },
      role: "PROVIDER",
    }),
  ]);

  const page = await service.list({ page: 2, limit: 10, role: "PROVIDER", suspended: false, q: "gombe" });

  const args = calls.findMany[0] as { where: Record<string, any>; skip: number; take: number };
  assert.equal(args.where.role, "PROVIDER");
  assert.equal(args.where.isActive, true);
  assert.equal(args.where.OR.length, 5);
  assert.deepEqual(args.where.OR[4], { place: { label: { contains: "gombe", mode: "insensitive" } } });
  assert.equal(args.skip, 10);
  assert.equal(page.total, 1);
  assert.equal(page.items[0]!.name, "Paul Kabasele");
  assert.equal(page.items[0]!.placeLabel, "Gombe");
  assert.deepEqual(page.items[0]!.provider, {
    id: "provider_1",
    displayName: "Plomberie Paul",
    hidden: false,
    verificationStatus: "VERIFIED",
  });
});

test("an admin cannot target their own account", async () => {
  const { service, calls } = makeService([user({ id: "admin_1", role: "ADMIN" })]);
  await assert.rejects(() => service.update(admin, "admin_1", { role: "CLIENT" }), expectCode(400, "SELF_ACTION"));
  assert.equal(calls.transactions, 0);
});

test("role changes other than CLIENT ⇄ ADMIN are refused", async () => {
  const { service, calls } = makeService([
    user({ id: "client_1" }),
    user({ id: "provider_user", role: "PROVIDER", provider: { id: "p", displayName: "P", hidden: false, verificationStatus: "PENDING" } }),
  ]);
  await assert.rejects(
    () => service.update(admin, "client_1", { role: "PROVIDER" }),
    expectCode(409, "ROLE_CHANGE_NOT_ALLOWED"),
  );
  await assert.rejects(
    () => service.update(admin, "provider_user", { role: "ADMIN" }),
    expectCode(409, "ROLE_CHANGE_NOT_ALLOWED"),
  );
  assert.equal(calls.userUpdates.length, 0);
});

test("demoting or suspending the last active admin is refused after locking admin rows", async () => {
  const { service, calls } = makeService([
    user({ id: "admin_2", role: "ADMIN" }),
    user({ id: "admin_3", role: "ADMIN", isActive: false }),
  ]);

  await assert.rejects(
    () => service.update(admin, "admin_2", { role: "CLIENT" }),
    expectCode(409, "LAST_ADMIN"),
  );
  await assert.rejects(
    () => service.update(admin, "admin_2", { suspended: true, suspendedReason: "Abus" }),
    expectCode(409, "LAST_ADMIN"),
  );
  assert.equal(calls.queryRaw, 2);
  assert.equal(calls.userUpdates.length, 0);
});

test("demoting an admin works when another active admin remains", async () => {
  const { service, calls } = makeService([
    user({ id: "admin_2", role: "ADMIN" }),
    user({ id: "admin_4", role: "ADMIN" }),
  ]);

  const result = await service.update(admin, "admin_2", { role: "CLIENT" }, "10.0.0.1");

  assert.equal(result.role, "CLIENT");
  assert.deepEqual(calls.userUpdates[0]!.data, { role: "CLIENT" });
  assert.deepEqual(calls.logs[0]!.entry.metadata.role, { from: "ADMIN", to: "CLIENT" });
});

test("suspending a provider hides the profile and journals the change with the ip", async () => {
  const { service, calls, tx } = makeService([
    user({
      id: "provider_user",
      role: "PROVIDER",
      provider: { id: "provider_1", displayName: "Plomberie Paul", hidden: false, verificationStatus: "VERIFIED" },
    }),
  ]);

  const result = await service.update(
    admin,
    "provider_user",
    { suspended: true, suspendedReason: "Faux profil" },
    "10.0.0.2",
  );

  const data = calls.userUpdates[0]!.data;
  assert.equal(data.isActive, false);
  assert.ok(data.suspendedAt instanceof Date);
  assert.equal(data.suspendedReason, "Faux profil");
  assert.deepEqual(calls.providerUpdates, [{ where: { id: "provider_1" }, data: { hidden: true } }]);
  assert.equal(result.provider?.hidden, true);
  assert.equal(calls.logs.length, 1);
  assert.equal(calls.logs[0]!.client, tx);
  assert.equal(calls.logs[0]!.entry.action, "user.update");
  assert.equal(calls.logs[0]!.entry.ipAddress, "10.0.0.2");
  assert.equal(calls.logs[0]!.entry.metadata.providerHidden, true);
});

test("unsuspending clears the suspension but leaves the provider hidden", async () => {
  const { service, calls } = makeService([
    user({
      id: "provider_user",
      role: "PROVIDER",
      isActive: false,
      suspendedAt: now,
      suspendedReason: "Faux profil",
      provider: { id: "provider_1", displayName: "Plomberie Paul", hidden: true, verificationStatus: "VERIFIED" },
    }),
  ]);

  const result = await service.update(admin, "provider_user", { suspended: false });

  assert.deepEqual(calls.userUpdates[0]!.data, { isActive: true, suspendedAt: null, suspendedReason: null });
  assert.equal(calls.providerUpdates.length, 0);
  assert.equal(result.isActive, true);
  assert.equal(result.provider?.hidden, true);
});

test("cv assembles the member sheet with provider profile, activity and journal", async () => {
  const at = new Date("2026-09-01T10:00:00.000Z");
  const row = user({
    id: "provider_user",
    role: "PROVIDER",
    provider: { id: "provider_1", displayName: "Plomberie Paul", hidden: false, verificationStatus: "VERIFIED" },
  });
  const reportCounts: unknown[] = [];
  const prisma = {
    user: { findUnique: async () => ({ ...row, bio: "Bio", gender: null, birthdate: null, country: "RDC", roleSelectedAt: at, termsAcceptedAt: at }) },
    provider: {
      findUnique: async () => ({
        id: "provider_1",
        displayName: "Plomberie Paul",
        description: "Fuites",
        yearsExperience: 8,
        profilePhoto: null,
        phone: "+243810000002",
        whatsapp: null,
        email: null,
        addressLine: "Av. X",
        latitude: -4.3,
        longitude: 15.3,
        placeId: "gombe",
        freeSkills: ["Soudure"],
        pricingAmount: 20000,
        pricingCurrencyId: "cdf",
        pricingUnitId: "hour",
        youtubeUrl: null,
        instagramUrl: null,
        tiktokUrl: null,
        facebookUrl: null,
        timezone: "Africa/Kinshasa",
        isAvailable: true,
        verificationStatus: "VERIFIED",
        hidden: false,
        premiumTier: "BOOSTED",
        premiumUntil: new Date("2020-01-01T00:00:00.000Z"),
        ratingAvg: { valueOf: () => 4.5, toString: () => "4.5" },
        ratingCount: 2,
        completedJobs: 5,
        publishedAt: at,
        subcategory: {
          id: "sub_leaf",
          name: "Fuites",
          slug: "fuites",
          parent: null,
          category: { id: "cat", name: "Plomberie", slug: "plomberie" },
        },
        skills: [{ item: { id: "skill_1", label: "Soudure" } }],
        references: [
          { kind: "LANGUAGE", item: { id: "fr", label: "Français" } },
          { kind: "INTERVENTION_MODE", item: { id: "home", label: "À domicile" } },
        ],
        media: [],
        availabilityRules: [{ dayOfWeek: 1, startTime: "08:00", endTime: "12:00" }],
      }),
    },
    booking: {
      groupBy: async ({ where }: { where: Record<string, string> }) =>
        where.clientId
          ? [{ status: "COMPLETED", _count: { _all: 1 } }]
          : [
              { status: "PENDING", _count: { _all: 2 } },
              { status: "COMPLETED", _count: { _all: 5 } },
            ],
    },
    review: { count: async () => 1 },
    clientReview: { aggregate: async () => ({ _avg: { rating: 4 }, _count: { _all: 1 } }) },
    report: {
      count: async (args: unknown) => {
        reportCounts.push(args);
        return reportCounts.length;
      },
    },
    transaction: { aggregate: async () => ({ _sum: { netAmt: 45000 } }) },
    referenceItem: {
      findMany: async () => [
        { id: "cdf", type: "CURRENCY", label: "CDF", categoryId: null },
        { id: "hour", type: "PRICE_UNIT", label: "Par heure", categoryId: null },
      ],
    },
    activityLog: {
      findMany: async () => [
        {
          id: "log_1",
          action: "provider.update",
          entityType: "Provider",
          entityId: "provider_1",
          metadata: null,
          ipAddress: null,
          createdAt: at,
          user: { id: "admin_1", firstName: "Grace", lastName: null },
        },
      ],
    },
  };
  const places = {
    chains: async () =>
      new Map([["gombe", [{ id: "cd", kind: "COUNTRY", label: "RDC", parentId: null, hasChildren: true }]]]),
  };
  const service = new AdminUsersService(prisma as never, {} as never, places as never);

  const sheet = await service.cv("provider_user");

  assert.equal(sheet.user.placeChain.length, 1);
  assert.deepEqual(sheet.provider?.categoryChain.map((node) => node.id), ["cat", "sub_leaf"]);
  assert.deepEqual(sheet.provider?.languages, [{ id: "fr", label: "Français" }]);
  assert.equal(sheet.provider?.pricing?.unit?.label, "Par heure");
  assert.equal(sheet.provider?.ratingAvg, 4.5);
  assert.equal(sheet.provider?.effectivePremiumTier, "FREE");
  assert.equal(sheet.provider?.scheduleSummary[1]!.ranges.length, 1);
  assert.equal(sheet.activity.bookingsAsClient.COMPLETED, 1);
  assert.deepEqual(sheet.activity.bookingsAsProvider, { PENDING: 2, CONFIRMED: 0, COMPLETED: 5, CANCELLED: 0 });
  assert.deepEqual(sheet.activity.clientRating, { avg: 4, count: 1 });
  assert.equal(sheet.activity.earningsNet, 45000);
  assert.deepEqual((reportCounts[1] as { where: { OR: unknown[] } }).where.OR, [
    { targetKind: "USER", targetId: "provider_user" },
    { targetKind: "PROVIDER", targetId: "provider_1" },
  ]);
  assert.deepEqual(sheet.recentActivity[0]!.actor, { id: "admin_1", name: "Grace" });
});
