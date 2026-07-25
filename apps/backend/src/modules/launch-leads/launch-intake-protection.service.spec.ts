import assert from "node:assert/strict";
import test from "node:test";
import { ConfigService } from "@nestjs/config";
import { LaunchIntakeProtectionService } from "./launch-intake-protection.service";

function makeProtection(overrides: Record<string, unknown> = {}) {
  const values: Record<string, unknown> = {
    LAUNCH_PUBLIC_INTAKE_ENABLED: "true",
    LAUNCH_RATE_LIMIT_HASH_KEY: "a-32-character-minimum-test-key-value",
    LAUNCH_INTAKE_IP_LIMIT: 2,
    LAUNCH_INTAKE_CONTACT_LIMIT: 2,
    LAUNCH_INTAKE_RATE_WINDOW_SECONDS: 900,
    LAUNCH_INTAKE_MAX_BODY_BYTES: 1_024,
    ...overrides,
  };
  const config = {
    get: (key: string) => values[key],
  } as ConfigService;
  return new LaunchIntakeProtectionService(config);
}

test("kill switch blocks public intake independently", () => {
  const protection = makeProtection({
    LAUNCH_PUBLIC_INTAKE_ENABLED: "false",
  });
  assert.throws(
    () => protection.checkRequest({ ip: "203.0.113.1", body: {} }),
    /temporairement indisponible/,
  );
});

test("rejects oversized parsed bodies and content-length declarations", () => {
  const protection = makeProtection();
  assert.throws(
    () =>
      protection.checkRequest({
        ip: "203.0.113.1",
        body: { summary: "x".repeat(2_000) },
      }),
    /trop volumineux/,
  );
  assert.throws(
    () =>
      protection.checkRequest({
        ip: "203.0.113.2",
        body: {},
        headers: { "content-length": "2048" },
      }),
    /trop volumineux/,
  );
});

test("enforces separate per-IP and per-normalized-contact limits", () => {
  const protection = makeProtection();
  protection.checkRequest({ ip: "203.0.113.1", body: {} });
  protection.checkRequest({ ip: "203.0.113.1", body: {} });
  assert.throws(
    () => protection.checkRequest({ ip: "203.0.113.1", body: {} }),
    /Trop de demandes/,
  );

  protection.checkContact("+243998765432");
  protection.checkContact("+243998765432");
  assert.throws(
    () => protection.checkContact("+243998765432"),
    /Trop de demandes/,
  );
});

test("hashes request identifiers deterministically without retaining raw values", () => {
  const protection = makeProtection();
  const first = protection.hashIdentifier("+243998765432");
  const second = protection.hashIdentifier("+243998765432");
  assert.equal(first, second);
  assert.notEqual(first, "+243998765432");
  assert.equal(first?.length, 64);
});
