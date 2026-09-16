import assert from "node:assert/strict";
import test from "node:test";
import { ScheduleInputSchema } from "../../common/contract/schedule";
import {
  computeSlots,
  localSlotToInstant,
  normalizeRules,
  scheduleSummary,
  toLocalSlot,
  type ScheduleRule,
  type SlotInput,
} from "./schedule";

const monday = "2030-01-07";
const mondayRules: ScheduleRule[] = [
  { dayOfWeek: 1, startTime: "08:00", endTime: "12:00" },
  { dayOfWeek: 1, startTime: "14:00", endTime: "18:00" },
];

function input(overrides: Partial<SlotInput> = {}): SlotInput {
  return {
    rules: mondayRules,
    exceptions: [],
    slotDurationMin: 90,
    slotBufferMin: 30,
    timezone: "Africa/Kinshasa",
    date: monday,
    existing: [],
    now: new Date("2030-01-06T10:00:00Z"),
    ...overrides,
  };
}

test("K-YOU 1: ranges step by duration + buffer and a slot must fit in its range", () => {
  assert.deepEqual(computeSlots(input()), ["08:00", "10:00", "14:00", "16:00"]);
});

test("K-YOU 2: an existing booking blocks every slot overlapping its duration + buffer", () => {
  const existing = [
    {
      scheduledAt: localSlotToInstant(monday, "08:30", "Africa/Kinshasa"),
      durationMin: 120,
      bufferMin: 30,
    },
  ];
  assert.deepEqual(computeSlots(input({ existing })), ["14:00", "16:00"]);
});

test("K-YOU 3: a closed exception removes the whole day", () => {
  const exceptions = [{ date: monday, isOpen: false, startTime: null, endTime: null }];
  assert.deepEqual(computeSlots(input({ exceptions })), []);
});

test("K-YOU 4: an open exception replaces the weekday ranges", () => {
  const exceptions = [{ date: monday, isOpen: true, startTime: "09:00", endTime: "11:00" }];
  assert.deepEqual(computeSlots(input({ exceptions, slotBufferMin: 0, slotDurationMin: 60 })), [
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

test("K-YOU 5: overlapping ranges on the same day are rejected by the schedule schema", () => {
  const result = ScheduleInputSchema.safeParse({
    timezone: "Africa/Kinshasa",
    slotDurationMin: 90,
    slotBufferMin: 30,
    rules: [
      { dayOfWeek: 1, startTime: "10:00", endTime: "12:00" },
      { dayOfWeek: 1, startTime: "11:00", endTime: "15:00" },
    ],
    exceptions: [],
  });
  assert.equal(result.success, false);
});

test("K-YOU 6: past slots of today disappear in the provider timezone (Lubumbashi, UTC+2)", () => {
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
});

test("K-YOU 7: past, invalid or beyond-window dates have no slots", () => {
  assert.deepEqual(computeSlots(input({ date: "2030-01-05" })), []);
  assert.deepEqual(computeSlots(input({ date: "2030-02-30" })), []);
  assert.deepEqual(
    computeSlots(input({ date: "2030-04-08", now: new Date("2030-01-06T10:00:00Z") })),
    [],
  );
});

test("timezone edges: local wall time converts to the right UTC instant and back", () => {
  const kinshasa = localSlotToInstant("2030-01-07", "08:00", "Africa/Kinshasa");
  assert.equal(kinshasa.toISOString(), "2030-01-07T07:00:00.000Z");
  const lubumbashi = localSlotToInstant("2030-01-07", "00:30", "Africa/Lubumbashi");
  assert.equal(lubumbashi.toISOString(), "2030-01-06T22:30:00.000Z");
  assert.deepEqual(toLocalSlot(lubumbashi, "Africa/Lubumbashi"), { date: "2030-01-07", time: "00:30" });
  assert.deepEqual(toLocalSlot(lubumbashi, "Africa/Kinshasa"), { date: "2030-01-06", time: "23:30" });
});

test("timezone edges: a late-evening booking from the previous local day blocks early slots", () => {
  const existing = [
    {
      scheduledAt: localSlotToInstant("2030-01-06", "23:30", "Africa/Kinshasa"),
      durationMin: 60,
      bufferMin: 60,
    },
  ];
  const slots = computeSlots(
    input({
      rules: [{ dayOfWeek: 1, startTime: "00:00", endTime: "03:00" }],
      slotDurationMin: 60,
      slotBufferMin: 0,
      existing,
    }),
  );
  assert.deepEqual(slots, ["02:00"]);
});

test("today in UTC can already be tomorrow locally", () => {
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

test("summary and normalization order ranges per weekday", () => {
  const rules = [
    { dayOfWeek: 2, startTime: "14:00", endTime: "16:00" },
    { dayOfWeek: 2, startTime: "08:00", endTime: "12:00" },
    { dayOfWeek: 0, startTime: "09:00", endTime: "10:00" },
  ];
  const summary = scheduleSummary(rules);
  assert.equal(summary.length, 7);
  assert.deepEqual(summary[2]!.ranges.map((range) => range.startTime), ["08:00", "14:00"]);
  assert.deepEqual(
    normalizeRules(rules).map((rule) => [rule.dayOfWeek, rule.startTime, rule.order]),
    [
      [0, "09:00", 0],
      [2, "08:00", 0],
      [2, "14:00", 1],
    ],
  );
});
