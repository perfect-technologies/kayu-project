import assert from "node:assert/strict";
import test from "node:test";
import { ProvidersAvailabilityService } from "./providers-availability.service";

const PROVIDER_ID = "prov_1";

function makePrismaFake(opts: {
  schedules?: Array<{ dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean }>;
  exceptions?: Array<{ date: Date; isAvailable: boolean }>;
  bookings?: Array<{ scheduledDate: Date; duration: number | null; status: string }>;
} = {}) {
  return {
    availabilitySchedule: {
      findMany: async () => opts.schedules ?? [],
    },
    availabilityException: {
      findMany: async () => opts.exceptions ?? [],
    },
    booking: {
      findMany: async () => opts.bookings ?? [],
    },
  } as unknown as ConstructorParameters<typeof ProvidersAvailabilityService>[0];
}

test("days outside the weekly schedule are 'off'", async () => {
  const prisma = makePrismaFake({
    schedules: [{ dayOfWeek: 1, startTime: "08:00", endTime: "18:00", isAvailable: true }],
  });
  const service = new ProvidersAvailabilityService(prisma);
  const now = new Date("2026-05-20T08:00:00Z");
  const result = await service.computeRange(PROVIDER_ID, "2026-05-21", "2026-05-22", now);

  assert.equal(result.days.length, 2);
  assert.equal(result.days[0].status, "off");
  assert.equal(result.days[1].status, "off");
});

test("past days are 'past'", async () => {
  const prisma = makePrismaFake({
    schedules: [{ dayOfWeek: 0, startTime: "08:00", endTime: "18:00", isAvailable: true },
                { dayOfWeek: 1, startTime: "08:00", endTime: "18:00", isAvailable: true },
                { dayOfWeek: 2, startTime: "08:00", endTime: "18:00", isAvailable: true },
                { dayOfWeek: 3, startTime: "08:00", endTime: "18:00", isAvailable: true },
                { dayOfWeek: 4, startTime: "08:00", endTime: "18:00", isAvailable: true },
                { dayOfWeek: 5, startTime: "08:00", endTime: "18:00", isAvailable: true },
                { dayOfWeek: 6, startTime: "08:00", endTime: "18:00", isAvailable: true }],
  });
  const service = new ProvidersAvailabilityService(prisma);
  const now = new Date("2026-05-22T10:00:00Z");
  const result = await service.computeRange(PROVIDER_ID, "2026-05-20", "2026-05-21", now);

  assert.equal(result.days[0].status, "past");
  assert.equal(result.days[1].status, "past");
});

test("an open weekday produces 1-hour slots covering the schedule window", async () => {
  const prisma = makePrismaFake({
    schedules: [{ dayOfWeek: 4, startTime: "08:00", endTime: "11:00", isAvailable: true }],
  });
  const service = new ProvidersAvailabilityService(prisma);
  const now = new Date("2026-05-20T07:00:00Z");
  const result = await service.computeRange(PROVIDER_ID, "2026-05-21", "2026-05-21", now);

  assert.equal(result.days[0].status, "available");
  assert.deepEqual(result.days[0].slots, ["08:00", "09:00", "10:00"]);
  assert.deepEqual(result.workWindow, { start: "08:00", end: "11:00" });
});

test("an exception with isAvailable=false overrides the schedule", async () => {
  const prisma = makePrismaFake({
    schedules: [{ dayOfWeek: 4, startTime: "08:00", endTime: "11:00", isAvailable: true }],
    exceptions: [{ date: new Date("2026-05-21T00:00:00Z"), isAvailable: false }],
  });
  const service = new ProvidersAvailabilityService(prisma);
  const now = new Date("2026-05-20T07:00:00Z");
  const result = await service.computeRange(PROVIDER_ID, "2026-05-21", "2026-05-21", now);

  assert.equal(result.days[0].status, "off");
  assert.deepEqual(result.days[0].slots, []);
});

test("today drops slots whose hour has already passed", async () => {
  const prisma = makePrismaFake({
    schedules: [{ dayOfWeek: 4, startTime: "08:00", endTime: "12:00", isAvailable: true }],
  });
  const service = new ProvidersAvailabilityService(prisma);
  const now = new Date("2026-05-21T10:30:00Z");
  const result = await service.computeRange(PROVIDER_ID, "2026-05-21", "2026-05-21", now);

  assert.equal(result.days[0].status, "available");
  assert.deepEqual(result.days[0].slots, ["11:00"]);
});

test("an existing booking blocks overlapping slots", async () => {
  const prisma = makePrismaFake({
    schedules: [{ dayOfWeek: 4, startTime: "08:00", endTime: "12:00", isAvailable: true }],
    bookings: [{
      scheduledDate: new Date("2026-05-21T09:00:00Z"),
      duration: 120,
      status: "CONFIRMED",
    }],
  });
  const service = new ProvidersAvailabilityService(prisma);
  const now = new Date("2026-05-20T07:00:00Z");
  const result = await service.computeRange(PROVIDER_ID, "2026-05-21", "2026-05-21", now);

  assert.equal(result.days[0].status, "available");
  assert.deepEqual(result.days[0].slots, ["08:00", "11:00"]);
});

test("when every slot is taken the day is 'full'", async () => {
  const prisma = makePrismaFake({
    schedules: [{ dayOfWeek: 4, startTime: "08:00", endTime: "10:00", isAvailable: true }],
    bookings: [
      { scheduledDate: new Date("2026-05-21T08:00:00Z"), duration: 60, status: "PENDING" },
      { scheduledDate: new Date("2026-05-21T09:00:00Z"), duration: 60, status: "CONFIRMED" },
    ],
  });
  const service = new ProvidersAvailabilityService(prisma);
  const now = new Date("2026-05-20T07:00:00Z");
  const result = await service.computeRange(PROVIDER_ID, "2026-05-21", "2026-05-21", now);

  assert.equal(result.days[0].status, "full");
  assert.deepEqual(result.days[0].slots, []);
});
