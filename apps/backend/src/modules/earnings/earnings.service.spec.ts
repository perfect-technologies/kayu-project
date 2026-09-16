import assert from "node:assert/strict";
import test from "node:test";
import { HttpException } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { acceptanceRate, countsByStatus, currentWeek } from "./provider-metrics";
import { EarningsService } from "./earnings.service";

const pro = { id: "pro_user_1", role: "PROVIDER" } as Actor;

type Row = Record<string, any>;

test("the week starts Monday 00:00 in the provider timezone, not in UTC", () => {
  const sundayLateUtc = new Date("2030-01-06T23:30:00.000Z");
  const kinshasa = currentWeek("Africa/Kinshasa", sundayLateUtc);
  assert.equal(kinshasa.monday, "2030-01-07");
  assert.equal(kinshasa.start.toISOString(), "2030-01-06T23:00:00.000Z");
  assert.equal(kinshasa.end.toISOString(), "2030-01-13T23:00:00.000Z");

  const utcWouldSay = currentWeek("UTC", sundayLateUtc);
  assert.equal(utcWouldSay.monday, "2029-12-31");
});

test("acceptance rate is null without bookings and counts confirmed + completed", () => {
  assert.equal(acceptanceRate(countsByStatus([])), null);
  assert.equal(
    acceptanceRate(
      countsByStatus([
        { status: "CONFIRMED", _count: { _all: 1 } },
        { status: "COMPLETED", _count: { _all: 2 } },
        { status: "CANCELLED", _count: { _all: 2 } },
        { status: "PENDING", _count: { _all: 1 } },
      ] as never),
    ),
    50,
  );
});

function setup(options: { provider?: Row | null; weekRows?: Row[]; groups?: Row[] } = {}) {
  const calls: Row = {};
  const prisma = {
    provider: {
      findUnique: async () =>
        options.provider === undefined
          ? { id: "provider_1", timezone: "Africa/Kinshasa", ratingAvg: { toString: () => "4.5", valueOf: () => 4.5 }, ratingCount: 12 }
          : options.provider,
    },
    transaction: {
      aggregate: async (args: Row) => {
        calls.aggregate = args;
        return { _sum: { netAmt: 90_000 } };
      },
      findMany: async (args: Row) => {
        calls.findMany = args;
        return options.weekRows ?? [];
      },
      count: async () => 1,
    },
    booking: {
      groupBy: async () => options.groups ?? [],
      count: async (args: Row) => {
        calls.completedCount = args;
        return 2;
      },
    },
  };
  return { service: new EarningsService(prisma as never), calls, prisma };
}

test("summary sums net amounts per local weekday and reports week metrics", async () => {
  const now = new Date("2030-01-09T12:00:00.000Z");
  const { service, calls } = setup({
    weekRows: [
      { netAmt: 10_000, occurredAt: new Date("2030-01-06T23:30:00.000Z") },
      { netAmt: 5_000, occurredAt: new Date("2030-01-09T09:00:00.000Z") },
      { netAmt: 2_500, occurredAt: new Date("2030-01-09T23:30:00.000Z") },
    ],
    groups: [
      { status: "COMPLETED", _count: { _all: 3 } },
      { status: "CANCELLED", _count: { _all: 1 } },
    ],
  });

  const summary = await service.summary(pro, now);

  assert.deepEqual(summary.byDay, [10_000, 0, 5_000, 2_500, 0, 0, 0]);
  assert.equal(summary.thisWeek, 17_500);
  assert.equal(summary.total, 90_000);
  assert.equal(summary.completedThisWeek, 2);
  assert.equal(summary.acceptanceRate, 75);
  assert.equal(summary.ratingAvg, 4.5);
  assert.equal(summary.ratingCount, 12);
  assert.equal(summary.currency, "CDF");
  assert.deepEqual(calls.aggregate.where.type, { in: ["EARNING", "BONUS"] });
  assert.equal(calls.findMany.where.occurredAt.gte.toISOString(), "2030-01-06T23:00:00.000Z");
  assert.equal(calls.completedCount.where.status, "COMPLETED");
});

test("summary with no activity returns zeros and a null acceptance rate", async () => {
  const { service } = setup();
  const summary = await service.summary(pro, new Date("2030-01-09T12:00:00.000Z"));
  assert.equal(summary.acceptanceRate, null);
  assert.deepEqual(summary.byDay, [0, 0, 0, 0, 0, 0, 0]);
});

test("transactions map the booking label and a provider without profile gets 404", async () => {
  const prisma = {
    provider: { findUnique: async () => ({ id: "provider_1", timezone: "Africa/Kinshasa", ratingAvg: 0, ratingCount: 0 }) },
    transaction: {
      count: async () => 2,
      findMany: async () => [
        {
          id: "tx_1",
          type: "EARNING",
          amount: 50_000,
          feeAmt: 5_000,
          netAmt: 45_000,
          status: "COMPLETED",
          note: null,
          occurredAt: new Date("2030-01-07T10:00:00.000Z"),
          booking: {
            id: "booking_1",
            scheduledAt: new Date("2030-01-07T07:00:00.000Z"),
            timezone: "Africa/Kinshasa",
            client: { firstName: "Paul", lastName: "Kabasele" },
            subcategory: { name: "Fuites" },
          },
        },
        { id: "tx_2", type: "BONUS", amount: 1_000, feeAmt: 0, netAmt: 1_000, status: "COMPLETED", note: "Parrainage", occurredAt: new Date(), booking: null },
      ],
    },
  };
  const page = await new EarningsService(prisma as never).transactions(pro, { page: 1, limit: 20 });
  assert.equal(page.total, 2);
  assert.deepEqual(page.items[0]!.booking, {
    id: "booking_1",
    scheduledAt: new Date("2030-01-07T07:00:00.000Z"),
    scheduledLocal: { date: "2030-01-07", time: "08:00" },
    clientName: "Paul Kabasele",
    categoryLabel: "Fuites",
  });
  assert.equal(page.items[1]!.booking, null);

  await assert.rejects(
    () => setup({ provider: null }).service.summary(pro),
    (error: unknown) => error instanceof HttpException && error.getStatus() === 404,
  );
});
