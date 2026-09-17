import assert from "node:assert/strict";
import test from "node:test";
import { HttpException } from "@nestjs/common";
import { RateLimiterService } from "./rate-limiter.service";

test("allows up to the limit inside a window, then 429 with retryAfter, then resets", () => {
  const limiter = new RateLimiterService();
  let now = 1_000_000;
  limiter.now = () => now;

  limiter.consume("contact", "1.2.3.4", 2, 60_000);
  limiter.consume("contact", "1.2.3.4", 2, 60_000);
  assert.throws(
    () => limiter.consume("contact", "1.2.3.4", 2, 60_000),
    (error: unknown) => {
      assert.ok(error instanceof HttpException);
      assert.equal(error.getStatus(), 429);
      const body = error.getResponse() as { code: string; retryAfter: number };
      assert.equal(body.code, "RATE_LIMITED");
      assert.equal(body.retryAfter, 60);
      return true;
    },
  );

  limiter.consume("reports", "1.2.3.4", 2, 60_000);

  now += 60_000;
  limiter.consume("contact", "1.2.3.4", 2, 60_000);
});
