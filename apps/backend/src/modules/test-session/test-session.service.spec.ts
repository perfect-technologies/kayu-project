import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException } from "@nestjs/common";
import { TestSessionService } from "./test-session.service";
import { testSessionModules } from "./test-session.module";

const session = (user: { id: string; email?: string; phone?: string }) => ({
  access_token: "access",
  refresh_token: "refresh",
  expires_at: 1_789_000_000,
  expires_in: 3600,
  token_type: "bearer",
  user,
});

function setup(options: { existingPhone?: string } = {}) {
  const calls: string[] = [];
  const auth = {
    signInWithPassword: async (credentials: { email?: string; phone?: string; password: string }) => {
      calls.push(`signIn:${credentials.email ?? credentials.phone}:${credentials.password}`);
      return { data: { session: session({ id: "u1", email: credentials.email, phone: credentials.phone }) }, error: null };
    },
    admin: {
      createUser: async (attrs: { phone?: string; password?: string }) => {
        calls.push(`create:${attrs.phone}`);
        if (attrs.phone === options.existingPhone) {
          return { data: { user: null }, error: { message: "Phone number already registered" } };
        }
        return { data: { user: { id: "new" } }, error: null };
      },
      listUsers: async () => ({
        data: { users: options.existingPhone ? [{ id: "old", phone: options.existingPhone.slice(1) }] : [] },
        error: null,
      }),
      updateUserById: async (id: string, attrs: { password?: string }) => {
        calls.push(`update:${id}:${attrs.password ? "pw" : ""}`);
        return { data: { user: { id } }, error: null };
      },
    },
  };
  const config = { get: (key: string) => (key === "E2E_SEED_PASSWORD" ? "Password123!" : undefined), getOrThrow: () => "x" };
  return { service: new TestSessionService(config as never, auth as never), calls };
}

test("email: signs the seeded demo user in with the seed password", async () => {
  const { service, calls } = setup();
  const result = await service.forEmail("paul.kabasele@email.cd");
  assert.equal(result.access_token, "access");
  assert.equal(result.user.email, "paul.kabasele@email.cd");
  assert.deepEqual(calls, ["signIn:paul.kabasele@email.cd:Password123!"]);
});

test("email: refuses addresses outside the demo domains", async () => {
  const { service, calls } = setup();
  await assert.rejects(() => service.forEmail("someone@gmail.com"), BadRequestException);
  assert.deepEqual(calls, []);
});

test("phone: creates a confirmed user with a random password and signs it in", async () => {
  const { service, calls } = setup();
  const result = await service.forPhone("+243990000001");
  assert.equal(result.user.phone, "+243990000001");
  assert.equal(calls[0], "create:+243990000001");
  assert.match(calls[1]!, /^signIn:\+243990000001:.{20,}$/);
});

test("phone: reuses an already registered user by rotating its password", async () => {
  const { service, calls } = setup({ existingPhone: "+243990000002" });
  await service.forPhone("+243990000002");
  assert.deepEqual(calls.map((c) => c.split(":").slice(0, 2).join(":")), [
    "create:+243990000002",
    "update:old",
    "signIn:+243990000002",
  ]);
});

test("module registration follows E2E_TEST_MODE and NODE_ENV", () => {
  assert.equal(testSessionModules({}).length, 0);
  assert.equal(testSessionModules({ E2E_TEST_MODE: "false", NODE_ENV: "development" }).length, 0);
  assert.equal(testSessionModules({ E2E_TEST_MODE: "true", NODE_ENV: "production" }).length, 0);
  assert.equal(testSessionModules({ E2E_TEST_MODE: "true", NODE_ENV: "development" }).length, 1);
  assert.equal(testSessionModules({ E2E_TEST_MODE: "true", NODE_ENV: "test" }).length, 1);
});
