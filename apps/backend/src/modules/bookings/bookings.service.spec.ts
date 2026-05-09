import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { BookingsService } from "./bookings.service";

const now = new Date("2026-04-19T10:00:00.000Z");

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

function makeBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: "booking_1",
    clientId: "client_user_1",
    providerId: "provider_1",
    serviceId: null,
    title: "Dépannage urgent",
    description: null,
    status: "PENDING",
    address: "Gombe",
    city: "Kinshasa",
    clientLatitude: null,
    clientLongitude: null,
    scheduledDate: now,
    duration: 120,
    price: 50000,
    clientNotes: null,
    providerNotes: null,
    paymentMethod: null,
    isPaid: false,
    paidAt: null,
    confirmedAt: null,
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    cancelReason: null,
    cancelledBy: null,
    createdAt: now,
    updatedAt: now,
    client: {
      id: "client_user_1",
      firstName: "Client",
      lastName: "User",
      avatar: null,
      isVerified: false,
    },
    provider: {
      id: "provider_1",
      userId: "provider_user_1",
      profession: "Plombier",
      user: {
        id: "provider_user_1",
        firstName: "Pro",
        lastName: "User",
        avatar: null,
        isVerified: true,
      },
    },
    service: null,
    review: null,
    ...overrides,
  };
}

function makeFinalOffer(overrides: Record<string, unknown> = {}) {
  return {
    id: "final_offer_1",
    providerId: "provider_1",
    clientId: "client_user_1",
    conversationId: "conversation_1",
    bookingId: null,
    title: "Réparer une fuite",
    description: "Remplacement du joint et test.",
    price: 65000,
    duration: 90,
    scheduledDate: now,
    address: "12 Avenue Kasa-Vubu",
    city: "Kinshasa",
    notes: "Paiement en espèces à la fin.",
    paymentMethod: "cash",
    status: "PENDING",
    sentAt: now,
    acceptedAt: null,
    declinedAt: null,
    cancelledAt: null,
    expiresAt: null,
    createdAt: now,
    updatedAt: now,
    client: {
      id: "client_user_1",
      firstName: "Client",
      lastName: "User",
      avatar: null,
      isVerified: false,
    },
    provider: {
      id: "provider_1",
      userId: "provider_user_1",
      profession: "Plombier",
      user: {
        id: "provider_user_1",
        firstName: "Pro",
        lastName: "User",
        avatar: null,
        isVerified: true,
      },
    },
    booking: null,
    ...overrides,
  };
}

function makeService(
  booking: ReturnType<typeof makeBooking>,
  options: { existingEarningTransactionId?: string } = {},
) {
  const calls: {
    updateData?: Record<string, unknown>;
    providerUpdates: unknown[];
    createdTransactions: unknown[];
    updatedTransactions: unknown[];
    notifications: unknown[];
  } = {
    providerUpdates: [],
    createdTransactions: [],
    updatedTransactions: [],
    notifications: [],
  };

  const tx = {
    provider: {
      update: async (input: unknown) => {
        calls.providerUpdates.push(input);
      },
    },
    booking: {
      update: async ({ data }: { data: Record<string, unknown> }) => {
        calls.updateData = data;
        return {
          ...booking,
          ...data,
          updatedAt: now,
        };
      },
    },
    transaction: {
      create: async (input: unknown) => {
        calls.createdTransactions.push(input);
      },
      findFirst: async () => {
        if (!options.existingEarningTransactionId) {
          return null;
        }
        return { id: options.existingEarningTransactionId };
      },
      update: async (input: unknown) => {
        calls.updatedTransactions.push(input);
      },
    },
  };

  const prisma = {
    booking: {
      findUnique: async () => booking,
    },
    $transaction: async <T>(callback: (client: typeof tx) => Promise<T>) =>
      callback(tx),
  };

  const notifications = {
    create: async (input: unknown) => {
      calls.notifications.push(input);
    },
  };

  return {
    service: new BookingsService(prisma as never, notifications as never),
    calls,
  };
}

test("provider confirms a pending booking", async () => {
  const { service, calls } = makeService(makeBooking());

  const result = await service.update(makeActor(), "booking_1", {
    status: "CONFIRMED",
  });

  assert.equal(result.booking.status, "CONFIRMED");
  assert.equal(calls.updateData?.status, "CONFIRMED");
  assert.ok(calls.updateData?.confirmedAt instanceof Date);
  assert.equal(calls.notifications.length, 1);
});

test("provider starts a confirmed booking", async () => {
  const { service, calls } = makeService(makeBooking({ status: "CONFIRMED" }));

  const result = await service.update(makeActor(), "booking_1", {
    status: "IN_PROGRESS",
  });

  assert.equal(result.booking.status, "IN_PROGRESS");
  assert.equal(calls.updateData?.status, "IN_PROGRESS");
  assert.ok(calls.updateData?.startedAt instanceof Date);
});

test("provider completes an in-progress booking and creates pending earning", async () => {
  const { service, calls } = makeService(makeBooking({ status: "IN_PROGRESS" }));

  const result = await service.update(makeActor(), "booking_1", {
    status: "COMPLETED",
  });

  assert.equal(result.booking.status, "COMPLETED");
  assert.equal(calls.updateData?.status, "COMPLETED");
  assert.ok(calls.updateData?.completedAt instanceof Date);
  assert.equal(calls.providerUpdates.length, 1);
  assert.equal(calls.createdTransactions.length, 1);
});

test("provider completes an in-progress booking and confirms offline payment", async () => {
  const { service, calls } = makeService(makeBooking({ status: "IN_PROGRESS" }));

  const result = await service.update(makeActor(), "booking_1", {
    status: "COMPLETED",
    isPaid: true,
    paymentMethod: "cash",
  });

  assert.equal(result.booking.status, "COMPLETED");
  assert.equal(result.booking.isPaid, true);
  assert.equal(result.booking.paymentMethod, "cash");
  assert.ok(calls.updateData?.completedAt instanceof Date);
  assert.ok(calls.updateData?.paidAt instanceof Date);
  assert.equal(calls.createdTransactions.length, 1);
  assert.equal(calls.updatedTransactions.length, 0);
  assert.equal(calls.notifications.length, 2);
});

test("provider confirms payment for a completed booking and settles earning", async () => {
  const { service, calls } = makeService(
    makeBooking({ status: "COMPLETED", completedAt: now }),
    { existingEarningTransactionId: "tx_1" },
  );

  const result = await service.update(makeActor(), "booking_1", {
    isPaid: true,
    paymentMethod: "cash",
  });

  assert.equal(result.booking.status, "COMPLETED");
  assert.equal(result.booking.isPaid, true);
  assert.equal(calls.createdTransactions.length, 0);
  assert.equal(calls.updatedTransactions.length, 1);
  assert.ok(calls.updateData?.paidAt instanceof Date);
});

test("client cancellation stores role-aware user and reason", async () => {
  const actor = makeActor({
    id: "client_user_1",
    authUserId: "auth_client_1",
    role: "CLIENT",
  });
  const { service, calls } = makeService(makeBooking());

  const result = await service.update(actor, "booking_1", {
    status: "CANCELLED",
    cancelReason: "Je ne suis plus disponible",
  });

  assert.equal(result.booking.status, "CANCELLED");
  assert.equal(result.booking.cancelReason, "Je ne suis plus disponible");
  assert.equal(result.booking.cancelledBy, "client_user_1");
  assert.equal(result.booking.cancelledByRole, "client");
  assert.equal(calls.updateData?.cancelReason, "Je ne suis plus disponible");
});

test("client cannot confirm a booking", async () => {
  const actor = makeActor({
    id: "client_user_1",
    authUserId: "auth_client_1",
    role: "CLIENT",
  });
  const { service } = makeService(makeBooking());

  await assert.rejects(
    () => service.update(actor, "booking_1", { status: "CONFIRMED" }),
    (error) => error instanceof ForbiddenException,
  );
});

test("client cannot confirm payment", async () => {
  const actor = makeActor({
    id: "client_user_1",
    authUserId: "auth_client_1",
    role: "CLIENT",
  });
  const { service } = makeService(makeBooking({ status: "COMPLETED", completedAt: now }));

  await assert.rejects(
    () => service.update(actor, "booking_1", { isPaid: true, paymentMethod: "cash" }),
    (error) => error instanceof ForbiddenException,
  );
});

test("provider cannot skip directly from pending to completed", async () => {
  const { service } = makeService(makeBooking());

  await assert.rejects(
    () => service.update(makeActor(), "booking_1", { status: "COMPLETED" }),
    (error) => error instanceof BadRequestException,
  );
});

test("provider sends a cash final offer to a client", async () => {
  const calls: {
    createdOfferData?: Record<string, unknown>;
    bookingCreateData?: Record<string, unknown>;
    finalOfferUpdateData?: Record<string, unknown>;
    notifications: unknown[];
  } = { notifications: [] };
  const createdOffer = makeFinalOffer();
  const tx = {
    finalOffer: {
      findFirst: async () => null,
      updateMany: async () => ({ count: 0 }),
      create: async ({ data }: { data: Record<string, unknown> }) => {
        calls.createdOfferData = data;
        return { ...createdOffer, ...data };
      },
      update: async ({ data }: { data: Record<string, unknown> }) => {
        calls.finalOfferUpdateData = data;
        return {
          ...createdOffer,
          ...calls.createdOfferData,
          ...data,
          booking: {
            id: "booking_1",
            title: createdOffer.title,
            status: "CONFIRMED",
            scheduledDate: createdOffer.scheduledDate,
            price: createdOffer.price,
          },
        };
      },
    },
    booking: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        calls.bookingCreateData = data;
        return makeBooking(data);
      },
    },
  };
  const prisma = {
    provider: {
      findUnique: async () => ({ id: "provider_1", userId: "provider_user_1" }),
    },
    user: {
      findUnique: async () => ({ id: "client_user_1", role: "CLIENT" }),
    },
    conversation: {
      findUnique: async () => ({
        user1Id: "client_user_1",
        user2Id: "provider_user_1",
      }),
    },
    $transaction: async <T>(callback: (client: typeof tx) => Promise<T>) =>
      callback(tx),
  };
  const notifications = {
    create: async (input: unknown) => {
      calls.notifications.push(input);
    },
  };
  const service = new BookingsService(prisma as never, notifications as never);

  const result = await service.createFinalOffer(makeActor(), {
    providerId: "provider_1",
    clientId: "client_user_1",
    conversationId: "conversation_1",
    title: "Réparer une fuite",
    description: "Remplacement du joint et test.",
    price: 65000,
    duration: 90,
    scheduledDate: now,
    address: "12 Avenue Kasa-Vubu",
    city: "Kinshasa",
    notes: "Paiement en espèces à la fin.",
    paymentMethod: "cash",
  });

  assert.equal(result.finalOffer.status, "ACCEPTED");
  assert.equal(result.booking.status, "CONFIRMED");
  assert.equal(result.finalOffer.paymentMethod, "cash");
  assert.equal(calls.createdOfferData?.providerId, "provider_1");
  assert.equal(calls.createdOfferData?.clientId, "client_user_1");
  assert.equal(calls.createdOfferData?.paymentMethod, "cash");
  assert.equal(calls.createdOfferData?.status, "ACCEPTED");
  assert.equal(calls.bookingCreateData?.status, "CONFIRMED");
  assert.equal(calls.finalOfferUpdateData?.bookingId, "booking_1");
  assert.equal(calls.notifications.length, 2);
});

test("provider cannot send a final offer to a non-client user", async () => {
  const prisma = {
    provider: {
      findUnique: async () => ({ id: "provider_1", userId: "provider_user_1" }),
    },
    user: {
      findUnique: async () => ({ id: "other_provider_user", role: "PROVIDER" }),
    },
  };
  const service = new BookingsService(prisma as never, {} as never);

  await assert.rejects(
    () =>
      service.createFinalOffer(makeActor(), {
        providerId: "provider_1",
        clientId: "other_provider_user",
        title: "Réparer une fuite",
        price: 65000,
        scheduledDate: now,
        paymentMethod: "cash",
      }),
    (error) => error instanceof BadRequestException,
  );
});

test("provider final offer confirms an attached pending booking", async () => {
  const finalOffer = makeFinalOffer({ bookingId: "booking_1" });
  const calls: {
    bookingUpdateData?: Record<string, unknown>;
    finalOfferUpdateData?: Record<string, unknown>;
  } = {};
  const tx = {
    finalOffer: {
      updateMany: async () => ({ count: 0 }),
      create: async ({ data }: { data: Record<string, unknown> }) => ({
        ...finalOffer,
        ...data,
      }),
      update: async ({ data }: { data: Record<string, unknown> }) => {
        calls.finalOfferUpdateData = data;
        return {
          ...finalOffer,
          status: "ACCEPTED",
          acceptedAt: now,
          ...data,
          booking: {
            id: "booking_1",
            title: finalOffer.title,
            status: "CONFIRMED",
            scheduledDate: finalOffer.scheduledDate,
            price: finalOffer.price,
          },
        };
      },
    },
    booking: {
      findUnique: async () => ({
        id: "booking_1",
        clientId: "client_user_1",
        providerId: "provider_1",
        status: "PENDING",
      }),
      update: async ({ data }: { data: Record<string, unknown> }) => {
        calls.bookingUpdateData = data;
        return makeBooking({ id: "booking_1", ...data });
      },
    },
  };
  const prisma = {
    provider: {
      findUnique: async () => ({ id: "provider_1", userId: "provider_user_1" }),
    },
    user: {
      findUnique: async () => ({ id: "client_user_1", role: "CLIENT" }),
    },
    conversation: {
      findUnique: async () => ({
        user1Id: "client_user_1",
        user2Id: "provider_user_1",
      }),
    },
    $transaction: async <T>(callback: (client: typeof tx) => Promise<T>) =>
      callback(tx),
  };
  const notifications = { create: async () => undefined };
  const service = new BookingsService(prisma as never, notifications as never);

  const result = await service.createFinalOffer(makeActor(), {
    providerId: "provider_1",
    clientId: "client_user_1",
    conversationId: "conversation_1",
    bookingId: "booking_1",
    title: "Réparer une fuite",
    price: 65000,
    duration: 90,
    scheduledDate: now,
    paymentMethod: "cash",
  });

  assert.equal(result.finalOffer.status, "ACCEPTED");
  assert.equal(result.booking.id, "booking_1");
  assert.equal(result.booking.status, "CONFIRMED");
  assert.equal(calls.bookingUpdateData?.status, "CONFIRMED");
  assert.equal(calls.bookingUpdateData?.paymentMethod, "cash");
  assert.equal(calls.finalOfferUpdateData?.bookingId, "booking_1");
});

test("provider final offer without bookingId creates a fresh booking in an existing conversation", async () => {
  const calls: {
    bookingLookupCount: number;
    bookingCreateData?: Record<string, unknown>;
  } = { bookingLookupCount: 0 };
  const tx = {
    finalOffer: {
      updateMany: async () => ({ count: 0 }),
      create: async ({ data }: { data: Record<string, unknown> }) => ({
        ...makeFinalOffer(),
        ...data,
      }),
      update: async ({ data }: { data: Record<string, unknown> }) => ({
        ...makeFinalOffer(),
        status: "ACCEPTED",
        ...data,
        booking: {
          id: "booking_new",
          title: "Réparer une fuite",
          status: "CONFIRMED",
          scheduledDate: now,
          price: 65000,
        },
      }),
    },
    booking: {
      findUnique: async () => {
        calls.bookingLookupCount += 1;
        throw new Error("booking lookup should not run without bookingId");
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        calls.bookingCreateData = data;
        return makeBooking({ id: "booking_new", ...data });
      },
    },
  };
  const prisma = {
    provider: {
      findUnique: async () => ({ id: "provider_1", userId: "provider_user_1" }),
    },
    user: {
      findUnique: async () => ({ id: "client_user_1", role: "CLIENT" }),
    },
    conversation: {
      findUnique: async () => ({
        user1Id: "client_user_1",
        user2Id: "provider_user_1",
      }),
    },
    $transaction: async <T>(callback: (client: typeof tx) => Promise<T>) =>
      callback(tx),
  };
  const notifications = { create: async () => undefined };
  const service = new BookingsService(prisma as never, notifications as never);

  const result = await service.createFinalOffer(makeActor(), {
    providerId: "provider_1",
    clientId: "client_user_1",
    conversationId: "conversation_1",
    title: "Réparer une fuite",
    price: 65000,
    scheduledDate: now,
    paymentMethod: "cash",
  });

  assert.equal(result.booking.id, "booking_new");
  assert.equal(result.booking.status, "CONFIRMED");
  assert.equal(calls.bookingLookupCount, 0);
  assert.equal(calls.bookingCreateData?.status, "CONFIRMED");
});

test("provider final offer without bookingId does not cancel accepted conversation agreements", async () => {
  const calls: {
    updateManyCalls: Array<{ where?: Record<string, unknown>; data: Record<string, unknown> }>;
  } = { updateManyCalls: [] };
  const tx = {
    finalOffer: {
      updateMany: async (input: {
        where?: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => {
        calls.updateManyCalls.push(input);
        return { count: 0 };
      },
      create: async ({ data }: { data: Record<string, unknown> }) => ({
        ...makeFinalOffer(),
        ...data,
      }),
      update: async ({ data }: { data: Record<string, unknown> }) => ({
        ...makeFinalOffer(),
        status: "ACCEPTED",
        ...data,
        booking: {
          id: "booking_new",
          title: "Réparer une fuite",
          status: "CONFIRMED",
          scheduledDate: now,
          price: 65000,
        },
      }),
    },
    booking: {
      create: async ({ data }: { data: Record<string, unknown> }) =>
        makeBooking({ id: "booking_new", ...data }),
    },
  };
  const prisma = {
    provider: {
      findUnique: async () => ({ id: "provider_1", userId: "provider_user_1" }),
    },
    user: {
      findUnique: async () => ({ id: "client_user_1", role: "CLIENT" }),
    },
    conversation: {
      findUnique: async () => ({
        user1Id: "client_user_1",
        user2Id: "provider_user_1",
      }),
    },
    $transaction: async <T>(callback: (client: typeof tx) => Promise<T>) =>
      callback(tx),
  };
  const notifications = { create: async () => undefined };
  const service = new BookingsService(prisma as never, notifications as never);

  await service.createFinalOffer(makeActor(), {
    providerId: "provider_1",
    clientId: "client_user_1",
    conversationId: "conversation_1",
    title: "Réparer une fuite",
    price: 65000,
    scheduledDate: now,
    paymentMethod: "cash",
  });

  assert.equal(calls.updateManyCalls.length, 1);
  assert.equal(calls.updateManyCalls[0]?.where?.status, "PENDING");
  assert.equal(calls.updateManyCalls[0]?.where?.bookingId, null);
});

test("client accepts a final offer and a confirmed booking is created", async () => {
  const finalOffer = makeFinalOffer();
  const calls: {
    bookingCreateData?: Record<string, unknown>;
    finalOfferUpdateData?: Record<string, unknown>;
    notifications: unknown[];
  } = { notifications: [] };
  const tx = {
    finalOffer: {
      findUnique: async () => finalOffer,
      update: async ({ data }: { data: Record<string, unknown> }) => {
        calls.finalOfferUpdateData = data;
        return {
          ...finalOffer,
          ...data,
          booking: {
            id: "booking_1",
            title: finalOffer.title,
            status: "CONFIRMED",
            scheduledDate: finalOffer.scheduledDate,
            price: finalOffer.price,
          },
        };
      },
      updateMany: async () => ({ count: 0 }),
    },
    booking: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        calls.bookingCreateData = data;
        return makeBooking(data);
      },
    },
  };
  const prisma = {
    finalOffer: {
      findUnique: async () => finalOffer,
      update: async () => {
        throw new Error("top-level final offer update should not run");
      },
    },
    $transaction: async <T>(callback: (client: typeof tx) => Promise<T>) =>
      callback(tx),
  };
  const notifications = {
    create: async (input: unknown) => {
      calls.notifications.push(input);
    },
  };
  const service = new BookingsService(prisma as never, notifications as never);

  const result = await service.acceptFinalOffer(
    makeActor({ id: "client_user_1", role: "CLIENT" }),
    "final_offer_1",
  );

  assert.equal(result.finalOffer.status, "ACCEPTED");
  assert.equal(result.booking.status, "CONFIRMED");
  assert.equal(result.booking.paymentMethod, "cash");
  assert.equal(calls.bookingCreateData?.clientId, "client_user_1");
  assert.equal(calls.bookingCreateData?.providerId, "provider_1");
  assert.equal(calls.bookingCreateData?.status, "CONFIRMED");
  assert.equal(calls.bookingCreateData?.price, 65000);
  assert.equal(calls.finalOfferUpdateData?.status, "ACCEPTED");
  assert.equal(calls.finalOfferUpdateData?.bookingId, "booking_1");
  assert.equal(calls.notifications.length, 1);
});

test("client accepts a final offer attached to a pending booking", async () => {
  const finalOffer = makeFinalOffer({ bookingId: "booking_1" });
  const calls: {
    bookingUpdateData?: Record<string, unknown>;
    finalOfferUpdateData?: Record<string, unknown>;
  } = {};
  const tx = {
    finalOffer: {
      findUnique: async () => finalOffer,
      update: async ({ data }: { data: Record<string, unknown> }) => {
        calls.finalOfferUpdateData = data;
        return {
          ...finalOffer,
          ...data,
          booking: {
            id: "booking_1",
            title: finalOffer.title,
            status: "CONFIRMED",
            scheduledDate: finalOffer.scheduledDate,
            price: finalOffer.price,
          },
        };
      },
      updateMany: async () => ({ count: 0 }),
    },
    booking: {
      findUnique: async () => ({
        clientId: "client_user_1",
        providerId: "provider_1",
        status: "PENDING",
      }),
      update: async ({ data }: { data: Record<string, unknown> }) => {
        calls.bookingUpdateData = data;
        return makeBooking({ id: "booking_1", ...data });
      },
    },
  };
  const prisma = {
    finalOffer: {
      findUnique: async () => finalOffer,
      update: async () => {
        throw new Error("top-level final offer update should not run");
      },
    },
    $transaction: async <T>(callback: (client: typeof tx) => Promise<T>) =>
      callback(tx),
  };
  const notifications = { create: async () => undefined };
  const service = new BookingsService(prisma as never, notifications as never);

  const result = await service.acceptFinalOffer(
    makeActor({ id: "client_user_1", role: "CLIENT" }),
    "final_offer_1",
  );

  assert.equal(result.booking.id, "booking_1");
  assert.equal(result.booking.status, "CONFIRMED");
  assert.equal(calls.bookingUpdateData?.title, "Réparer une fuite");
  assert.equal(calls.bookingUpdateData?.paymentMethod, "cash");
  assert.equal(calls.finalOfferUpdateData?.status, "ACCEPTED");
});

test("wrong client cannot accept someone else's final offer", async () => {
  const tx = {
    finalOffer: {
      findUnique: async () => makeFinalOffer(),
    },
  };
  const prisma = {
    finalOffer: {
      findUnique: async () => makeFinalOffer(),
      update: async () => {
        throw new Error("top-level final offer update should not run");
      },
    },
    $transaction: async <T>(callback: (client: typeof tx) => Promise<T>) =>
      callback(tx),
  };
  const service = new BookingsService(prisma as never, {} as never);

  await assert.rejects(
    () =>
      service.acceptFinalOffer(
        makeActor({ id: "other_client", role: "CLIENT" }),
        "final_offer_1",
      ),
    (error) => error instanceof ForbiddenException,
  );
});

test("expired final offer is persisted as expired before accept rejects", async () => {
  const finalOffer = makeFinalOffer({
    expiresAt: new Date("2026-04-18T10:00:00.000Z"),
  });
  const calls: { finalOfferUpdateData?: Record<string, unknown>; transactionCalled: boolean } = {
    transactionCalled: false,
  };
  const prisma = {
    finalOffer: {
      findUnique: async () => finalOffer,
      update: async ({ data }: { data: Record<string, unknown> }) => {
        calls.finalOfferUpdateData = data;
        return { ...finalOffer, ...data };
      },
    },
    $transaction: async () => {
      calls.transactionCalled = true;
      throw new Error("transaction should not run for expired offers");
    },
  };
  const service = new BookingsService(prisma as never, {} as never);

  await assert.rejects(
    () =>
      service.acceptFinalOffer(
        makeActor({ id: "client_user_1", role: "CLIENT" }),
        "final_offer_1",
      ),
    (error) => error instanceof BadRequestException,
  );

  assert.equal(calls.finalOfferUpdateData?.status, "EXPIRED");
  assert.equal(calls.transactionCalled, false);
});

test("client declines a pending final offer", async () => {
  const finalOffer = makeFinalOffer();
  const calls: { finalOfferUpdateData?: Record<string, unknown>; notifications: unknown[] } = {
    notifications: [],
  };
  const prisma = {
    finalOffer: {
      findUnique: async () => finalOffer,
    },
    $transaction: async <T>(callback: (client: unknown) => Promise<T>) =>
      callback({
        finalOffer: {
          update: async ({ data }: { data: Record<string, unknown> }) => {
            calls.finalOfferUpdateData = data;
            return { ...finalOffer, ...data };
          },
        },
      }),
  };
  const notifications = {
    create: async (input: unknown) => {
      calls.notifications.push(input);
    },
  };
  const service = new BookingsService(prisma as never, notifications as never);

  const result = await service.declineFinalOffer(
    makeActor({ id: "client_user_1", role: "CLIENT" }),
    "final_offer_1",
  );

  assert.equal(result.finalOffer.status, "DECLINED");
  assert.ok(calls.finalOfferUpdateData?.declinedAt instanceof Date);
  assert.equal(calls.notifications.length, 1);
});
