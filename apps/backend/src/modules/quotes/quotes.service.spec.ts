import assert from "node:assert/strict";
import test from "node:test";
import {
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { QuotesService } from "./quotes.service";

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

function makeQuote(overrides: Record<string, unknown> = {}) {
  return {
    id: "quote_1",
    jobRequestId: "request_1",
    providerId: "provider_1",
    clientId: "client_user_1",
    message: "Je peux intervenir demain matin.",
    validityDays: 7,
    startDateKind: "21/04/2026",
    discountPct: 0,
    subtotal: 75000,
    discountAmt: 0,
    total: 75000,
    commissionPct: 10,
    commissionAmt: 7500,
    payoutAmt: 67500,
    status: "SENT",
    sentAt: now,
    acceptedAt: null,
    declinedAt: null,
    expiresAt: new Date("2999-04-27T10:00:00.000Z"),
    bookingId: null,
    createdAt: now,
    updatedAt: now,
    lines: [
      {
        id: "line_1",
        quoteId: "quote_1",
        label: "Intervention",
        qty: 2,
        unit: "Heure",
        unitPrice: 30000,
        order: 0,
      },
      {
        id: "line_2",
        quoteId: "quote_1",
        label: "Déplacement",
        qty: 1,
        unit: "Forfait",
        unitPrice: 15000,
        order: 1,
      },
    ],
    jobRequest: {
      id: "request_1",
      service: "Réparer une fuite",
      address: "12 Avenue Kasa-Vubu",
      city: "Kinshasa",
      budget: 80000,
      status: "OPEN",
    },
    provider: {
      id: "provider_1",
      userId: "provider_user_1",
      profession: "Plombier",
      hourlyRate: 30000,
      isPremium: false,
      totalReviews: 3,
      totalJobs: 8,
      user: {
        id: "provider_user_1",
        firstName: "Pro",
        lastName: "User",
        avatar: null,
        city: "Kinshasa",
      },
    },
    client: {
      id: "client_user_1",
      firstName: "Client",
      lastName: "User",
      avatar: null,
      email: "client@example.com",
      phone: "+243897000002",
    },
    ...overrides,
  };
}

function makeBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: "booking_1",
    clientId: "client_user_1",
    providerId: "provider_1",
    title: "Réparer une fuite",
    description: "Je peux intervenir demain matin.",
    status: "CONFIRMED",
    address: "12 Avenue Kasa-Vubu",
    city: "Kinshasa",
    clientLatitude: null,
    clientLongitude: null,
    scheduledDate: new Date("2026-04-21T09:00:00.000Z"),
    duration: 120,
    price: 75000,
    clientNotes: null,
    providerNotes: null,
    paymentMethod: null,
    isPaid: false,
    paidAt: null,
    confirmedAt: now,
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    cancelReason: null,
    cancelledBy: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeServiceForAccept(quote = makeQuote()) {
  const calls: {
    bookingCreateData?: Record<string, unknown>;
    quoteUpdateData?: Record<string, unknown>;
    jobRequestUpdateData?: Record<string, unknown>;
    competitorUpdateMany?: Record<string, unknown>;
    notifications: unknown[];
  } = { notifications: [] };

  const tx = {
    quote: {
      findUnique: async () => quote,
      update: async ({ data }: { data: Record<string, unknown> }) => {
        calls.quoteUpdateData = data;
        return { ...quote, ...data, bookingId: "booking_1", updatedAt: now };
      },
      updateMany: async (input: Record<string, unknown>) => {
        calls.competitorUpdateMany = input;
        return { count: 2 };
      },
    },
    booking: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        calls.bookingCreateData = data;
        return makeBooking(data);
      },
    },
    jobRequest: {
      update: async ({ data }: { data: Record<string, unknown> }) => {
        calls.jobRequestUpdateData = data;
      },
    },
    provider: {
      findUnique: async () => ({ userId: "provider_user_1" }),
    },
  };

  const prisma = {
    $transaction: async <T>(callback: (client: typeof tx) => Promise<T>) =>
      callback(tx),
  };

  const notifications = {
    create: async (input: unknown) => {
      calls.notifications.push(input);
    },
  };

  return {
    service: new QuotesService(prisma as never, notifications as never),
    calls,
  };
}

test("client accepts a sent quote and a confirmed booking is created", async () => {
  const { service, calls } = makeServiceForAccept();

  const result = await service.accept(
    makeActor({ id: "client_user_1", role: "CLIENT" }),
    "quote_1",
  );

  assert.equal(result.quote.status, "ACCEPTED");
  assert.equal(result.quote.bookingId, "booking_1");
  assert.equal(result.booking.status, "CONFIRMED");
  assert.equal(result.booking.id, "booking_1");
  assert.equal(calls.bookingCreateData?.status, "CONFIRMED");
  assert.equal(calls.bookingCreateData?.duration, 120);
  assert.equal(calls.bookingCreateData?.price, 75000);
  const scheduled = calls.bookingCreateData?.scheduledDate as Date;
  assert.equal(scheduled.getFullYear(), 2026);
  assert.equal(scheduled.getMonth(), 3);
  assert.equal(scheduled.getDate(), 21);
  assert.equal(scheduled.getHours(), 9);
  assert.equal(calls.quoteUpdateData?.status, "ACCEPTED");
  assert.equal(calls.jobRequestUpdateData?.status, "MATCHED");
  assert.deepEqual(calls.competitorUpdateMany?.where, {
    jobRequestId: "request_1",
    id: { not: "quote_1" },
    status: "SENT",
  });
  assert.equal(calls.notifications.length, 1);
});

test("client cannot accept an expired quote and the quote is marked expired", async () => {
  const { service, calls } = makeServiceForAccept(
    makeQuote({ expiresAt: new Date("2026-04-19T10:00:00.000Z") }),
  );

  await assert.rejects(
    () =>
      service.accept(
        makeActor({ id: "client_user_1", role: "CLIENT" }),
        "quote_1",
      ),
    (error) => error instanceof BadRequestException,
  );

  assert.equal(calls.quoteUpdateData?.status, "EXPIRED");
  assert.equal(calls.bookingCreateData, undefined);
});

test("client declines a sent quote", async () => {
  const quote = makeQuote();
  const calls: { quoteUpdateData?: Record<string, unknown>; notifications: unknown[] } = {
    notifications: [],
  };
  const prisma = {
    quote: {
      findUnique: async () => quote,
    },
    $transaction: async <T>(callback: (client: unknown) => Promise<T>) =>
      callback({
        quote: {
          update: async ({ data }: { data: Record<string, unknown> }) => {
            calls.quoteUpdateData = data;
            return { ...quote, ...data, updatedAt: now };
          },
        },
        provider: {
          findUnique: async () => ({ userId: "provider_user_1" }),
        },
      }),
  };
  const notifications = {
    create: async (input: unknown) => {
      calls.notifications.push(input);
    },
  };
  const service = new QuotesService(prisma as never, notifications as never);

  const result = await service.decline(
    makeActor({ id: "client_user_1", role: "CLIENT" }),
    "quote_1",
  );

  assert.equal(result.quote.status, "DECLINED");
  assert.equal(calls.quoteUpdateData?.status, "DECLINED");
  assert.ok(calls.quoteUpdateData?.declinedAt instanceof Date);
  assert.equal(calls.notifications.length, 1);
});

test("provider cannot create a quote for an unmatched request", async () => {
  const prisma = {
    provider: {
      findUnique: async () => ({ id: "provider_1" }),
    },
    jobRequest: {
      findUnique: async () => ({
        clientId: "client_user_1",
        status: "OPEN",
        matches: [],
      }),
    },
  };
  const service = new QuotesService(prisma as never, {} as never);

  await assert.rejects(
    () =>
      service.create(makeActor(), {
        jobRequestId: "request_1",
        message: "Voici mon devis.",
        validityDays: 7,
        startDateKind: "tomorrow",
        discountPct: 0,
        lines: [
          {
            label: "Intervention",
            qty: 1,
            unit: "Forfait",
            unitPrice: 50000,
          },
        ],
      }),
    (error) => error instanceof ForbiddenException,
  );
});

test("provider cannot move a draft quote to another job request", async () => {
  const prisma = {
    provider: {
      findUnique: async () => ({ id: "provider_1" }),
    },
    quote: {
      findUnique: async () => {
        throw new Error("quote lookup should not run for invalid update input");
      },
    },
  };
  const service = new QuotesService(prisma as never, {} as never);

  await assert.rejects(
    () =>
      service.update(
        makeActor(),
        "quote_1",
        { jobRequestId: "request_2" } as never,
      ),
    (error) => error instanceof BadRequestException,
  );
});
