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
