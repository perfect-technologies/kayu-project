import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException, ConflictException } from "@nestjs/common";
import type { UserRole } from "@prisma/client";
import { IdentityService } from "./identity.service";
import type {
  IdentityRepository,
  ProviderOnboardingData,
  UserWithProvider,
} from "./identity.repository";

function makeUser(overrides: Partial<UserWithProvider> = {}): UserWithProvider {
  const now = new Date("2026-04-19T10:00:00.000Z");

  return {
    id: "user_1",
    authUserId: "auth_1",
    email: null,
    phone: "+243897123456",
    firstName: null,
    lastName: null,
    avatar: null,
    role: "CLIENT" as UserRole,
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
    onboardingStep: null,
    onboardingDraft: null,
    createdAt: now,
    updatedAt: now,
    provider: null,
    ...overrides,
  };
}

function makeService(
  user: UserWithProvider,
  options: { hasActivity?: boolean } = {},
) {
  const calls: Array<{ role: Exclude<UserRole, "ADMIN">; roleSelectedAt: Date }> = [];
  const repo = {
    findById: async () => user,
    setRole: async (
      _userId: string,
      role: Exclude<UserRole, "ADMIN">,
      roleSelectedAt: Date,
    ) => {
      calls.push({ role, roleSelectedAt });
      return { ...user, role, roleSelectedAt };
    },
    hasRoleBlockingActivity: async () => Boolean(options.hasActivity),
  } as unknown as IdentityRepository;

  return { service: new IdentityService(repo), calls };
}

function makeProviderProfile(data: ProviderOnboardingData) {
  return {
    id: "provider_1",
    userId: "user_1",
    profession: data.profession,
    description: data.description ?? null,
    experience: data.experience ?? null,
    hourlyRate: data.hourlyRate ?? null,
    videoUrl: null,
    totalReviews: 0,
    totalJobs: 0,
    responseTime: 0,
    isPremium: false,
    premiumExpiry: null,
    isAvailable: true,
    verificationStatus: "PENDING",
    onboardingCompleteAt: new Date("2026-04-20T10:00:00.000Z"),
    createdAt: new Date("2026-04-20T10:00:00.000Z"),
    updatedAt: new Date("2026-04-20T10:00:00.000Z"),
    user: makeUser({ role: "PROVIDER" }),
    categories: data.categoryIds.map((id) => ({
      category: { id, name: "Plomberie", slug: "plomberie" },
    })),
    subcategories: data.subcategoryIds.map((id, index) => ({
      subcategory: { id, name: "Depannage", slug: "depannage" },
      isPrimary: index === 0,
      experience: data.experience ?? null,
    })),
    skills: data.skills.map((name) => ({ name })),
    serviceZones: data.serviceZones,
    trustScore: { id: "trust_1", providerId: "provider_1", badges: [] },
  } as never;
}

test("fresh default client can explicitly select provider during signup", async () => {
  const user = makeUser();
  const { service, calls } = makeService(user);

  const result = await service.setRole(user, "PROVIDER");

  assert.equal(result.user.role, "PROVIDER");
  assert.ok(result.user.roleSelectedAt);
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.role, "PROVIDER");
});

test("fresh default client can explicitly select client during signup", async () => {
  const user = makeUser();
  const { service, calls } = makeService(user);

  const result = await service.setRole(user, "CLIENT");

  assert.equal(result.user.role, "CLIENT");
  assert.ok(result.user.roleSelectedAt);
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.role, "CLIENT");
});

test("returning client with completed profile keeps client role", async () => {
  const user = makeUser({
    firstName: "Paul",
    lastName: "Kabasele",
  });
  const { service } = makeService(user);

  await assert.rejects(
    () => service.setRole(user, "PROVIDER"),
    (error) => error instanceof ConflictException,
  );
});

test("explicitly selected client role cannot be changed to provider", async () => {
  const user = makeUser({
    roleSelectedAt: new Date("2026-04-18T10:00:00.000Z"),
  });
  const { service } = makeService(user);

  await assert.rejects(
    () => service.setRole(user, "PROVIDER"),
    (error) => error instanceof ConflictException,
  );
});

test("marketplace activity locks the existing default role", async () => {
  const user = makeUser();
  const { service } = makeService(user, { hasActivity: true });

  await assert.rejects(
    () => service.setRole(user, "PROVIDER"),
    (error) => error instanceof ConflictException,
  );
});

test("legacy provider onboarding rejects incomplete launch profile", async () => {
  const user = makeUser({ role: "PROVIDER", roleSelectedAt: new Date() });
  const repo = {
    findById: async () => user,
  } as unknown as IdentityRepository;
  const service = new IdentityService(repo);

  await assert.rejects(
    () =>
      service.providerOnboarding(user as never, {
        profession: "Plombier",
        categoryIds: [],
        subcategoryIds: [],
        skills: [],
        serviceZones: [],
        hourlyRate: 0,
      }),
    (error) => error instanceof BadRequestException,
  );
});

test("legacy provider onboarding publishes normalized launch-ready provider", async () => {
  const user = makeUser({ role: "PROVIDER", roleSelectedAt: new Date() });
  const calls: { data?: ProviderOnboardingData } = {};
  const repo = {
    findById: async () => user,
    countCategories: async (ids: string[]) => ids.length,
    countSubcategories: async (ids: string[]) => ids.length,
    createProviderProfile: async (
      _userId: string,
      data: ProviderOnboardingData,
    ) => {
      calls.data = data;
      return makeProviderProfile(data);
    },
  } as unknown as IdentityRepository;
  const service = new IdentityService(repo);

  const result = await service.providerOnboarding(user as never, {
    profession: "  Plombier certifié  ",
    categoryIds: ["cat_1", "cat_1"],
    skills: [" Fuites ", "Fuites", "Installation"],
    serviceZones: [
      { city: " Kinshasa ", commune: " Gombe " },
      { city: "Kinshasa", commune: "Gombe" },
    ],
    subcategoryIds: ["sub_1"],
    experience: 5,
    hourlyRate: 15000,
    description: "  Disponible pour les urgences.  ",
  });

  assert.equal(result.provider.profession, "Plombier certifié");
  assert.ok(result.provider.onboardingCompleteAt);
  assert.deepEqual(calls.data, {
    profession: "Plombier certifié",
    description: "Disponible pour les urgences.",
    experience: 5,
    hourlyRate: 15000,
    categoryIds: ["cat_1"],
    skills: ["Fuites", "Installation"],
    serviceZones: [{ city: "Kinshasa", commune: "Gombe" }],
    subcategoryIds: ["sub_1"],
  });
});
