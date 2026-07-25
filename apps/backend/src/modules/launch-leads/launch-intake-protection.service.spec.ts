import assert from "node:assert/strict";
import test from "node:test";
import { ConfigService } from "@nestjs/config";
import {
  LaunchIntakeProtectionService,
  LaunchRateLimitException,
} from "./launch-intake-protection.service";
import { LaunchRateLimitFilter } from "./launch-rate-limit.filter";

function makeProtection(overrides: Record<string, unknown> = {}) {
  const values: Record<string, unknown> = {
    LAUNCH_PUBLIC_INTAKE_ENABLED: "true",
    LAUNCH_RATE_LIMIT_HASH_KEY: "a-32-character-minimum-test-key-value",
    LAUNCH_INTAKE_IP_LIMIT: 2,
    LAUNCH_INTAKE_CONTACT_LIMIT: 2,
    LAUNCH_INTAKE_RATE_WINDOW_SECONDS: 900,
    LAUNCH_INTAKE_MAX_BODY_BYTES: 1_024,
    LAUNCH_INTAKE_RATE_BUCKET_CAPACITY: 100,
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

  protection.checkContact("+243810203040");
  protection.checkContact("+243810203040");
  assert.throws(
    () => protection.checkContact("+243810203040"),
    /Trop de demandes/,
  );
});

test("hashes request identifiers deterministically without retaining raw values", () => {
  const protection = makeProtection();
  const first = protection.hashIdentifier("+243810203040");
  const second = protection.hashIdentifier("+243810203040");
  assert.equal(first, second);
  assert.notEqual(first, "+243810203040");
  assert.equal(first?.length, 64);

  protection.checkContact("+243810203040");
  const buckets = (
    protection as unknown as { buckets: Map<string, unknown> }
  ).buckets;
  assert.equal(
    [...buckets.keys()].some((key) => key.includes("+243810203040")),
    false,
  );
});

test("expires buckets on every consume and enforces a hard cardinality cap", () => {
  const protection = makeProtection({
    LAUNCH_INTAKE_RATE_BUCKET_CAPACITY: 2,
  });
  let now = 0;
  (protection as unknown as { now: () => number }).now = () => now;

  protection.checkContact("+243810203040");
  protection.checkContact("+243820304050");
  assert.throws(
    () => protection.checkContact("+243830405060"),
    (error: LaunchRateLimitException) => error.retryAfterSeconds === 900,
  );

  const buckets = (
    protection as unknown as { buckets: Map<string, unknown> }
  ).buckets;
  assert.equal(buckets.size, 2);

  now = 901_000;
  protection.checkContact("+243840506070");
  assert.equal(buckets.size, 1);
});

test("rate-limit responses expose the remaining window through Retry-After", () => {
  const protection = makeProtection();
  let now = 0;
  (protection as unknown as { now: () => number }).now = () => now;
  protection.checkContact("+243810203040");
  protection.checkContact("+243810203040");
  now = 100_000;

  let exception: LaunchRateLimitException | undefined;
  try {
    protection.checkContact("+243810203040");
  } catch (error) {
    exception = error as LaunchRateLimitException;
  }
  assert.ok(exception instanceof LaunchRateLimitException);
  assert.equal(exception.retryAfterSeconds, 800);

  const headers: Record<string, string> = {};
  let status: number | undefined;
  let body: unknown;
  const response = {
    setHeader: (name: string, value: string) => {
      headers[name] = value;
    },
    status: (value: number) => {
      status = value;
      return {
        json: (valueBody: unknown) => {
          body = valueBody;
        },
      };
    },
  };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
    }),
  };

  new LaunchRateLimitFilter().catch(exception, host as never);
  assert.equal(headers["Retry-After"], "800");
  assert.equal(status, 429);
  assert.deepEqual(body, {
    statusCode: 429,
    message: "Trop de demandes. Veuillez réessayer plus tard.",
  });
});
