import assert from "node:assert/strict";
import test from "node:test";
import { DashboardService } from "./dashboard.service";

function makeClientActor(overrides: Record<string, unknown> = {}) {
  return {
    id: "client_1",
    email: "client@example.com",
    firstName: "Alain",
    lastName: "Mukendi",
    role: "CLIENT",
    isActive: true,
    ...overrides,
  };
}

type PrismaCalls = Record<string, unknown[]>;

function makePrisma(stub: Record<string, Record<string, unknown>>) {
  const calls: PrismaCalls = {};
  const handler: ProxyHandler<object> = {
    get(_target, modelName: string) {
      const model = stub[modelName];
      if (!model) {
        throw new Error(`prisma.${modelName} not stubbed`);
      }
      return new Proxy(model, {
        get(_t, method: string) {
          return async (args: unknown) => {
            calls[`${modelName}.${method}`] = [
              ...(calls[`${modelName}.${method}`] ?? []),
              args,
            ];
            const fn = model[method];
            if (typeof fn !== "function") {
              throw new Error(`prisma.${modelName}.${method} not stubbed`);
            }
            return (fn as (a: unknown) => unknown)(args);
          };
        },
      });
    },
  };
  const prisma = new Proxy({}, handler);
  return { prisma, calls };
}

test("getClientDashboard for a brand new client returns empty arrays and hasAnyBookingEver=false", async () => {
  const { prisma } = makePrisma({
    booking: {
      count: async () => 0,
      findMany: async () => [],
      groupBy: async () => [],
    },
    favorite: {
      count: async () => 0,
      findMany: async () => [],
    },
    notification: {
      findMany: async () => [],
    },
    review: {
      count: async () => 0,
      findMany: async () => [],
      groupBy: async () => [],
    },
    certification: {
      groupBy: async () => [],
    },
    conversation: {
      findMany: async () => [],
    },
    provider: {
      findMany: async () => [],
    },
  });

  const jobRequests = { getActiveCount: async () => 0 } as never;
  const service = new DashboardService(prisma as never, jobRequests);

  const result = await service.getClientDashboard(makeClientActor() as never);

  assert.equal(result.hasAnyBookingEver, false);
  assert.deepEqual(result.upcoming, []);
  assert.deepEqual(result.completed, []);
  assert.deepEqual(result.providers, []);
  assert.deepEqual(result.todos, { reviews: [], unreadMessages: [] });
});

test("upcoming includes PENDING bookings with hasOffer=false when no FinalOffer is attached", async () => {
  const scheduled = new Date("2026-05-20T14:00:00.000Z");
  const { prisma } = makePrisma({
    booking: {
      count: async () => 1,
      findMany: async (args: { where?: { status?: { in?: string[] } } }) => {
        if (args?.where?.status?.in?.includes("PENDING")) {
          return [
            {
              id: "booking_pending_1",
              status: "PENDING",
              title: "Plomberie",
              scheduledDate: scheduled,
              duration: 120,
              price: 50000,
              commune: "Limete",
              finalOffers: [],
              provider: {
                id: "provider_1",
                profession: "Plombier",
                user: {
                  id: "user_1",
                  firstName: "Jean",
                  lastName: "Pinda",
                  avatar: null,
                  isVerified: true,
                },
              },
            },
          ];
        }
        return [];
      },
      groupBy: async () => [],
    },
    favorite: { count: async () => 0, findMany: async () => [] },
    notification: { findMany: async () => [] },
    review: {
      count: async () => 0,
      findMany: async () => [],
      groupBy: async () => [],
    },
    certification: { groupBy: async () => [] },
    conversation: { findMany: async () => [] },
    provider: { findMany: async () => [] },
  });
  const service = new DashboardService(prisma as never, { getActiveCount: async () => 0 } as never);

  const result = await service.getClientDashboard(makeClientActor() as never);

  assert.equal(result.hasAnyBookingEver, true);
  assert.equal(result.upcoming.length, 1);
  assert.equal(result.upcoming[0].status, "PENDING");
  assert.equal(result.upcoming[0].hasOffer, false);
  assert.equal(result.upcoming[0].ref, "DING_1");
});

test("upcoming sets hasOffer=true when a FinalOffer row is attached", async () => {
  const scheduled = new Date("2026-05-15T14:00:00.000Z");
  const { prisma } = makePrisma({
    booking: {
      count: async () => 1,
      findMany: async (args: { where?: { status?: { in?: string[] } } }) => {
        if (args?.where?.status?.in?.includes("PENDING")) {
          return [
            {
              id: "booking_conf_1",
              status: "CONFIRMED",
              title: "Coiffure",
              scheduledDate: scheduled,
              duration: 120,
              price: 35000,
              commune: "Gombe",
              finalOffers: [{ id: "offer_1", acceptedAt: new Date() }],
              provider: {
                id: "provider_2",
                profession: "Coiffeuse",
                user: {
                  id: "user_2",
                  firstName: "Marie",
                  lastName: "Kalonga",
                  avatar: null,
                  isVerified: true,
                },
              },
            },
          ];
        }
        return [];
      },
      groupBy: async () => [],
    },
    favorite: { count: async () => 0, findMany: async () => [] },
    notification: { findMany: async () => [] },
    review: { count: async () => 0, findMany: async () => [], groupBy: async () => [] },
    certification: { groupBy: async () => [] },
    conversation: { findMany: async () => [] },
    provider: { findMany: async () => [] },
  });
  const service = new DashboardService(prisma as never, { getActiveCount: async () => 0 } as never);

  const result = await service.getClientDashboard(makeClientActor() as never);

  assert.equal(result.upcoming.length, 1);
  assert.equal(result.upcoming[0].hasOffer, true);
});

test("completed bookings carry hasReview/reviewScore based on Review rows", async () => {
  const completed = [
    { id: "b_a", completedAt: new Date("2026-05-09T12:00:00Z"), title: "Ménage", price: 25000, provider: { id: "p_a", user: { firstName: "Sarah", lastName: "Mbuyi" } } },
    { id: "b_b", completedAt: new Date("2026-05-02T12:00:00Z"), title: "Coiffure", price: 35000, provider: { id: "p_b", user: { firstName: "Marie", lastName: "Kalonga" } } },
    { id: "b_c", completedAt: new Date("2026-04-28T12:00:00Z"), title: "Plomberie", price: 50000, provider: { id: "p_c", user: { firstName: "Jean", lastName: "Pinda" } } },
  ];
  const { prisma } = makePrisma({
    booking: {
      count: async () => 3,
      findMany: async (args: { where?: { status?: string | { in?: string[] } } }) => {
        if (args?.where?.status === "COMPLETED") {
          return completed.map((b) => ({ ...b, provider: { ...b.provider, profession: "X", user: { ...b.provider.user, id: "u_" + b.id, avatar: null, isVerified: true } } }));
        }
        return [];
      },
      groupBy: async () => [],
    },
    favorite: { count: async () => 0, findMany: async () => [] },
    notification: { findMany: async () => [] },
    review: {
      count: async () => 1,
      findMany: async () => [
        { bookingId: "b_b", overallScore: 5 },
      ],
      groupBy: async () => [],
    },
    certification: { groupBy: async () => [] },
    conversation: { findMany: async () => [] },
    provider: { findMany: async () => [] },
  });
  const service = new DashboardService(prisma as never, { getActiveCount: async () => 0 } as never);

  const result = await service.getClientDashboard(makeClientActor() as never);

  assert.equal(result.completed.length, 3);
  const byId = Object.fromEntries(result.completed.map((b) => [b.id, b]));
  assert.equal(byId["b_a"].hasReview, false);
  assert.equal(byId["b_a"].reviewScore, null);
  assert.equal(byId["b_b"].hasReview, true);
  assert.equal(byId["b_b"].reviewScore, 5);
  assert.equal(byId["b_c"].hasReview, false);

  assert.equal(result.todos.reviews.length, 2);
  const todoIds = result.todos.reviews.map((r) => r.bookingId).sort();
  assert.deepEqual(todoIds, ["b_a", "b_c"]);
});

test("providers list shows favorites first then most-booked-not-favorited, capped at 4", async () => {
  const { prisma } = makePrisma({
    booking: {
      count: async () => 5,
      findMany: async () => [],
      groupBy: async () => [
        { providerId: "p_fav_1", _count: { providerId: 3 } },
        { providerId: "p_booked_only_1", _count: { providerId: 5 } },
        { providerId: "p_booked_only_2", _count: { providerId: 2 } },
        { providerId: "p_booked_only_3", _count: { providerId: 1 } },
      ],
    },
    favorite: {
      count: async () => 1,
      findMany: async () => [
        {
          providerId: "p_fav_1",
          createdAt: new Date("2026-05-01T10:00:00Z"),
          provider: {
            id: "p_fav_1",
            userId: "u_fav_1",
            profession: "Coiffeuse",
            description: null,
            experience: null,
            hourlyRate: null,
            videoUrl: null,
            totalReviews: 0,
            totalJobs: 0,
            responseTime: null,
            isPremium: false,
            premiumExpiry: null,
            isAvailable: true,
            verificationStatus: "PENDING",
            createdAt: new Date(),
            updatedAt: new Date(),
            user: {
              id: "u_fav_1",
              firstName: "Marie",
              lastName: "K",
              avatar: null,
              city: null,
              country: null,
              latitude: null,
              longitude: null,
              email: "marie@example.com",
              phone: null,
              isVerified: true,
            },
            categories: [],
            serviceZones: [],
          },
        },
      ],
    },
    notification: { findMany: async () => [] },
    review: { count: async () => 0, findMany: async () => [], groupBy: async () => [] },
    certification: { groupBy: async () => [] },
    conversation: { findMany: async () => [] },
    provider: {
      findMany: async () => [
        { id: "p_fav_1", profession: "Coiffeuse", user: { id: "u_fav_1", firstName: "Marie", lastName: "K", avatar: null, isVerified: true } },
        { id: "p_booked_only_1", profession: "Ménagère", user: { id: "u_bo1", firstName: "Sarah", lastName: "M", avatar: null, isVerified: true } },
        { id: "p_booked_only_2", profession: "Plombier", user: { id: "u_bo2", firstName: "Jean", lastName: "P", avatar: null, isVerified: true } },
        { id: "p_booked_only_3", profession: "Électricien", user: { id: "u_bo3", firstName: "Paul", lastName: "L", avatar: null, isVerified: true } },
      ],
    },
  });
  const service = new DashboardService(prisma as never, { getActiveCount: async () => 0 } as never);

  const result = await service.getClientDashboard(makeClientActor() as never);

  assert.equal(result.providers.length, 4);
  assert.equal(result.providers[0].id, "p_fav_1");
  assert.equal(result.providers[0].isFavorite, true);
  assert.equal(result.providers[0].bookingCount, 3);
  assert.equal(result.providers[1].id, "p_booked_only_1");
  assert.equal(result.providers[1].isFavorite, false);
  assert.equal(result.providers[1].bookingCount, 5);
  assert.equal(result.providers[2].id, "p_booked_only_2");
  assert.equal(result.providers[3].id, "p_booked_only_3");
});

test("todos.unreadMessages includes conversations with inbound unread messages and skips outbound-last conversations", async () => {
  const { prisma } = makePrisma({
    booking: { count: async () => 0, findMany: async () => [], groupBy: async () => [] },
    favorite: { count: async () => 0, findMany: async () => [] },
    notification: { findMany: async () => [] },
    review: { count: async () => 0, findMany: async () => [], groupBy: async () => [] },
    certification: { groupBy: async () => [] },
    provider: { findMany: async () => [] },
    conversation: {
      findMany: async () => [
        {
          id: "conv_unread",
          user1Id: "client_1",
          user2Id: "provider_user_a",
          lastMessageAt: new Date("2026-05-13T10:00:00Z"),
          user1: { id: "client_1", firstName: "Alain", lastName: "M" },
          user2: { id: "provider_user_a", firstName: "Marie", lastName: "Kalonga" },
          messages: [
            { id: "m1", senderId: "provider_user_a", content: "Bonjour, je confirme demain à 14h.", createdAt: new Date("2026-05-13T10:00:00Z") },
          ],
          _count: { messages: 3 },
        },
        {
          id: "conv_outbound_last",
          user1Id: "client_1",
          user2Id: "provider_user_b",
          lastMessageAt: new Date("2026-05-12T09:00:00Z"),
          user1: { id: "client_1", firstName: "Alain", lastName: "M" },
          user2: { id: "provider_user_b", firstName: "Sarah", lastName: "Mbuyi" },
          messages: [
            { id: "m2", senderId: "client_1", content: "Merci!", createdAt: new Date("2026-05-12T09:00:00Z") },
          ],
          _count: { messages: 1 },
        },
        {
          id: "conv_no_unread",
          user1Id: "client_1",
          user2Id: "provider_user_c",
          lastMessageAt: new Date("2026-05-10T09:00:00Z"),
          user1: { id: "client_1", firstName: "Alain", lastName: "M" },
          user2: { id: "provider_user_c", firstName: "Jean", lastName: "Pinda" },
          messages: [
            { id: "m3", senderId: "provider_user_c", content: "Lu!", createdAt: new Date("2026-05-10T09:00:00Z") },
          ],
          _count: { messages: 0 },
        },
      ],
    },
  });
  const service = new DashboardService(prisma as never, { getActiveCount: async () => 0 } as never);

  const result = await service.getClientDashboard(makeClientActor() as never);

  assert.equal(result.todos.unreadMessages.length, 1);
  assert.equal(result.todos.unreadMessages[0].conversationId, "conv_unread");
  assert.equal(result.todos.unreadMessages[0].unreadCount, 3);
  assert.equal(result.todos.unreadMessages[0].provider.firstName, "Marie");
  assert.equal(result.todos.unreadMessages[0].lastMessagePreview, "Bonjour, je confirme demain à 14h.");
});

test("getClientDashboard throws ForbiddenException when actor is not a client", async () => {
  const { prisma } = makePrisma({});
  const service = new DashboardService(prisma as never, { getActiveCount: async () => 0 } as never);

  await assert.rejects(
    () => service.getClientDashboard(makeClientActor({ role: "PROVIDER" }) as never),
    /Only clients/,
  );
});
