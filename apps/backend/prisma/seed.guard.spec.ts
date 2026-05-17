import assert from "node:assert/strict";
import test from "node:test";
import { assertSeedAllowed } from "./seed";

test("throws when NODE_ENV is production", () => {
  assert.throws(() => assertSeedAllowed("production"), /refusing to seed/i);
});

test("allows non-production environments", () => {
  assert.doesNotThrow(() => assertSeedAllowed("development"));
  assert.doesNotThrow(() => assertSeedAllowed(undefined));
});
