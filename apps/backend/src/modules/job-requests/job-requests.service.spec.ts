import assert from "node:assert/strict";
import test from "node:test";
import type { Actor } from "../../common/auth/types";
import { JobRequestsService } from "./job-requests.service";

const now = new Date("2026-04-20T10:00:00.000Z");

function makeActor(overrides: Partial<Actor> = {}): Actor {
  return {
    id: "provider_user_1",
    authUserId: "auth_provider_1",
    email: "provider@example.com",
    phone: "+243897000001",
    firstName: "Pro",
    lastName: "User",
    role: "PROVIDER",
    isActive: true,
    ...overrides,
  } as Actor;
}

function makeMatch(overrides: Record<string, unknown> = {}) {
  return {
    id: "match_1",
    jobRequestId: "request_1",
    providerId: "provider_1",
    matchScore: 92,
    notifiedAt: now,
    dismissedAt: null,
    viewedAt: null,
    jobRequest: {
      id: "request_1",
      clientId: "client_1",
      client: {
        id: "client_1",
        firstName: "Client",
        lastName: "User",
        avatar: null,
        clientScore: 0,
      },
      category: {
        id: "cat_1",
        name: "Plomberie",
        slug: "plomberie",
        icon: "wrench",
        color: "#0EA5E9",
      },
      subcategoryId: null,
      service: "Réparer une fuite",
      description: "Fuite sous évier à réparer rapidement.",
      address: "Boulevard du 30 Juin",
      city: "Kinshasa",
      commune: "Gombe",
      latitude: -4.315,
      longitude: 15.305,
      whenPref: "Aujourd'hui",
      estimatedHours: 2,
      budget: 50000,
      photoCount: 0,
      status: "OPEN",
      urgent: true,
      competingCount: 3,
      expiresAt: null,
      createdAt: now,
      updatedAt: now,
    },
    ...overrides,
  };
}

function makeService() {
  const calls: { findManyArgs?: unknown } = {};
  const prisma = {
    provider: {
      findUnique: async () => ({
        id: "provider_1",
        user: {
          latitude: -4.322,
          longitude: 15.312,
        },
      }),
    },
    jobRequestMatch: {
      findMany: async (args: unknown) => {
        calls.findManyArgs = args;
        return [makeMatch()];
      },
    },
    booking: {
      count: async () => 2,
    },
    clientReview: {
      aggregate: async () => ({
        _avg: {
          communication: 4,
          respectfulness: 5,
        },
      }),
    },
  };

  return {
    service: new JobRequestsService(prisma as never, {} as never),
    calls,
  };
}

test("provider inbox filters already quoted requests and returns distance", async () => {
  const { service, calls } = makeService();

  const result = await service.inbox(makeActor());

  assert.equal(result.success, true);
  assert.equal(result.requests.length, 1);
  assert.equal(result.requests[0]?.id, "request_1");
  assert.equal(result.requests[0]?.distanceKm, 1.1);
  assert.equal(result.requests[0]?.client.rating, 4.5);
  assert.deepEqual(
    (calls.findManyArgs as {
      where: {
        jobRequest: {
          quotes: {
            none: {
              providerId: string;
              status: { in: string[] };
            };
          };
        };
      };
    }).where.jobRequest.quotes.none,
    {
      providerId: "provider_1",
      status: { in: ["SENT", "ACCEPTED"] },
    },
  );
});
