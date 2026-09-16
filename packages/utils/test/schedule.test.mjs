import assert from "node:assert/strict";
import test from "node:test";
import {
  computeSlots,
  localSlotToInstant,
  normalizeRules,
  scheduleSummary,
  toLocalSlot,
  validateSchedule,
} from "../dist/index.js";

const monday = "2030-01-07";
const sundayMorningUtc = new Date("2030-01-06T10:00:00Z");
const mondayRanges = [
  { dayOfWeek: 1, startTime: "08:00", endTime: "12:00" },
  { dayOfWeek: 1, startTime: "14:00", endTime: "18:00" },
];

function input(overrides = {}) {
  return {
    rules: mondayRanges,
    exceptions: [],
    slotDurationMin: 90,
    slotBufferMin: 30,
    timezone: "Africa/Kinshasa",
    date: monday,
    existing: [],
    now: sundayMorningUtc,
    ...overrides,
  };
}

test("K-YOU 1 (ranges): each range yields the slots that fit inside it", () => {
  assert.deepEqual(computeSlots(input({ slotBufferMin: 0, slotDurationMin: 120 })), [
    "08:00",
    "10:00",
    "14:00",
    "16:00",
  ]);
});

test("K-YOU 2 (buffer): slots step by duration + buffer", () => {
  assert.deepEqual(computeSlots(input()), ["08:00", "10:00", "14:00", "16:00"]);
  assert.deepEqual(computeSlots(input({ slotDurationMin: 60, slotBufferMin: 15 })), [
    "08:00",
    "09:15",
    "10:30",
    "14:00",
    "15:15",
    "16:30",
  ]);
});

test("K-YOU 3 (exception closed): a closed date has no slots", () => {
  const exceptions = [{ date: monday, isOpen: false, startTime: null, endTime: null }];
  assert.deepEqual(computeSlots(input({ exceptions })), []);
});

test("K-YOU 4 (exception custom range): an open exception replaces the weekday ranges", () => {
  const exceptions = [{ date: monday, isOpen: true, startTime: "09:00", endTime: "11:00" }];
  assert.deepEqual(computeSlots(input({ exceptions, slotDurationMin: 60, slotBufferMin: 0 })), [
    "09:00",
    "10:00",
  ]);
  const saturday = "2030-01-12";
  const open = [{ date: saturday, isOpen: true, startTime: "09:00", endTime: "13:00" }];
  assert.deepEqual(
    computeSlots(input({ date: saturday, exceptions: open, slotDurationMin: 60, slotBufferMin: 15 })),
    ["09:00", "10:15", "11:30"],
  );
});

test("K-YOU 5 (past slots today): slots at or before the provider's local now disappear", () => {
  const slots = computeSlots(
    input({
      timezone: "Africa/Lubumbashi",
      rules: [{ dayOfWeek: 1, startTime: "08:00", endTime: "12:00" }],
      slotDurationMin: 60,
      slotBufferMin: 0,
      now: new Date("2030-01-07T07:00:00Z"),
    }),
  );
  assert.deepEqual(slots, ["10:00", "11:00"]);
  assert.deepEqual(computeSlots(input({ date: "2030-01-05" })), []);
  assert.deepEqual(computeSlots(input({ date: "2030-02-30" })), []);
  assert.deepEqual(computeSlots(input({ date: "2030-04-08" })), []);
});

test("K-YOU 6 (overlap with existing booking incl. buffer): busy windows remove overlapping slots", () => {
  const existing = [
    {
      scheduledAt: localSlotToInstant(monday, "08:30", "Africa/Kinshasa"),
      durationMin: 120,
      bufferMin: 30,
    },
  ];
  assert.deepEqual(computeSlots(input({ existing })), ["14:00", "16:00"]);

  const bufferOnly = [
    {
      scheduledAt: new Date(localSlotToInstant(monday, "06:30", "Africa/Kinshasa")),
      durationMin: 60,
      bufferMin: 45,
    },
  ];
  assert.deepEqual(computeSlots(input({ existing: bufferOnly })), ["10:00", "14:00", "16:00"]);
});

test("K-YOU 7 (DST-free timezone offset): wall times map to fixed UTC offsets and back", () => {
  assert.equal(localSlotToInstant(monday, "08:00", "Africa/Kinshasa"), "2030-01-07T07:00:00.000Z");
  assert.equal(localSlotToInstant(monday, "08:00", "Africa/Brazzaville"), "2030-01-07T07:00:00.000Z");
  const july = localSlotToInstant("2030-07-01", "08:00", "Africa/Lubumbashi");
  assert.equal(july, "2030-07-01T06:00:00.000Z");
  const lateNight = localSlotToInstant(monday, "00:30", "Africa/Lubumbashi");
  assert.equal(lateNight, "2030-01-06T22:30:00.000Z");
  assert.deepEqual(toLocalSlot(lateNight, "Africa/Lubumbashi"), { date: monday, time: "00:30" });
  assert.deepEqual(toLocalSlot(lateNight, "Africa/Kinshasa"), { date: "2030-01-06", time: "23:30" });

  const slots = computeSlots(
    input({
      rules: [{ dayOfWeek: 1, startTime: "08:00", endTime: "10:00" }],
      slotDurationMin: 60,
      slotBufferMin: 0,
      timezone: "Africa/Lubumbashi",
      now: new Date("2030-01-06T22:30:00Z"),
    }),
  );
  assert.deepEqual(slots, ["08:00", "09:00"]);
});

test("seeded demo provider matches the K-YOU reference output", () => {
  // Expected arrays were produced by K-YOU shared/schedule.mjs availableSlots() for the same
  // schedule (Mon–Fri 08:00–12:00 and 13:00–17:00, 60 min slots, 15 min buffer).
  const weekdays = [1, 2, 3, 4, 5].flatMap((dayOfWeek) => [
    { dayOfWeek, startTime: "08:00", endTime: "12:00" },
    { dayOfWeek, startTime: "13:00", endTime: "17:00" },
  ]);
  const demo = input({ rules: weekdays, slotDurationMin: 60, slotBufferMin: 15 });

  assert.deepEqual(computeSlots(demo), ["08:00", "09:15", "10:30", "13:00", "14:15", "15:30"]);
  assert.deepEqual(
    computeSlots({
      ...demo,
      existing: [
        { scheduledAt: localSlotToInstant(monday, "09:15", demo.timezone), durationMin: 60, bufferMin: 15 },
        { scheduledAt: localSlotToInstant(monday, "14:15", demo.timezone), durationMin: 60, bufferMin: 15 },
      ],
    }),
    ["08:00", "10:30", "13:00", "15:30"],
  );
  assert.deepEqual(computeSlots({ ...demo, date: "2030-01-12" }), []);
});

test("validateSchedule rejects overlapping, crowded and slotless ranges in French", () => {
  const base = { timezone: "Africa/Kinshasa", slotDurationMin: 90, slotBufferMin: 30, exceptions: [] };

  const overlap = validateSchedule({
    ...base,
    rules: [
      { dayOfWeek: 1, startTime: "10:00", endTime: "12:00" },
      { dayOfWeek: 1, startTime: "11:00", endTime: "15:00" },
    ],
  });
  assert.equal(overlap.ok, false);
  assert.deepEqual(overlap.errors, [
    { path: ["rules", 1], message: "Les plages d'un même jour ne doivent pas se chevaucher" },
  ]);

  const crowded = validateSchedule({
    ...base,
    slotDurationMin: 15,
    slotBufferMin: 0,
    rules: ["08", "09", "10", "11", "12"].map((hour) => ({
      dayOfWeek: 2,
      startTime: `${hour}:00`,
      endTime: `${hour}:30`,
    })),
  });
  assert.equal(crowded.ok, false);
  assert.deepEqual(crowded.errors, [{ path: ["rules"], message: "4 plages maximum par jour" }]);

  const slotless = validateSchedule({
    ...base,
    rules: [{ dayOfWeek: 3, startTime: "08:00", endTime: "09:00" }],
  });
  assert.deepEqual(slotless.errors, [
    { path: ["rules", 0], message: "La plage doit contenir au moins un créneau" },
  ]);

  const badExceptions = validateSchedule({
    ...base,
    timezone: "Europe/Paris",
    rules: [],
    exceptions: [
      { date: "2030-01-07", isOpen: false, startTime: "08:00", endTime: "12:00" },
      { date: "2030-01-07", isOpen: true },
    ],
  });
  assert.deepEqual(badExceptions.errors, [
    { path: ["timezone"], message: "Fuseau horaire non pris en charge" },
    { path: ["exceptions", 0], message: "Un jour fermé ne porte pas de plage horaire" },
    { path: ["exceptions", 1, "date"], message: "Une seule exception par date" },
    { path: ["exceptions", 1], message: "Une ouverture exceptionnelle exige une plage horaire" },
  ]);
});

test("validateSchedule normalizes rules and exceptions", () => {
  const result = validateSchedule({
    timezone: "Africa/Brazzaville",
    slotDurationMin: 60,
    slotBufferMin: 0,
    rules: [
      { dayOfWeek: 2, startTime: "14:00", endTime: "16:00" },
      { dayOfWeek: 2, startTime: "08:00", endTime: "12:00" },
      { dayOfWeek: 0, startTime: "09:00", endTime: "10:00" },
    ],
    exceptions: [
      { date: "2030-02-01", isOpen: true, startTime: "09:00", endTime: "11:00" },
      { date: "2030-01-15", isOpen: false, reason: "Congé" },
    ],
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.schedule.rules, [
    { dayOfWeek: 0, startTime: "09:00", endTime: "10:00", order: 0 },
    { dayOfWeek: 2, startTime: "08:00", endTime: "12:00", order: 0 },
    { dayOfWeek: 2, startTime: "14:00", endTime: "16:00", order: 1 },
  ]);
  assert.deepEqual(result.schedule.exceptions, [
    { date: "2030-01-15", isOpen: false, startTime: null, endTime: null, reason: "Congé" },
    { date: "2030-02-01", isOpen: true, startTime: "09:00", endTime: "11:00", reason: null },
  ]);
  assert.deepEqual(normalizeRules(result.schedule.rules), result.schedule.rules);
  assert.deepEqual(scheduleSummary(result.schedule.rules)[2].ranges, [
    { startTime: "08:00", endTime: "12:00" },
    { startTime: "14:00", endTime: "16:00" },
  ]);
});
