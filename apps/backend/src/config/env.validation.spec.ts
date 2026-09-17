import assert from "node:assert/strict";
import test from "node:test";
import { validateEnv } from "./env.validation";

const base = {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db?schema=public",
  SUPABASE_URL: "https://proj.supabase.co",
  SUPABASE_JWT_ISSUER: "https://proj.supabase.co/auth/v1/.well-known/jwks.json",
  SUPABASE_SERVICE_KEY: "service-key",
};

test("accepts a complete environment and applies defaults", () => {
  const parsed = validateEnv({ ...base });
  assert.equal(parsed.PORT, 3001);
  assert.equal(parsed.NODE_ENV, "development");
  assert.equal(parsed.DATABASE_URL, base.DATABASE_URL);
});

test("throws when a required secret is missing", () => {
  const { DATABASE_URL, ...withoutDb } = base;
  assert.throws(() => validateEnv(withoutDb), /DATABASE_URL/);
});

test("rejects an unconfigured Supabase placeholder", () => {
  assert.throws(
    () => validateEnv({ ...base, SUPABASE_URL: "https://<project-ref>.supabase.co" }),
    /SUPABASE_URL/,
  );
});

test("keeps public launch intake disabled by default", () => {
  const parsed = validateEnv({ ...base });
  assert.equal(parsed.LAUNCH_PUBLIC_INTAKE_ENABLED, "false");
  assert.equal(parsed.LAUNCH_FUNNEL_EVENTS_ENABLED, "false");
});

test("requires hashing configuration before funnel collection can be enabled", () => {
  assert.throws(
    () =>
      validateEnv({
        ...base,
        LAUNCH_FUNNEL_EVENTS_ENABLED: "true",
      }),
    /LAUNCH_RATE_LIMIT_HASH_KEY/,
  );

  const parsed = validateEnv({
    ...base,
    LAUNCH_FUNNEL_EVENTS_ENABLED: "true",
    LAUNCH_RATE_LIMIT_HASH_KEY: "a-32-character-minimum-test-key-value",
  });
  assert.equal(parsed.LAUNCH_FUNNEL_EVENTS_ENABLED, "true");
});

test("requires privacy and hashing configuration before public intake can be enabled", () => {
  assert.throws(
    () =>
      validateEnv({
        ...base,
        LAUNCH_PUBLIC_INTAKE_ENABLED: "true",
      }),
    /LAUNCH_PRIVACY_NOTICE_VERSION.*LAUNCH_RATE_LIMIT_HASH_KEY/,
  );

  const parsed = validateEnv({
    ...base,
    LAUNCH_PUBLIC_INTAKE_ENABLED: "true",
    LAUNCH_PRIVACY_NOTICE_VERSION: "privacy-v1",
    LAUNCH_RATE_LIMIT_HASH_KEY: "a-32-character-minimum-test-key-value",
  });
  assert.equal(parsed.LAUNCH_PUBLIC_INTAKE_ENABLED, "true");
});

test("defaults DIRECT_URL to DATABASE_URL and keeps an explicit value", () => {
  const parsed = validateEnv({ ...base });
  assert.equal(parsed.DIRECT_URL, base.DATABASE_URL);
  const direct = "postgresql://u:p@localhost:5432/direct?schema=public";
  assert.equal(validateEnv({ ...base, DIRECT_URL: direct }).DIRECT_URL, direct);
});

test("rejects the test-mode session hook in production and requires the seed password", () => {
  assert.throws(
    () => validateEnv({ ...base, NODE_ENV: "production", E2E_TEST_MODE: "true", E2E_SEED_PASSWORD: "x" }),
    /E2E_TEST_MODE: must never be enabled in production/,
  );
  assert.throws(() => validateEnv({ ...base, E2E_TEST_MODE: "true" }), /E2E_SEED_PASSWORD/);
  assert.equal(validateEnv({ ...base, E2E_TEST_MODE: "true", E2E_SEED_PASSWORD: "Password123!" }).E2E_TEST_MODE, "true");
  assert.equal(validateEnv({ ...base }).E2E_TEST_MODE, "false");
});
