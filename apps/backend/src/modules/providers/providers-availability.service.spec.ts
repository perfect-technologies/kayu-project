import assert from "node:assert/strict";
import test from "node:test";
import { ProvidersAvailabilityService } from "./providers-availability.service";
import { localSlotToInstant } from "./schedule";

function fakePrisma(options: { isAvailable?: boolean; bookings?: Array<Record<string, unknown>> } = {}) {
  const calls: Record<string, unknown> = {};
  return {
    calls,
    provider: {
      findUnique: async (args: unknown) => {
        calls.provider = args;
        return {
          timezone: "Africa/Kinshasa",
          slotDurationMin: 60,
          slotBufferMin: 15,
          isAvailable: options.isAvailable ?? true,
          availabilityRules: [{ dayOfWeek: 1, startTime: "08:00", endTime: "12:00" }],
          availabilityExceptions: [],
        };
      },
    },
    booking: {
      findMany: async (args: { where: { status: { in: string[] } } }) => {
        calls.booking = args;
        return (options.bookings ?? []).filter((booking) =>
          args.where.status.in.includes(booking.status as string),
        );
      },
    },
  };
}

const now = new Date("2030-01-06T10:00:00Z");

test("computes slots from rules and ignores cancelled or completed bookings", async () => {
  const prisma = fakePrisma({
    bookings: [
      { scheduledAt: localSlotToInstant("2030-01-07", "08:00", "Africa/Kinshasa"), durationMin: 60, bufferMin: 15, status: "CONFIRMED" },
      { scheduledAt: localSlotToInstant("2030-01-07", "10:30", "Africa/Kinshasa"), durationMin: 60, bufferMin: 15, status: "CANCELLED" },
    ],
  });
  const service = new ProvidersAvailabilityService(prisma as never);

  const result = await service.computeForDate("provider_1", "2030-01-07", { now });

  assert.deepEqual(result, {
    date: "2030-01-07",
    timezone: "Africa/Kinshasa",
    slotDurationMin: 60,
    slotBufferMin: 15,
    slots: ["09:15", "10:30"],
  });
});

test("an unavailable provider has no slots and a missing provider returns null", async () => {
  const unavailable = new ProvidersAvailabilityService(fakePrisma({ isAvailable: false }) as never);
  assert.deepEqual((await unavailable.computeForDate("provider_1", "2030-01-07", { now }))?.slots, []);

  const missing = new ProvidersAvailabilityService({
    provider: { findUnique: async () => null },
  } as never);
  assert.equal(await missing.computeForDate("nope", "2030-01-07", { now }), null);
});
