import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException, ConflictException } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { ReviewsService } from "./reviews.service";

const now = new Date("2026-04-22T10:00:00.000Z");

function makeActor(overrides: Partial<Actor> = {}): Actor {
  return {
    id: "client_user_1",
    authUserId: "auth_client_1",
    email: "client@example.com",
    phone: "+243810000001",
    firstName: "Client",
    lastName: "User",
    role: "CLIENT",
    isActive: true,
    ...overrides,
  } as Actor;
}

function makeBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: "booking_1",
    clientId: "client_user_1",
    providerId: "provider_1",
    status: "COMPLETED",
    title: "Depannage urgent",
    provider: {
      id: "provider_1",
      userId: "provider_user_1",
    },
    client: {
      id: "client_user_1",
      firstName: "Client",
      lastName: "User",
    },
    review: null,
    clientReview: null,
    ...overrides,
  };
}

function createService(booking: ReturnType<typeof makeBooking>) {
  const calls: {
    reviewCreateData?: Record<string, unknown>;
    clientReviewCreateData?: Record<string, unknown>;
    notifications: unknown[];
  } = {
    notifications: [],
  };

  const prisma = {
    booking: {
      findUnique: async () => booking,
    },
    $transaction: async <T>(
      callback: (tx: {
        review: {
          create: (input: { data: Record<string, unknown> }) => Promise<unknown>;
        };
        clientReview: {
          create: (input: { data: Record<string, unknown> }) => Promise<unknown>;
        };
      }) => Promise<T>,
    ) =>
      callback({
        review: {
          create: async ({ data }) => {
            calls.reviewCreateData = data;
            return {
              id: "review_1",
              bookingId: booking.id,
              clientId: booking.clientId,
              providerId: booking.providerId,
              punctuality: data.punctuality ?? null,
              quality: data.quality ?? null,
              communication: data.communication ?? null,
              value: data.value ?? null,
              professionalism: data.professionalism ?? null,
              overallScore: 4.6,
              satisfactionTags: data.satisfactionTags ?? null,
              comment: data.comment ?? null,
              reply: null,
              repliedAt: null,
              isPublic: data.isPublic ?? true,
              isEdited: false,
              createdAt: now,
              updatedAt: now,
              client: {
                id: booking.clientId,
                firstName: "Client",
                lastName: "User",
                avatar: null,
              },
              booking: {
                title: booking.title,
                service: null,
              },
            };
          },
        },
        clientReview: {
          create: async ({ data }) => {
            calls.clientReviewCreateData = data;
            return {
              id: "client_review_1",
              bookingId: booking.id,
              clientId: booking.clientId,
              providerId: booking.providerId,
              paymentTimeliness: data.paymentTimeliness ?? "ONTIME",
              communication: data.communication ?? null,
              respectfulness: data.respectfulness ?? null,
              tags: data.tags ?? null,
              comment: data.comment ?? null,
              isPublic: data.isPublic ?? true,
              createdAt: now,
              client: {
                id: booking.clientId,
                firstName: "Client",
                lastName: "User",
                avatar: null,
              },
              provider: {
                id: booking.providerId,
                user: {
                  id: "provider_user_1",
                  firstName: "Pro",
                  lastName: "User",
                  avatar: null,
                },
              },
            };
          },
        },
      }),
  };

  const notifications = {
    create: async (input: unknown) => {
      calls.notifications.push(input);
    },
  };

  const service = new ReviewsService(prisma as never, notifications as never);
  (service as unknown as { syncProviderMetrics: () => Promise<void> }).syncProviderMetrics =
    async () => {};
  (service as unknown as { syncClientMetrics: () => Promise<void> }).syncClientMetrics =
    async () => {};

  return { service, calls };
}

test("client review requires a completed booking", async () => {
  const { service } = createService(makeBooking({ status: "PENDING" }));

  await assert.rejects(
    () =>
      service.create(makeActor(), {
        bookingId: "booking_1",
        providerId: "provider_1",
        rating: 5,
        comment: "Tres bon travail",
        isPublic: true,
      }),
    (error) => error instanceof BadRequestException,
  );
});

test("client review stores structured satisfaction tags", async () => {
  const { service, calls } = createService(makeBooking());

  const result = await service.create(makeActor(), {
    bookingId: "booking_1",
    providerId: "provider_1",
    rating: 5,
    punctuality: 5,
    quality: 5,
    communication: 4,
    value: 4,
    professionalism: 5,
    satisfactionTags: ["Ponctuel", "Travail propre"],
    comment: "Tres bonne prestation",
    isPublic: true,
  });

  assert.deepEqual(calls.reviewCreateData?.satisfactionTags, [
    "Ponctuel",
    "Travail propre",
  ]);
  assert.equal(result.review.comment, "Tres bonne prestation");
  assert.equal(calls.notifications.length, 1);
});

test("provider can review a completed client booking only once", async () => {
  const providerActor = makeActor({
    id: "provider_user_1",
    authUserId: "auth_provider_1",
    email: "provider@example.com",
    firstName: "Pro",
    role: "PROVIDER",
  });
  const { service, calls } = createService(makeBooking());

  const result = await service.createClientReview(providerActor, {
    bookingId: "booking_1",
    clientId: "client_user_1",
    paymentRating: "ONTIME",
    communication: 4,
    respectfulness: 5,
    tags: ["Respectueux"],
    comment: "Client serieux",
    isPublic: true,
  });

  assert.equal(calls.clientReviewCreateData?.paymentTimeliness, "ONTIME");
  assert.deepEqual(calls.clientReviewCreateData?.tags, ["Respectueux"]);
  assert.equal(result.clientReview.rating, 4.5);
  assert.equal(calls.notifications.length, 1);

  const duplicate = createService(makeBooking({ clientReview: { id: "client_review_1" } }));
  await assert.rejects(
    () =>
      duplicate.service.createClientReview(providerActor, {
        bookingId: "booking_1",
        clientId: "client_user_1",
        paymentRating: "ONTIME",
        communication: 4,
        respectfulness: 5,
        tags: [],
        comment: "Encore",
        isPublic: true,
      }),
    (error) => error instanceof ConflictException,
  );
});

test("client reputation is recomputed from provider reviews", async () => {
  let updateData: Record<string, unknown> | undefined;

  const service = new ReviewsService({} as never, {} as never);
  await (
    service as unknown as {
      syncClientMetrics: (
        tx: {
          user: {
            findUnique: (input: unknown) => Promise<unknown>;
            update: (input: { data: Record<string, unknown> }) => Promise<void>;
          };
          clientReview: {
            aggregate: (input: unknown) => Promise<unknown>;
            findMany: (input: unknown) => Promise<unknown>;
          };
        },
        clientId: string,
      ) => Promise<void>;
    }
  ).syncClientMetrics(
    {
      user: {
        findUnique: async () => ({ id: "client_user_1" }),
        update: async ({ data }) => {
          updateData = data;
        },
      },
      clientReview: {
        aggregate: async () => ({
          _count: { _all: 5 },
          _avg: { communication: 4.5, respectfulness: 4.5 },
        }),
        findMany: async () => [
          { paymentTimeliness: "ONTIME" },
          { paymentTimeliness: "PREPAID" },
          { paymentTimeliness: "ONTIME" },
          { paymentTimeliness: "PREPAID" },
          { paymentTimeliness: "ONTIME" },
        ],
      },
    },
    "client_user_1",
  );

  assert.equal(updateData?.clientTrustLevel, "GOOD_CLIENT");
  assert.equal(updateData?.clientScore, 90.3);
});
