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
