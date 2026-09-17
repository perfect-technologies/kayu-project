import assert from "node:assert/strict";
import test from "node:test";
import { HttpException } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { recomputeProviderAggregates } from "./rating-aggregates";
import { ReviewsService } from "./reviews.service";

const client = { id: "client_1", role: "CLIENT", firstName: "Paul", lastName: "K" } as Actor;
const pro = { id: "pro_user_1", role: "PROVIDER" } as Actor;

type Row = Record<string, any>;

function rejectsWith(status: number, code: string) {
  return (error: unknown) => {
    assert.ok(error instanceof HttpException, String(error));
    assert.equal(error.getStatus(), status);
    assert.equal((error.getResponse() as { code: string }).code, code);
    return true;
  };
}

function setup(options: {
  featReviews?: boolean;
  booking?: Row | null;
  createError?: unknown;
  review?: Row | null;
  provider?: Row | null;
} = {}) {
  const calls = {
    reviews: [] as Row[],
    clientReviews: [] as Row[],
    aggregates: [] as Row[],
    notifications: [] as Array<{ params: Row; client: unknown }>,
    locks: 0,
    updates: [] as Row[],
    bookingFindMany: [] as Row[],
  };
  const now = new Date("2030-01-07T10:00:00.000Z");
  const tx = {
    $queryRaw: async () => {
      calls.locks += 1;
      return [];
    },
    review: {
      create: async (args: Row) => {
        if (options.createError) throw options.createError;
        calls.reviews.push(args);
        return { id: "review_1", reply: null, repliedAt: null, isPublic: true, createdAt: now, ...args.data };
      },
      aggregate: async () => ({ _avg: { rating: 4.333 }, _count: { _all: 3 } }),
    },
    clientReview: {
      create: async (args: Row) => {
        if (options.createError) throw options.createError;
        calls.clientReviews.push(args);
        return { id: "client_review_1", createdAt: now, ...args.data };
      },
    },
    booking: { count: async () => 7 },
    provider: {
      update: async (args: Row) => {
        calls.aggregates.push(args);
        return {};
      },
    },
  };
  const booking =
    options.booking === undefined
      ? {
          id: "booking_1",
          clientId: "client_1",
          providerId: "provider_1",
          status: "COMPLETED",
          provider: { userId: "pro_user_1" },
          review: null,
          clientReview: null,
        }
      : options.booking;
  const prisma = {
    $transaction: async (callback: (client: typeof tx) => unknown) => callback(tx),
    booking: {
      findUnique: async () => booking,
      findMany: async (args: Row) => {
        calls.bookingFindMany.push(args);
        return [];
      },
    },
    review: {
      findUnique: async () =>
        options.review === undefined ? { provider: { userId: "pro_user_1" } } : options.review,
      update: async (args: Row) => {
        calls.updates.push(args);
        return {
          id: "review_1",
          bookingId: "booking_1",
          providerId: "provider_1",
          clientId: "client_1",
          rating: 5,
          comment: null,
          isPublic: true,
          createdAt: now,
          ...args.data,
        };
      },
      findMany: async () => [
        {
          id: "review_1",
          bookingId: "booking_1",
          providerId: "provider_1",
          clientId: "client_1",
          rating: 5,
          comment: "Top",
          reply: null,
          repliedAt: null,
          isPublic: true,
          createdAt: now,
          provider: { id: "provider_1", displayName: "Plomberie", profilePhoto: null },
          booking: { id: "booking_1", scheduledAt: new Date("2030-01-07T07:00:00.000Z"), timezone: "Africa/Kinshasa" },
        },
      ],
    },
    provider: {
      findUnique: async () =>
        options.provider === undefined ? { id: "provider_1", displayName: "Plomberie" } : options.provider,
    },
    clientReview: {
      aggregate: async () => ({ _avg: { rating: 3.66 }, _count: { _all: 3 } }),
    },
  };
  const service = new ReviewsService(
    prisma as never,
    { getBoolean: async () => options.featReviews ?? true } as never,
    {
      create: async (params: Row, notificationClient: unknown) => {
        calls.notifications.push({ params, client: notificationClient });
      },
    } as never,
    { cards: async (records: Row[], side: string) => records.map((r) => ({ ...r, side })) } as never,
  );
  return { service, calls, tx };
}

test("create stores the review, recomputes aggregates and notifies the provider in one transaction", async () => {
  const { service, calls, tx } = setup();
  const review = await service.create(client, { bookingId: "booking_1", rating: 5, comment: "Très bien" });

  assert.equal(calls.locks, 1);
  assert.deepEqual(calls.reviews[0]!.data, {
    bookingId: "booking_1",
    clientId: "client_1",
    providerId: "provider_1",
    rating: 5,
    comment: "Très bien",
  });
  assert.deepEqual(calls.aggregates[0], {
    where: { id: "provider_1" },
    data: { ratingAvg: 4.3, ratingCount: 3, completedJobs: 7 },
  });
  assert.equal(calls.notifications[0]!.client, tx);
  assert.equal(calls.notifications[0]!.params.type, "NEW_REVIEW");
  assert.deepEqual(calls.notifications[0]!.params.data, { bookingId: "booking_1", reviewId: "review_1" });
  assert.equal(review.id, "review_1");
  assert.equal(review.rating, 5);
});

test("create enforces the feature flag, ownership, completion and one review per booking", async () => {
  await assert.rejects(
    () => setup({ featReviews: false }).service.create(client, { bookingId: "booking_1", rating: 5 }),
    rejectsWith(403, "FEATURE_DISABLED"),
  );
  await assert.rejects(
    () =>
      setup({ booking: { id: "booking_1", clientId: "someone", providerId: "provider_1", status: "COMPLETED", provider: { userId: "pro_user_1" }, review: null } })
        .service.create(client, { bookingId: "booking_1", rating: 5 }),
    rejectsWith(404, "NOT_FOUND"),
  );
  await assert.rejects(
    () =>
      setup({ booking: { id: "booking_1", clientId: "client_1", providerId: "provider_1", status: "CONFIRMED", provider: { userId: "pro_user_1" }, review: null } })
        .service.create(client, { bookingId: "booking_1", rating: 5 }),
    rejectsWith(409, "BOOKING_NOT_COMPLETED"),
  );
  await assert.rejects(
    () =>
      setup({ booking: { id: "booking_1", clientId: "client_1", providerId: "provider_1", status: "COMPLETED", provider: { userId: "pro_user_1" }, review: { id: "r" } } })
        .service.create(client, { bookingId: "booking_1", rating: 5 }),
    rejectsWith(409, "ALREADY_EXISTS"),
  );
  await assert.rejects(
    () =>
      setup({ createError: Object.assign(new Error("dup"), { code: "P2002" }) }).service.create(client, {
        bookingId: "booking_1",
        rating: 5,
      }),
    rejectsWith(409, "ALREADY_EXISTS"),
  );
});

test("aggregates only count public reviews", async () => {
  const where: Row[] = [];
  await recomputeProviderAggregates(
    {
      review: {
        aggregate: async (args: Row) => {
          where.push(args.where);
          return { _avg: { rating: null }, _count: { _all: 0 } };
        },
      },
      booking: { count: async () => 0 },
      provider: { update: async () => ({}) },
    } as never,
    "provider_1",
  );
  assert.deepEqual(where[0], { providerId: "provider_1", isPublic: true });
});

test("mine lists written reviews and completed bookings still to review", async () => {
  const { service, calls } = setup();
  const result = await service.mine(client);
  assert.equal(result.reviews[0]!.provider.displayName, "Plomberie");
  assert.deepEqual(result.reviews[0]!.booking.scheduledLocal, { date: "2030-01-07", time: "08:00" });
  assert.deepEqual(calls.bookingFindMany[0]!.where, {
    clientId: "client_1",
    status: "COMPLETED",
    review: { is: null },
  });
  assert.equal(calls.bookingFindMany[0]!.take, 100);
  assert.deepEqual(result.toReview, []);
});

test("reply is limited to the provider owner of the review", async () => {
  const { service, calls } = setup();
  const review = await service.reply(pro, "review_1", { reply: "Merci !" });
  assert.equal(review.reply, "Merci !");
  assert.ok(calls.updates[0]!.data.repliedAt instanceof Date);

  await assert.rejects(
    () => setup({ review: { provider: { userId: "other" } } }).service.reply(pro, "review_1", { reply: "x" }),
    rejectsWith(404, "NOT_FOUND"),
  );
  await assert.rejects(
    () => setup({ review: null }).service.reply(pro, "missing", { reply: "x" }),
    rejectsWith(404, "NOT_FOUND"),
  );
});

test("client review: provider's own completed booking, once, notifies the client", async () => {
  const { service, calls, tx } = setup();
  const review = await service.createClientReview(pro, { bookingId: "booking_1", rating: 4, comment: null });
  assert.equal(review.clientId, "client_1");
  assert.equal(calls.clientReviews[0]!.data.providerId, "provider_1");
  assert.equal(calls.notifications[0]!.params.type, "NEW_CLIENT_REVIEW");
  assert.equal(calls.notifications[0]!.params.userId, "client_1");
  assert.equal(calls.notifications[0]!.client, tx);

  await assert.rejects(
    () => setup({ provider: null }).service.createClientReview(pro, { bookingId: "booking_1", rating: 4 }),
    rejectsWith(404, "NOT_FOUND"),
  );
  await assert.rejects(
    () =>
      setup({ booking: { id: "booking_1", clientId: "client_1", providerId: "provider_2", status: "COMPLETED", clientReview: null } })
        .service.createClientReview(pro, { bookingId: "booking_1", rating: 4 }),
    rejectsWith(404, "NOT_FOUND"),
  );
  await assert.rejects(
    () =>
      setup({ booking: { id: "booking_1", clientId: "client_1", providerId: "provider_1", status: "PENDING", clientReview: null } })
        .service.createClientReview(pro, { bookingId: "booking_1", rating: 4 }),
    rejectsWith(409, "BOOKING_NOT_COMPLETED"),
  );
  await assert.rejects(
    () =>
      setup({ booking: { id: "booking_1", clientId: "client_1", providerId: "provider_1", status: "COMPLETED", clientReview: { id: "c" } } })
        .service.createClientReview(pro, { bookingId: "booking_1", rating: 4 }),
    rejectsWith(409, "ALREADY_EXISTS"),
  );
});

test("client summary rounds the average", async () => {
  const { service } = setup();
  assert.deepEqual(await service.clientSummary("client_1"), { clientId: "client_1", avg: 3.7, count: 3 });
});
