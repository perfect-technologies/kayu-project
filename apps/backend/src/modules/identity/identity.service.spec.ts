import assert from "node:assert/strict";
import test from "node:test";
import { ConflictException } from "@nestjs/common";
import type { UserRole } from "@prisma/client";
import { IdentityService } from "./identity.service";
import type {
  IdentityRepository,
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
