import assert from "node:assert/strict";
import test from "node:test";
import { HttpException } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { DashboardService } from "./dashboard.service";

type Row = Record<string, any>;

const pro = { id: "pro_user_1", role: "PROVIDER" } as Actor;
const client = { id: "client_1", role: "CLIENT" } as Actor;

test("provider dashboard aggregates metrics, lists and completed-per-day for the local week", async () => {
  const findMany: Row[] = [];
  const prisma = {
    provider: {
      findUnique: async () => ({
        id: "provider_1",
        displayName: "Plomberie Mukendi",
        profilePhoto: null,
        isAvailable: true,
        hidden: false,
        verificationStatus: "VERIFIED",
        premiumTier: "BOOSTED",
        ratingAvg: { valueOf: () => 4.2, toString: () => "4.2" },
        ratingCount: 5,
        completedJobs: 9,
        timezone: "Africa/Kinshasa",
      }),
    },
    booking: {
      groupBy: async () => [
        { status: "PENDING", _count: { _all: 2 } },
        { status: "COMPLETED", _count: { _all: 9 } },
        { status: "CANCELLED", _count: { _all: 1 } },
      ],
      findMany: async (args: Row) => {
        findMany.push(args);
        if (args.select) {
          return [
            { scheduledAt: new Date("2030-01-07T07:00:00.000Z") },
            { scheduledAt: new Date("2030-01-07T12:00:00.000Z") },
            { scheduledAt: new Date("2030-01-12T23:30:00.000Z") },
          ];
        }
        return [{ id: args.where.status === "PENDING" ? "pending_1" : "done_1" }];
      },
    },
  };
  const view = { cards: async (records: Row[], side: string) => records.map((r) => ({ ...r, side })) };
  const service = new DashboardService(prisma as never, view as never);

  const result = await service.provider(pro, new Date("2030-01-09T12:00:00.000Z"));

  assert.deepEqual(result.provider, {
    id: "provider_1",
    displayName: "Plomberie Mukendi",
    profilePhoto: null,
    isAvailable: true,
    hidden: false,
    verificationStatus: "VERIFIED",
    premiumTier: "BOOSTED",
    ratingAvg: 4.2,
    ratingCount: 5,
    completedJobs: 9,
  });
  assert.deepEqual(result.metrics, {
    pending: 2,
    completed: 9,
    ratingAvg: 4.2,
    ratingCount: 5,
    acceptanceRate: 75,
  });
  assert.deepEqual(result.pendingBookings, [{ id: "pending_1", side: "provider" }]);
  assert.deepEqual(result.history, [{ id: "done_1", side: "provider" }]);
  assert.deepEqual(findMany[0]!.orderBy[0], { scheduledAt: "asc" });
  assert.equal(findMany[0]!.take, 20);
  assert.deepEqual(findMany[1]!.where.status, { not: "PENDING" });
  assert.deepEqual(result.weekCompletedByDay, [2, 0, 0, 0, 0, 0, 1]);
});

test("provider dashboard without a provider profile is 404", async () => {
  const service = new DashboardService({ provider: { findUnique: async () => null } } as never, {} as never);
  await assert.rejects(
    () => service.provider(pro),
    (error: unknown) => error instanceof HttpException && error.getStatus() === 404,
  );
});

test("client dashboard counts bookings per status, rating and unread messages", async () => {
  const prisma = {
    booking: {
      groupBy: async (args: Row) => {
        assert.deepEqual(args.where, { clientId: "client_1" });
        return [
          { status: "CONFIRMED", _count: { _all: 1 } },
          { status: "COMPLETED", _count: { _all: 4 } },
        ];
      },
    },
    clientReview: { aggregate: async () => ({ _avg: { rating: 4.75 }, _count: { _all: 4 } }) },
    conversation: {
      aggregate: async (args: Row) => {
        assert.deepEqual(args.where, { clientId: "client_1" });
        return { _sum: { clientUnread: 3 } };
      },
    },
  };
  const service = new DashboardService(prisma as never, {} as never);
  assert.deepEqual(await service.client(client), {
    bookingsByStatus: { PENDING: 0, CONFIRMED: 1, COMPLETED: 4, CANCELLED: 0 },
    clientRating: { avg: 4.8, count: 4 },
    unreadMessages: 3,
  });
});
