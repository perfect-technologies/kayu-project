import assert from "node:assert/strict";
import test from "node:test";
import { HttpException } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { BookingViewService } from "./booking-view.service";
import { BookingsService } from "./bookings.service";

const clientActor = { id: "client_1", role: "CLIENT", firstName: "Paul", lastName: "Kabasele" } as Actor;
const providerActor = { id: "pro_user_1", role: "PROVIDER", firstName: "Jean", lastName: "Mukendi" } as Actor;
const adminActor = { id: "admin_1", role: "ADMIN" } as Actor;

type Row = Record<string, any>;

function makeRecord(overrides: Row = {}): Row {
  return {
    id: "booking_1",
    clientId: "client_1",
    providerId: "provider_1",
    status: "PENDING",
    scheduledAt: new Date("2030-01-07T07:00:00.000Z"),
    durationMin: 60,
    bufferMin: 15,
    timezone: "Africa/Kinshasa",
    subcategoryId: "sub_1",
    clientPhone: "+243810000001",
    clientNotes: null,
    providerNotes: "Apporter le joint",
    placeId: null,
    addressLine: null,
    latitude: null,
    longitude: null,
    agreedPrice: null,
    commissionPct: 10,
    commissionAmt: 0,
    providerNetAmt: 0,
    isPaid: false,
    paidAt: null,
    confirmedAt: null,
    completedAt: null,
    cancelledAt: null,
    cancelledById: null,
    cancelReason: null,
    createdAt: new Date("2030-01-01T00:00:00.000Z"),
    updatedAt: new Date("2030-01-01T00:00:00.000Z"),
    client: { id: "client_1", firstName: "Paul", lastName: "Kabasele", avatar: null },
    provider: {
      id: "provider_1",
      userId: "pro_user_1",
      displayName: "Plomberie Mukendi",
      profilePhoto: null,
      subcategory: { name: "Fuites" },
    },
    subcategory: { name: "Fuites" },
    review: null,
    clientReview: null,
    ...overrides,
  };
}

function setup(options: {
  featBooking?: boolean;
  provider?: Row | null;
  blocked?: boolean;
  slots?: string[];
  address?: Row | null;
  booking?: Row | null;
  createError?: unknown;
} = {}) {
  const calls = {
    created: [] as Row[],
    updated: [] as Row[],
    transactions: [] as Row[],
    providerUpdates: [] as Row[],
    notifications: [] as Array<{ params: Row; client: unknown }>,
    activity: [] as Array<{ entry: Row; client: unknown }>,
    locks: 0,
    availability: [] as Array<{ providerId: string; date: string; client: unknown }>,
    findMany: [] as Row[],
  };
  let current: Row | null = options.booking === undefined ? makeRecord() : options.booking;

  const tx = {
    $queryRaw: async () => {
      calls.locks += 1;
      return [];
    },
    booking: {
      create: async (args: Row) => {
        if (options.createError) throw options.createError;
        calls.created.push(args);
        current = makeRecord({ ...args.data, id: "booking_new" });
        return current;
      },
      findUnique: async () => current,
      update: async (args: Row) => {
        calls.updated.push(args);
        current = makeRecord({ ...current, ...args.data });
        return current;
      },
    },
    transaction: {
      create: async (args: Row) => {
        calls.transactions.push(args);
        return args.data;
      },
    },
    provider: {
      update: async (args: Row) => {
        calls.providerUpdates.push(args);
        return {};
      },
    },
  };

  const prisma = {
    $transaction: async (callback: (client: typeof tx) => unknown) => callback(tx),
    provider: {
      findUnique: async (args: Row) =>
        args.where.userId
          ? { id: "provider_1" }
          : options.provider === undefined
            ? {
                id: "provider_1",
                userId: "pro_user_1",
                hidden: false,
                isAvailable: true,
                subcategoryId: "sub_1",
                user: { isActive: true },
              }
            : options.provider,
    },
    address: {
      findFirst: async (args: Row) => {
        if (options.address === undefined) return null;
        return options.address && args.where.userId === options.address.userId
          ? options.address
          : null;
      },
    },
    booking: {
      findUnique: async () => current,
      update: async (args: Row) => {
        calls.updated.push(args);
        current = makeRecord({ ...current, ...args.data });
        return current;
      },
      count: async () => 1,
      findMany: async (args: Row) => {
        calls.findMany.push(args);
        return [makeRecord()];
      },
    },
    clientReview: {
      aggregate: async () => ({ _avg: { rating: 4.5 }, _count: { _all: 2 } }),
    },
  };

  const places = {
    chain: async () => [],
    assertSelectable: async () => [],
  };
  const view = new BookingViewService(prisma as never, places as never);
  const service = new BookingsService(
    prisma as never,
    {
      computeForDate: async (providerId: string, date: string, opts: { client: unknown }) => {
        calls.availability.push({ providerId, date, client: opts.client });
        return {
          date,
          timezone: "Africa/Kinshasa",
          slotDurationMin: 60,
          slotBufferMin: 15,
          slots: options.slots ?? ["08:00", "09:15"],
        };
      },
    } as never,
    places as never,
    { isBlocked: async () => options.blocked ?? false } as never,
    { getBoolean: async () => options.featBooking ?? true } as never,
    {
      create: async (params: Row, client: unknown) => {
        calls.notifications.push({ params, client });
        return params;
      },
    } as never,
    {
      log: async (entry: Row, client: unknown) => {
        calls.activity.push({ entry, client });
      },
    } as never,
    view,
  );
  return { service, calls, tx };
}

const createInput = {
  providerId: "provider_1",
  date: "2030-01-07",
  time: "08:00",
  clientPhone: "+243810000001",
};

function rejectsWith(status: number, code: string) {
  return (error: unknown) => {
    assert.ok(error instanceof HttpException, String(error));
    assert.equal(error.getStatus(), status);
    assert.equal((error.getResponse() as { code: string }).code, code);
    return true;
  };
}

test("create snapshots the schedule, converts the local slot and notifies the provider in the transaction", async () => {
  const { service, calls, tx } = setup();

  const detail = await service.create(clientActor, { ...createInput, clientNotes: "Fuite cuisine" });

  assert.equal(calls.locks, 1);
  assert.equal(calls.availability[0]?.client, tx);
  const data = calls.created[0]!.data;
  assert.equal(data.scheduledAt.toISOString(), "2030-01-07T07:00:00.000Z");
  assert.equal(data.durationMin, 60);
  assert.equal(data.bufferMin, 15);
  assert.equal(data.timezone, "Africa/Kinshasa");
  assert.equal(data.subcategoryId, "sub_1");
  assert.equal(data.status, "PENDING");
  assert.equal(data.clientNotes, "Fuite cuisine");
  assert.equal(calls.notifications[0]?.client, tx);
  assert.equal(calls.notifications[0]?.params.type, "BOOKING_NEW");
  assert.equal(calls.notifications[0]?.params.userId, "pro_user_1");
  assert.deepEqual(calls.notifications[0]?.params.data, { bookingId: "booking_new" });
  assert.equal(detail.side, "client");
  assert.deepEqual(detail.scheduledLocal, { date: "2030-01-07", time: "08:00" });
  assert.equal(detail.counterpart.providerId, "provider_1");
  assert.equal(detail.providerNotes, null);
  assert.equal(detail.providerNetAmt, null);
});

test("create is refused when booking is disabled, blocked, self, hidden or unavailable", async () => {
  await assert.rejects(
    () => setup({ featBooking: false }).service.create(clientActor, createInput),
    rejectsWith(403, "FEATURE_DISABLED"),
  );
  await assert.rejects(
    () => setup({ blocked: true }).service.create(clientActor, createInput),
    rejectsWith(403, "BLOCKED"),
  );
  await assert.rejects(
    () =>
      setup({
        provider: { id: "provider_1", userId: "client_1", hidden: false, isAvailable: true, subcategoryId: "sub_1", user: { isActive: true } },
      }).service.create(clientActor, createInput),
    rejectsWith(400, "SELF_ACTION"),
  );
  for (const provider of [
    null,
    { id: "provider_1", userId: "pro_user_1", hidden: true, isAvailable: true, subcategoryId: "sub_1", user: { isActive: true } },
    { id: "provider_1", userId: "pro_user_1", hidden: false, isAvailable: true, subcategoryId: "sub_1", user: { isActive: false } },
  ]) {
    await assert.rejects(
      () => setup({ provider }).service.create(clientActor, createInput),
      rejectsWith(404, "NOT_FOUND"),
    );
  }
  await assert.rejects(
    () =>
      setup({
        provider: { id: "provider_1", userId: "pro_user_1", hidden: false, isAvailable: false, subcategoryId: "sub_1", user: { isActive: true } },
      }).service.create(clientActor, createInput),
    rejectsWith(409, "PROVIDER_UNAVAILABLE"),
  );
});

test("create returns 409 SLOT_TAKEN when the slot is gone or the unique index fires", async () => {
  const gone = setup({ slots: ["09:15"] });
  await assert.rejects(() => gone.service.create(clientActor, createInput), rejectsWith(409, "SLOT_TAKEN"));
  assert.equal(gone.calls.created.length, 0);

  const raced = setup({ createError: Object.assign(new Error("unique"), { code: "P2002" }) });
  await assert.rejects(() => raced.service.create(clientActor, createInput), rejectsWith(409, "SLOT_TAKEN"));
});

test("create copies a saved address of the client and refuses someone else's", async () => {
  const address = { userId: "client_1", placeId: "gombe", addressLine: "12 av. Kasa-Vubu", latitude: -4.3, longitude: 15.3 };
  const own = setup({ address });
  await own.service.create(clientActor, { ...createInput, addressId: "address_1" });
  const data = own.calls.created[0]!.data;
  assert.equal(data.placeId, "gombe");
  assert.equal(data.addressLine, "12 av. Kasa-Vubu");
  assert.equal(data.latitude, -4.3);

  const foreign = setup({ address: { ...address, userId: "someone_else" } });
  await assert.rejects(
    () => foreign.service.create(clientActor, { ...createInput, addressId: "address_2" }),
    rejectsWith(404, "NOT_FOUND"),
  );
});

test("list picks the provider side for providers and the client side otherwise", async () => {
  const asProvider = setup();
  const page = await asProvider.service.list(providerActor, { page: 1, limit: 20, status: "PENDING" });
  assert.deepEqual(asProvider.calls.findMany[0]!.where, { providerId: "provider_1", status: "PENDING" });
  assert.deepEqual(asProvider.calls.findMany[0]!.orderBy[0], { scheduledAt: "asc" });
  assert.equal(page.items[0]!.side, "provider");
  assert.deepEqual(page.items[0]!.clientRating, { avg: 4.5, count: 2 });
  assert.equal(page.items[0]!.counterpart.name, "Paul Kabasele");
  assert.deepEqual({ total: page.total, page: page.page, limit: page.limit }, { total: 1, page: 1, limit: 20 });

  const asClient = setup();
  const clientPage = await asClient.service.list(clientActor, { page: 1, limit: 20 });
  assert.deepEqual(asClient.calls.findMany[0]!.where, { clientId: "client_1" });
  assert.deepEqual(asClient.calls.findMany[0]!.orderBy[0], { scheduledAt: "desc" });
  assert.equal(clientPage.items[0]!.clientRating, null);
});

test("detail is visible to participants and admins only", async () => {
  const { service } = setup();
  assert.equal((await service.get(clientActor, "booking_1")).side, "client");
  const asProvider = await service.get(providerActor, "booking_1");
  assert.equal(asProvider.side, "provider");
  assert.equal(asProvider.providerNotes, "Apporter le joint");
  assert.equal((await service.get(adminActor, "booking_1")).side, "provider");
  await assert.rejects(
    () => service.get({ id: "stranger", role: "CLIENT" } as Actor, "booking_1"),
    rejectsWith(404, "NOT_FOUND"),
  );
});

test("confirm moves PENDING to CONFIRMED for the owner only and notifies the client", async () => {
  const { service, calls, tx } = setup();
  const detail = await service.confirm(providerActor, "booking_1");
  assert.equal(detail.status, "CONFIRMED");
  assert.ok(calls.updated[0]!.data.confirmedAt instanceof Date);
  assert.equal(calls.notifications[0]?.params.type, "BOOKING_CONFIRMED");
  assert.equal(calls.notifications[0]?.params.userId, "client_1");
  assert.equal(calls.notifications[0]?.client, tx);

  await assert.rejects(() => service.confirm(providerActor, "booking_1"), rejectsWith(409, "INVALID_TRANSITION"));
  await assert.rejects(
    () => setup().service.confirm({ id: "other_pro", role: "PROVIDER" } as Actor, "booking_1"),
    rejectsWith(404, "NOT_FOUND"),
  );
  await assert.rejects(
    () => setup({ booking: null }).service.confirm(providerActor, "missing"),
    rejectsWith(404, "NOT_FOUND"),
  );
});

test("complete with an agreed price computes the commission and writes the EARNING row", async () => {
  const paid = setup({ booking: makeRecord({ status: "CONFIRMED" }) });
  const detail = await paid.service.complete(providerActor, "booking_1", { agreedPrice: 45_005, isPaid: true });

  const data = paid.calls.updated[0]!.data;
  assert.equal(data.status, "COMPLETED");
  assert.equal(data.agreedPrice, 45_005);
  assert.equal(data.commissionAmt, 4_501);
  assert.equal(data.providerNetAmt, 40_504);
  assert.equal(data.isPaid, true);
  assert.ok(data.paidAt instanceof Date);
  assert.deepEqual(
    {
      providerId: paid.calls.transactions[0]!.data.providerId,
      bookingId: paid.calls.transactions[0]!.data.bookingId,
      type: paid.calls.transactions[0]!.data.type,
      amount: paid.calls.transactions[0]!.data.amount,
      feeAmt: paid.calls.transactions[0]!.data.feeAmt,
      netAmt: paid.calls.transactions[0]!.data.netAmt,
      status: paid.calls.transactions[0]!.data.status,
    },
    { providerId: "provider_1", bookingId: "booking_1", type: "EARNING", amount: 45_005, feeAmt: 4_501, netAmt: 40_504, status: "COMPLETED" },
  );
  assert.deepEqual(paid.calls.providerUpdates[0], {
    where: { id: "provider_1" },
    data: { completedJobs: { increment: 1 } },
  });
  assert.equal(paid.calls.notifications[0]?.params.type, "BOOKING_COMPLETED");
  assert.equal(detail.providerNetAmt, 40_504);

  const unpaid = setup({ booking: makeRecord({ status: "CONFIRMED" }) });
  await unpaid.service.complete(providerActor, "booking_1", { agreedPrice: 20_000 });
  assert.equal(unpaid.calls.transactions[0]!.data.status, "PENDING");
  assert.equal(unpaid.calls.updated[0]!.data.paidAt, null);
});

test("complete without a price writes no ledger row, and requires CONFIRMED", async () => {
  const { service, calls } = setup({ booking: makeRecord({ status: "CONFIRMED" }) });
  await service.complete(providerActor, "booking_1", { isPaid: true });
  assert.equal(calls.transactions.length, 0);
  assert.equal(calls.updated[0]!.data.isPaid, undefined);
  assert.equal(calls.providerUpdates.length, 1);

  await assert.rejects(
    () => setup().service.complete(providerActor, "booking_1", {}),
    rejectsWith(409, "INVALID_TRANSITION"),
  );
});

test("cancel: client reason optional, provider reason required, counterpart notified", async () => {
  const byClient = setup();
  const detail = await byClient.service.cancel(clientActor, "booking_1", {});
  assert.equal(detail.status, "CANCELLED");
  assert.equal(byClient.calls.updated[0]!.data.cancelledById, "client_1");
  assert.equal(byClient.calls.updated[0]!.data.cancelReason, null);
  assert.deepEqual(byClient.calls.notifications.map((n) => n.params.userId), ["pro_user_1"]);
  assert.equal(byClient.calls.activity.length, 0);

  await assert.rejects(
    () => setup().service.cancel(providerActor, "booking_1", { reason: "  " }),
    rejectsWith(400, "REASON_REQUIRED"),
  );
  const byProvider = setup({ booking: makeRecord({ status: "CONFIRMED" }) });
  await byProvider.service.cancel(providerActor, "booking_1", { reason: "Malade" });
  assert.deepEqual(byProvider.calls.notifications.map((n) => n.params.userId), ["client_1"]);
  assert.match(byProvider.calls.notifications[0]!.params.message, /Motif : Malade/);

  await assert.rejects(
    () => setup({ booking: makeRecord({ status: "COMPLETED" }) }).service.cancel(clientActor, "booking_1", {}),
    rejectsWith(409, "INVALID_TRANSITION"),
  );
  await assert.rejects(
    () => setup().service.cancel({ id: "stranger", role: "CLIENT" } as Actor, "booking_1", {}),
    rejectsWith(404, "NOT_FOUND"),
  );
});

test("admin cancel requires a reason, notifies both parties and journals with the IP", async () => {
  await assert.rejects(
    () => setup().service.cancel(adminActor, "booking_1", {}, { ipAddress: "1.2.3.4" }),
    rejectsWith(400, "REASON_REQUIRED"),
  );

  const { service, calls, tx } = setup();
  await service.cancel(adminActor, "booking_1", { reason: "Signalement" }, { ipAddress: "1.2.3.4" });
  assert.deepEqual(calls.notifications.map((n) => n.params.userId), ["client_1", "pro_user_1"]);
  assert.equal(calls.activity.length, 1);
  assert.equal(calls.activity[0]!.client, tx);
  assert.deepEqual(calls.activity[0]!.entry, {
    userId: "admin_1",
    action: "booking.cancel",
    entityType: "Booking",
    entityId: "booking_1",
    metadata: { previousStatus: "PENDING", reason: "Signalement" },
    ipAddress: "1.2.3.4",
  });
});

test("notes are writable by the provider owner only", async () => {
  const { service, calls } = setup();
  await service.updateNotes(providerActor, "booking_1", { providerNotes: "Code portail 1234" });
  assert.deepEqual(calls.updated[0]!.data, { providerNotes: "Code portail 1234" });
  await assert.rejects(
    () => service.updateNotes(clientActor, "booking_1", { providerNotes: "x" }),
    rejectsWith(404, "NOT_FOUND"),
  );
});
