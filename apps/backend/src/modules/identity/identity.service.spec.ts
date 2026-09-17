import assert from "node:assert/strict";
import test from "node:test";
import { ConflictException, HttpException } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { AccountService } from "./account.service";
import type { UserWithProvider } from "./identity.repository";
import { IdentityService } from "./identity.service";

const now = new Date("2026-09-16T10:00:00.000Z");

function makeUser(overrides: Partial<UserWithProvider> = {}): UserWithProvider {
  return {
    id: "user_1",
    authUserId: "auth_1",
    email: null,
    phone: "+243897123456",
    firstName: null,
    lastName: null,
    avatar: null,
    role: "CLIENT",
    roleSelectedAt: null,
    bio: null,
    gender: null,
    birthdate: null,
    placeId: null,
    country: "RDC",
    isActive: true,
    suspendedAt: null,
    suspendedReason: null,
    emailVerifiedAt: null,
    phoneVerifiedAt: null,
    lastLoginAt: now,
    termsAcceptedAt: null,
    createdAt: now,
    updatedAt: now,
    provider: null,
    ...overrides,
  };
}

function makeIdentity(user: UserWithProvider | null, options: { placeError?: boolean } = {}) {
  const calls: { created?: unknown; updates: Array<Record<string, unknown>>; placeChecks: string[] } = {
    updates: [],
    placeChecks: [],
  };
  let current = user;
  const repo = {
    findByAuthUserId: async () => current,
    findById: async () => current,
    createUser: async (params: Record<string, unknown>) => {
      calls.created = params;
      current = makeUser({ id: "user_new", authUserId: String(params.authUserId), phone: (params.phone as string) ?? null });
      return current;
    },
    update: async (_id: string, data: Record<string, unknown>) => {
      calls.updates.push(data);
      current = { ...(current as UserWithProvider), ...data } as UserWithProvider;
      return current;
    },
    findProviderPhoto: async () => null,
  };
  const places = {
    assertSelectable: async (id: string) => {
      calls.placeChecks.push(id);
      if (options.placeError) throw new HttpException({ code: "INVALID_REFERENCE" }, 400);
      return [];
    },
  };
  const storage = { objectFromUrl: () => null, removeObjects: async () => undefined };
  return { service: new IdentityService(repo as never, places as never, storage as never), calls };
}

const authUser = { authUserId: "auth_1", phone: "+243897123456", claims: {} };

test("GET /me provisions a missing local user from the Supabase claims", async () => {
  const { service, calls } = makeIdentity(null);
  const result = await service.getMe({ authUserId: "auth_new", phone: "+243810000123", claims: {} });
  assert.equal(result.success, true);
  assert.deepEqual(calls.created, { authUserId: "auth_new", email: undefined, phone: "+243810000123" });
  assert.equal(result.user.profileComplete, false);
  assert.equal(result.user.provider, null);
});

test("resolve syncs a changed phone and stamps lastLoginAt, but leaves an unchanged user alone", async () => {
  const unchanged = makeIdentity(makeUser());
  await unchanged.service.resolve(authUser);
  assert.equal(unchanged.calls.updates.length, 0);

  const changed = makeIdentity(makeUser());
  await changed.service.resolve({ ...authUser, phone: "+243810000999" });
  assert.equal(changed.calls.updates.length, 1);
  assert.equal(changed.calls.updates[0]!.phone, "+243810000999");
  assert.ok(changed.calls.updates[0]!.lastLoginAt instanceof Date);
});

test("GET /me refuses a suspended account with its reason", async () => {
  const { service } = makeIdentity(makeUser({ isActive: false, suspendedReason: "Fraude" }));
  await assert.rejects(
    () => service.getMe(authUser),
    (error: unknown) => {
      assert.ok(error instanceof HttpException);
      assert.equal(error.getStatus(), 403);
      assert.deepEqual(
        { code: (error.getResponse() as Record<string, unknown>).code, reason: (error.getResponse() as Record<string, unknown>).suspendedReason },
        { code: "ACCOUNT_SUSPENDED", reason: "Fraude" },
      );
      return true;
    },
  );
});

test("MeUser exposes only the provider summary and profileComplete", async () => {
  const provider = { id: "provider_1", hidden: false, verificationStatus: "VERIFIED" as const };
  const { service } = makeIdentity(makeUser({ firstName: "Paul", lastName: "K", provider }));
  const { user } = await service.getMe(authUser);
  assert.equal(user.profileComplete, true);
  assert.deepEqual(user.provider, provider);
});

test("PATCH /me/profile validates the place and maps birthdate to UTC midnight", async () => {
  const { service, calls } = makeIdentity(makeUser());
  const result = await service.updateProfile({ id: "user_1" } as Actor, {
    firstName: "Paul",
    placeId: "place_gombe",
    birthdate: "1990-05-04",
    bio: null,
  });
  assert.deepEqual(calls.placeChecks, ["place_gombe"]);
  assert.equal(calls.updates[0]!.placeId, "place_gombe");
  assert.equal((calls.updates[0]!.birthdate as Date).toISOString(), "1990-05-04T00:00:00.000Z");
  assert.equal(calls.updates[0]!.bio, null);
  assert.equal("lastName" in calls.updates[0]!, false);
  assert.equal(result.user.firstName, "Paul");

  const clearing = makeIdentity(makeUser({ placeId: "old" }));
  await clearing.service.updateProfile({ id: "user_1" } as Actor, { placeId: null });
  assert.deepEqual(clearing.calls.placeChecks, []);
  assert.equal(clearing.calls.updates[0]!.placeId, null);

  const invalid = makeIdentity(makeUser(), { placeError: true });
  await assert.rejects(() => invalid.service.updateProfile({ id: "user_1" } as Actor, { placeId: "inactive" }));
  assert.equal(invalid.calls.updates.length, 0);
});

test("accept-terms stamps once and is idempotent", async () => {
  const fresh = makeIdentity(makeUser());
  const first = await fresh.service.acceptTerms({ id: "user_1" } as Actor);
  assert.ok(first.user.termsAcceptedAt instanceof Date);
  assert.equal(fresh.calls.updates.length, 1);

  const accepted = makeIdentity(makeUser({ termsAcceptedAt: now }));
  const second = await accepted.service.acceptTerms({ id: "user_1" } as Actor);
  assert.equal(second.user.termsAcceptedAt, now);
  assert.equal(accepted.calls.updates.length, 0);
});

test("provisioning maps a unique violation to 409", async () => {
  const repo = {
    findByAuthUserId: async () => null,
    createUser: async () => {
      throw Object.assign(new Error("unique"), { code: "P2002" });
    },
  };
  const service = new IdentityService(repo as never, {} as never, {} as never);
  await assert.rejects(() => service.resolve(authUser), ConflictException);
});

type DeletionState = {
  log: string[];
  activity: Array<Record<string, unknown>>;
  removed: unknown[];
  authDeleted: string[];
};

function makeAccount(options: {
  role?: "CLIENT" | "PROVIDER" | "ADMIN";
  withProvider?: boolean;
  authError?: string;
} = {}) {
  const state: DeletionState = { log: [], activity: [], removed: [], authDeleted: [] };
  const record = (entry: string) => (args?: unknown) => {
    state.log.push(entry + (args ? ` ${JSON.stringify(args)}` : ""));
    return Promise.resolve({ count: 1 });
  };
  const provider = options.withProvider
    ? {
        id: "provider_own",
        profilePhoto: "https://cdn.example/storage/v1/object/public/provider-media/media/user_1/photo.jpg",
        media: [{ storagePath: "media/user_1/a.jpg" }, { storagePath: null }],
        verificationDocs: [{ storagePath: "verification/user_1/id.jpg" }],
      }
    : null;
  const tx = {
    $queryRaw: async (query: { values?: unknown[] }) => {
      state.log.push(`lock ${JSON.stringify(query.values ?? [])}`);
      return [];
    },
    user: {
      findUnique: async () => ({
        id: "user_1",
        role: options.role ?? "CLIENT",
        authUserId: "auth_1",
        avatar: "https://cdn.example/storage/v1/object/public/avatars/avatar/user_1/me.jpg",
        provider,
      }),
      delete: record("user.delete"),
    },
    review: {
      findMany: async () => [{ providerId: "provider_a" }, { providerId: "provider_own" }],
      deleteMany: record("review.deleteMany"),
      aggregate: async () => ({ _avg: { rating: 4 }, _count: { _all: 2 } }),
    },
    booking: {
      findMany: async () => [{ providerId: "provider_b" }, { providerId: "provider_a" }],
      deleteMany: record("booking.deleteMany"),
      count: async () => 3,
    },
    message: {
      findMany: async () => [
        { attachments: [{ kind: "image", path: "attachments/user_1/x.jpg", mime: "image/jpeg", bytes: 10 }] },
        { attachments: [] },
      ],
    },
    conversation: { deleteMany: record("conversation.deleteMany") },
    clientReview: { deleteMany: record("clientReview.deleteMany") },
    provider: {
      delete: record("provider.delete"),
      update: async (args: { where: { id: string } }) => {
        state.log.push(`aggregates ${args.where.id}`);
      },
    },
    activityLog: {},
  };
  const prisma = { $transaction: async <T>(cb: (client: typeof tx) => Promise<T>) => {
    const result = await cb(tx);
    state.log.push("commit");
    return result;
  } };
  const storage = {
    objectFromUrl: (url: string | null) => {
      if (!url) return null;
      const match = url.match(/public\/(avatars|provider-media)\/(.+)$/);
      if (!match) return null;
      return { purpose: match[1] === "avatars" ? "avatar" : "media", path: match[2] };
    },
    removeObjects: async (objects: unknown[]) => {
      state.log.push("storage.remove");
      state.removed.push(...objects);
    },
  };
  const activity = {
    log: async (entry: Record<string, unknown>) => {
      state.log.push(`activity ${entry.action}`);
      state.activity.push(entry);
    },
  };
  const supabase = {
    auth: {
      admin: {
        deleteUser: async (id: string) => {
          state.log.push("auth.delete");
          state.authDeleted.push(id);
          return { error: options.authError ? { message: options.authError } : null };
        },
      },
    },
  };
  const service = new AccountService(prisma as never, storage as never, activity as never, supabase as never);
  return { service, state };
}

test("DELETE /me refuses admins with 409 ADMIN_ACCOUNT", async () => {
  const { service, state } = makeAccount({ role: "ADMIN" });
  await assert.rejects(
    () => service.deleteAccount({ id: "user_1", role: "ADMIN" } as Actor),
    (error: unknown) => error instanceof HttpException && error.getStatus() === 409,
  );
  assert.deepEqual(state.log, []);
});

test("DELETE /me removes dependents before the provider and the user, then storage and auth after commit", async () => {
  const { service, state } = makeAccount({ role: "PROVIDER", withProvider: true });
  const result = await service.deleteAccount({ id: "user_1", role: "PROVIDER" } as Actor);
  assert.deepEqual(result, { ok: true });

  const order = state.log.map((line) => line.split(" ")[0]);
  const index = (entry: string) => order.indexOf(entry);
  assert.ok(index("lock") < index("conversation.deleteMany"));
  assert.ok(index("conversation.deleteMany") < index("booking.deleteMany"));
  assert.ok(index("clientReview.deleteMany") < index("booking.deleteMany"));
  assert.ok(index("review.deleteMany") < index("booking.deleteMany"));
  assert.ok(index("booking.deleteMany") < index("provider.delete"));
  assert.ok(index("provider.delete") < index("user.delete"));
  assert.ok(index("user.delete") < index("aggregates"));
  assert.ok(index("activity") < index("commit"));
  assert.ok(index("commit") < index("storage.remove"));
  assert.ok(index("storage.remove") < index("auth.delete"));

  const bookingDelete = state.log.find((line) => line.startsWith("booking.deleteMany"))!;
  assert.match(bookingDelete, /"clientId":"user_1"/);
  assert.match(bookingDelete, /"providerId":"provider_own"/);

  const locks = state.log.filter((line) => line.startsWith("lock"));
  assert.equal(locks.length, 2);
  assert.deepEqual(
    state.log.filter((line) => line.startsWith("aggregates")),
    ["aggregates provider_a", "aggregates provider_b"],
  );

  assert.deepEqual(state.removed, [
    { purpose: "avatar", path: "avatar/user_1/me.jpg" },
    { purpose: "media", path: "media/user_1/photo.jpg" },
    { purpose: "media", path: "media/user_1/a.jpg" },
    { purpose: "verification", path: "verification/user_1/id.jpg" },
    { purpose: "attachments", path: "attachments/user_1/x.jpg" },
  ]);
  assert.deepEqual(state.authDeleted, ["auth_1"]);
  assert.deepEqual(state.activity[0], {
    userId: null,
    action: "account.deleted",
    entityType: "User",
    entityId: "user_1",
    metadata: { role: "PROVIDER", hadProvider: true },
  });
});

test("DELETE /me for a client only scopes deletions to the client side", async () => {
  const { service, state } = makeAccount();
  await service.deleteAccount({ id: "user_1", role: "CLIENT" } as Actor);
  const conversationDelete = state.log.find((line) => line.startsWith("conversation.deleteMany"))!;
  assert.equal(conversationDelete.includes("providerId"), false);
  assert.equal(state.log.some((line) => line.startsWith("provider.delete")), false);
  assert.equal(state.log.filter((line) => line.startsWith("aggregates")).length, 3);
});

test("DELETE /me journals a Supabase auth failure without failing the request", async () => {
  const { service, state } = makeAccount({ authError: "network down" });
  const result = await service.deleteAccount({ id: "user_1", role: "CLIENT" } as Actor);
  assert.deepEqual(result, { ok: true });
  const failure = state.activity.find((entry) => entry.action === "auth.delete_failed");
  assert.equal(failure?.entityType, "auth");
  assert.deepEqual(failure?.metadata, { authUserId: "auth_1", error: "network down" });
});
