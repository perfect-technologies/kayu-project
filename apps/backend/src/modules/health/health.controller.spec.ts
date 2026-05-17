import assert from "node:assert/strict";
import test from "node:test";
import { ServiceUnavailableException } from "@nestjs/common";
import { HealthController } from "./health.controller";

test("returns ok when the database responds", async () => {
  const prisma = { $queryRaw: async () => [{ "?column?": 1 }] };
  const controller = new HealthController(prisma as never);
  const result = await controller.health();
  assert.equal(result.status, "ok");
  assert.equal(typeof result.uptime, "number");
});

test("throws 503 when the database is unreachable", async () => {
  const prisma = {
    $queryRaw: async () => {
      throw new Error("connection refused");
    },
  };
  const controller = new HealthController(prisma as never);
  await assert.rejects(() => controller.health(), ServiceUnavailableException);
});
