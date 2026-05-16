import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { OnboardingService } from "./onboarding.service";

const now = new Date("2026-04-20T10:00:00.000Z");

function makeActor(overrides: Partial<Actor> = {}): Actor {
  return {
    id: "user_1",
    authUserId: "auth_1",
    email: "pro@example.com",
    phone: "+243897123456",
    firstName: "Jean",
    lastName: "Mubake",
    role: "PROVIDER",
    isActive: true,
    ...overrides,
  } as Actor;
}

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user_1",
    authUserId: "auth_1",
    email: "pro@example.com",
    phone: "+243897123456",
    firstName: "Jean",
    lastName: "Mubake",
    avatar: "placeholder://avatar",
    role: "PROVIDER",
    roleSelectedAt: null,
    city: null,
    country: "RDC",
    address: null,
    latitude: null,
    longitude: null,
    isVerified: false,
    emailVerifiedAt: null,
    phoneVerifiedAt: null,
    isActive: true,
    lastLoginAt: now,
    clientScore: 0,
    clientTrustLevel: "NEW_CLIENT",
    onboardingStep: 5,
    onboardingDraft: {
      primaryCategoryId: "cat_1",
      subcategoryIds: ["sub_1"],
      idFrontUploaded: true,
      idBackUploaded: true,
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeProvider(overrides: Record<string, unknown> = {}) {
  return {
    id: "provider_1",
    userId: "user_1",
    profession: "Plombier certifié",
    description: "Disponible pour les urgences et installations sanitaires.",
    experience: 5,
    hourlyRate: 15000,
    onboardingCompleteAt: null,
    categories: [{ categoryId: "cat_1" }],
    skills: [{ name: "Fuites", level: 3 }],
    serviceZones: [{ city: " Kinshasa ", commune: " Gombe " }],
    subcategories: [],
    ...overrides,
  };
}

function hasMissingField(
  error: unknown,
  field: string,
): error is BadRequestException {
  if (!(error instanceof BadRequestException)) return false;
  const response = error.getResponse();
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    return false;
  }

  const missing = (response as { missing?: unknown }).missing;
  return Array.isArray(missing) && missing.includes(field);
}

test("provider publish materializes launch fields, trust score, and subcategory mapping", async () => {
  const provider = makeProvider();
  const calls: Record<string, unknown> = {};

  const tx = {
    provider: {
      update: async (args: unknown) => {
        calls.providerUpdate = args;
        return { id: provider.id };
      },
      create: async (args: unknown) => {
        calls.providerCreate = args;
        return { id: provider.id };
      },
    },
    providerCategory: {
      deleteMany: async (args: unknown) => {
        calls.providerCategoryDeleteMany = args;
      },
      createMany: async (args: unknown) => {
        calls.providerCategoryCreateMany = args;
      },
    },
    skill: {
      deleteMany: async (args: unknown) => {
        calls.skillDeleteMany = args;
      },
      createMany: async (args: unknown) => {
        calls.skillCreateMany = args;
      },
    },
    serviceZone: {
      deleteMany: async (args: unknown) => {
        calls.serviceZoneDeleteMany = args;
      },
      createMany: async (args: unknown) => {
        calls.serviceZoneCreateMany = args;
      },
    },
    subcategory: {
      findMany: async (args: unknown) => {
        calls.subcategoryFindMany = args;
        return [{ id: "sub_1", order: 0 }];
      },
    },
    providerSubcategory: {
      deleteMany: async (args: unknown) => {
        calls.providerSubcategoryDeleteMany = args;
      },
      createMany: async (args: unknown) => {
        calls.providerSubcategoryCreateMany = args;
      },
    },
    trustScore: {
      upsert: async (args: unknown) => {
        calls.trustScoreUpsert = args;
      },
    },
    user: {
      update: async (args: unknown) => {
        calls.userUpdate = args;
      },
    },
  };

  const prisma = {
    user: {
      findUnique: async () => ({
        ...makeUser(),
        provider,
      }),
    },
    category: {
      findFirst: async () => ({ id: "cat_1", name: "Plomberie" }),
    },
    $transaction: async (callback: (client: typeof tx) => Promise<void>) =>
      callback(tx),
    provider: {
      findUniqueOrThrow: async () => ({ id: provider.id }),
    },
  };
  const providers = {
    findById: async () => ({
      success: true,
      id: provider.id,
      trustScore: { id: "trust_1", providerId: provider.id },
      categories: [{ id: "cat_1" }],
      serviceZones: [{ city: "Kinshasa", commune: "Gombe" }],
      hasAccess: true,
      accessDeniedReason: null,
    }),
  };

  const service = new OnboardingService(prisma as never, providers as never);
  const result = await service.publish(makeActor());

  assert.equal(result.success, true);
  assert.deepEqual((calls.providerUpdate as { data: Record<string, unknown> }).data, {
    profession: "Plombier certifié",
    description: "Disponible pour les urgences et installations sanitaires.",
    experience: 5,
    hourlyRate: 15000,
    languages: [],
    verificationStatus: "PENDING",
    onboardingCompleteAt: (calls.providerUpdate as { data: { onboardingCompleteAt: Date } }).data.onboardingCompleteAt,
  });
  assert.ok(
    (calls.providerUpdate as { data: { onboardingCompleteAt: unknown } }).data
      .onboardingCompleteAt instanceof Date,
  );
  assert.deepEqual(calls.providerCategoryCreateMany, {
    data: [{ providerId: provider.id, categoryId: "cat_1" }],
    skipDuplicates: true,
  });
  assert.deepEqual(calls.serviceZoneCreateMany, {
    data: [{ providerId: provider.id, city: "Kinshasa", commune: "Gombe" }],
  });
  assert.deepEqual(calls.providerSubcategoryCreateMany, {
    data: [
      {
        providerId: provider.id,
        subcategoryId: "sub_1",
        isPrimary: true,
        experience: 5,
      },
    ],
  });
  assert.deepEqual(calls.trustScoreUpsert, {
    where: { providerId: provider.id },
    create: { providerId: provider.id },
    update: {},
  });
  assert.equal(
    (calls.userUpdate as { data: { role: string; avatar: string | null } }).data
      .role,
    "PROVIDER",
  );
  assert.equal(
    (calls.userUpdate as { data: { role: string; avatar: string | null } }).data
      .avatar,
    null,
  );
  assert.equal(
    (calls.userUpdate as { data: { phone: string } }).data.phone,
    "+243897123456",
  );
});

test("provider publish rejects inactive categories that discovery would hide", async () => {
  let transactionRan = false;
  const prisma = {
    user: {
      findUnique: async () => ({
        ...makeUser(),
        provider: makeProvider(),
      }),
    },
    category: {
      findFirst: async () => null,
    },
    $transaction: async () => {
      transactionRan = true;
    },
  };

  const service = new OnboardingService(prisma as never, {} as never);

  await assert.rejects(
    () => service.publish(makeActor()),
    (error) => hasMissingField(error, "primaryCategoryId"),
  );
  assert.equal(transactionRan, false);
});

test("provider publish rejects zones that normalize to nothing", async () => {
  let transactionRan = false;
  const prisma = {
    user: {
      findUnique: async () => ({
        ...makeUser(),
        provider: makeProvider({
          serviceZones: [{ city: "   ", commune: " Gombe " }],
        }),
      }),
    },
    category: {
      findFirst: async () => ({ id: "cat_1", name: "Plomberie" }),
    },
    $transaction: async () => {
      transactionRan = true;
    },
  };

  const service = new OnboardingService(prisma as never, {} as never);

  await assert.rejects(
    () => service.publish(makeActor()),
    (error) => hasMissingField(error, "serviceZones"),
  );
  assert.equal(transactionRan, false);
});

test("provider publish rejects malformed phone values", async () => {
  let transactionRan = false;
  const prisma = {
    user: {
      findUnique: async () => ({
        ...makeUser({ phone: "   " }),
        provider: makeProvider(),
      }),
    },
    category: {
      findFirst: async () => ({ id: "cat_1", name: "Plomberie" }),
    },
    $transaction: async () => {
      transactionRan = true;
    },
  };

  const service = new OnboardingService(prisma as never, {} as never);

  await assert.rejects(
    () => service.publish(makeActor()),
    (error) => hasMissingField(error, "phone"),
  );
  assert.equal(transactionRan, false);
});

test("provider publish requires explicit years of experience", async () => {
  let transactionRan = false;
  const prisma = {
    user: {
      findUnique: async () => ({
        ...makeUser(),
        provider: makeProvider({ experience: null }),
      }),
    },
    category: {
      findFirst: async () => ({ id: "cat_1", name: "Plomberie" }),
    },
    $transaction: async () => {
      transactionRan = true;
    },
  };

  const service = new OnboardingService(prisma as never, {} as never);

  await assert.rejects(
    () => service.publish(makeActor()),
    (error) => hasMissingField(error, "yearsOfExperience"),
  );
  assert.equal(transactionRan, false);
});

test("patchDraft no longer persists removed overflow keys", async () => {
  const calls: Record<string, unknown> = {};
  const prisma = {
    user: {
      findUnique: async () => ({
        ...makeUser({ onboardingDraft: { bio: "legacy bio", categoryIds: ["cat_1"] } }),
        provider: null,
      }),
      update: async (args: unknown) => {
        calls.userUpdate = args;
      },
    },
    $transaction: async (cb: (tx: unknown) => Promise<void>) =>
      cb({
        user: { update: async (args: unknown) => { calls.userUpdate = args; } },
      }),
  };
  const service = new OnboardingService(prisma as never, {} as never);

  await service.patchDraft(makeActor(), {
    idFrontUploaded: true,
    zoneRadiusKm: 12,
    firstName: "Jean",
  } as never);

  const data = (calls.userUpdate as { data?: { onboardingDraft?: unknown } } | undefined)?.data;
  const draftJson = JSON.stringify(data?.onboardingDraft ?? {});
  assert.equal(draftJson.includes("idFrontUploaded"), false);
  assert.equal(draftJson.includes("zoneRadiusKm"), false);
  assert.equal(draftJson.includes("legacy bio"), false);
});
