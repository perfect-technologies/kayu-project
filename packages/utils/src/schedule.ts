export const SCHEDULE_LIMITS = {
  maxRangesPerDay: 4,
  maxExceptions: 90,
  bookingWindowDays: 90,
  slotDurationMin: { min: 15, max: 240 },
  slotBufferMin: { min: 0, max: 60 },
  timezones: ["Africa/Kinshasa", "Africa/Lubumbashi", "Africa/Brazzaville"] as const,
} as const;

export type ScheduleTimezone = (typeof SCHEDULE_LIMITS.timezones)[number];

export type ScheduleRule = { dayOfWeek: number; startTime: string; endTime: string };

export type ScheduleException = {
  date: string;
  isOpen: boolean;
  startTime?: string | null;
  endTime?: string | null;
  reason?: string | null;
};

export type ScheduleDraft = {
  timezone: string;
  slotDurationMin: number;
  slotBufferMin: number;
  rules: ScheduleRule[];
  exceptions?: ScheduleException[];
};

export type NormalizedSchedule = {
  timezone: ScheduleTimezone;
  slotDurationMin: number;
  slotBufferMin: number;
  rules: Array<ScheduleRule & { order: number }>;
  exceptions: Array<{
    date: string;
    isOpen: boolean;
    startTime: string | null;
    endTime: string | null;
    reason: string | null;
  }>;
};

export type ScheduleIssue = { path: Array<string | number>; message: string };

export type ScheduleValidation =
  | { ok: true; schedule: NormalizedSchedule }
  | { ok: false; errors: ScheduleIssue[] };

export type BusyBooking = { scheduledAt: Date | string; durationMin: number; bufferMin: number };

export type SlotInput = {
  rules: ScheduleRule[];
  exceptions: ScheduleException[];
  slotDurationMin: number;
  slotBufferMin: number;
  timezone: string;
  date: string;
  existing: BusyBooking[];
  now: Date;
  windowDays?: number;
};

const MINUTE_MS = 60_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const isTimeOfDay = (value: unknown): value is string =>
  typeof value === "string" && TIME_RE.test(value);

export const toMinutes = (time: string) =>
  Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

export const clock = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

export function isValidDate(date: string): boolean {
  if (!DATE_RE.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

export function addDays(date: string, days: number): string {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

export function weekdayOf(date: string): number {
  return new Date(`${date}T12:00:00.000Z`).getUTCDay();
}

export function localParts(timezone: string, instant: Date | string): { date: string; minute: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(instant))
      .map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minute: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

function offsetMinutes(timezone: string, instantMs: number): number {
  const local = localParts(timezone, new Date(instantMs));
  const [year, month, day] = local.date.split("-").map(Number);
  const wall = Date.UTC(year!, month! - 1, day!, 0, local.minute);
  const floored = Math.floor(instantMs / MINUTE_MS) * MINUTE_MS;
  return Math.round((wall - floored) / MINUTE_MS);
}

function localSlotToMs(date: string, time: string, timezone: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const wall = Date.UTC(year!, month! - 1, day!, 0, toMinutes(time));
  const guess = wall - offsetMinutes(timezone, wall) * MINUTE_MS;
  return wall - offsetMinutes(timezone, guess) * MINUTE_MS;
}

export function localSlotToInstant(date: string, time: string, timezone: string): string {
  return new Date(localSlotToMs(date, time, timezone)).toISOString();
}

export function toLocalSlot(instant: Date | string, timezone: string): { date: string; time: string } {
  const local = localParts(timezone, instant);
  return { date: local.date, time: clock(local.minute) };
}

export function rangesForDate(
  rules: ScheduleRule[],
  exceptions: ScheduleException[],
  date: string,
): Array<[number, number]> {
  const exception = exceptions.find((item) => item.date === date);
  if (exception) {
    return exception.isOpen && exception.startTime && exception.endTime
      ? [[toMinutes(exception.startTime), toMinutes(exception.endTime)]]
      : [];
  }
  const weekday = weekdayOf(date);
  return rules
    .filter((rule) => rule.dayOfWeek === weekday)
    .map((rule): [number, number] => [toMinutes(rule.startTime), toMinutes(rule.endTime)])
    .sort((a, b) => a[0] - b[0]);
}

export function computeSlots(input: SlotInput): string[] {
  if (!isValidDate(input.date)) return [];
  const today = localParts(input.timezone, input.now);
  const lastDate = addDays(today.date, input.windowDays ?? SCHEDULE_LIMITS.bookingWindowDays);
  if (input.date < today.date || input.date > lastDate) return [];

  const step = input.slotDurationMin + input.slotBufferMin;
  const candidates: number[] = [];
  for (const [start, end] of rangesForDate(input.rules, input.exceptions, input.date)) {
    for (let t = start; t + input.slotDurationMin <= end; t += step) candidates.push(t);
  }

  const busy = input.existing.map((booking) => {
    const start = new Date(booking.scheduledAt).getTime();
    return [start, start + (booking.durationMin + booking.bufferMin) * MINUTE_MS] as const;
  });

  return candidates
    .filter((minute) => !(input.date === today.date && minute <= today.minute))
    .filter((minute) => {
      const slotStart = localSlotToMs(input.date, clock(minute), input.timezone);
      const slotEnd = slotStart + step * MINUTE_MS;
      return !busy.some(([busyStart, busyEnd]) => slotStart < busyEnd && slotEnd > busyStart);
    })
    .map(clock);
}

export function scheduleSummary(rules: ScheduleRule[]) {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    ranges: rules
      .filter((rule) => rule.dayOfWeek === dayOfWeek)
      .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))
      .map((rule) => ({ startTime: rule.startTime, endTime: rule.endTime })),
  }));
}

export function normalizeRules(rules: ScheduleRule[]): Array<ScheduleRule & { order: number }> {
  const sorted = [...rules].sort(
    (a, b) => a.dayOfWeek - b.dayOfWeek || toMinutes(a.startTime) - toMinutes(b.startTime),
  );
  const orderByDay = new Map<number, number>();
  return sorted.map((rule) => {
    const order = orderByDay.get(rule.dayOfWeek) ?? 0;
    orderByDay.set(rule.dayOfWeek, order + 1);
    return { dayOfWeek: rule.dayOfWeek, startTime: rule.startTime, endTime: rule.endTime, order };
  });
}

const isTimezone = (value: string): value is ScheduleTimezone =>
  (SCHEDULE_LIMITS.timezones as readonly string[]).includes(value);

const withinBounds = (value: number, bounds: { min: number; max: number }) =>
  Number.isInteger(value) && value >= bounds.min && value <= bounds.max;

export function validateSchedule(input: ScheduleDraft): ScheduleValidation {
  const errors: ScheduleIssue[] = [];
  const { slotDurationMin, slotBufferMin } = input;
  const exceptions = input.exceptions ?? [];

  if (!isTimezone(input.timezone)) {
    errors.push({ path: ["timezone"], message: "Fuseau horaire non pris en charge" });
  }
  if (!withinBounds(slotDurationMin, SCHEDULE_LIMITS.slotDurationMin)) {
    const { min, max } = SCHEDULE_LIMITS.slotDurationMin;
    errors.push({
      path: ["slotDurationMin"],
      message: `La durée d'un créneau doit être comprise entre ${min} et ${max} minutes`,
    });
  }
  if (!withinBounds(slotBufferMin, SCHEDULE_LIMITS.slotBufferMin)) {
    const { min, max } = SCHEDULE_LIMITS.slotBufferMin;
    errors.push({
      path: ["slotBufferMin"],
      message: `La pause entre créneaux doit être comprise entre ${min} et ${max} minutes`,
    });
  }

  const validRules: Array<{ rule: ScheduleRule; index: number }> = [];
  input.rules.forEach((rule, index) => {
    const dayValid = Number.isInteger(rule.dayOfWeek) && rule.dayOfWeek >= 0 && rule.dayOfWeek <= 6;
    if (!dayValid || !isTimeOfDay(rule.startTime) || !isTimeOfDay(rule.endTime)) {
      errors.push({ path: ["rules", index], message: "Plage horaire invalide" });
    } else {
      validRules.push({ rule, index });
    }
  });

  for (let day = 0; day <= 6; day += 1) {
    const ranges = validRules
      .filter(({ rule }) => rule.dayOfWeek === day)
      .sort((a, b) => toMinutes(a.rule.startTime) - toMinutes(b.rule.startTime));

    if (ranges.length > SCHEDULE_LIMITS.maxRangesPerDay) {
      errors.push({
        path: ["rules"],
        message: `${SCHEDULE_LIMITS.maxRangesPerDay} plages maximum par jour`,
      });
    }

    let previousEnd = -1;
    for (const { rule, index } of ranges) {
      const start = toMinutes(rule.startTime);
      const end = toMinutes(rule.endTime);
      if (end - start < slotDurationMin) {
        errors.push({ path: ["rules", index], message: "La plage doit contenir au moins un créneau" });
      }
      if (start < previousEnd) {
        errors.push({
          path: ["rules", index],
          message: "Les plages d'un même jour ne doivent pas se chevaucher",
        });
      }
      previousEnd = Math.max(previousEnd, end);
    }
  }

  if (exceptions.length > SCHEDULE_LIMITS.maxExceptions) {
    errors.push({
      path: ["exceptions"],
      message: `${SCHEDULE_LIMITS.maxExceptions} exceptions maximum`,
    });
  }

  const seen = new Set<string>();
  exceptions.forEach((exception, index) => {
    if (!isValidDate(exception.date)) {
      errors.push({ path: ["exceptions", index, "date"], message: "Date invalide" });
      return;
    }
    if (seen.has(exception.date)) {
      errors.push({ path: ["exceptions", index, "date"], message: "Une seule exception par date" });
    }
    seen.add(exception.date);

    if (exception.isOpen) {
      if (!exception.startTime || !exception.endTime) {
        errors.push({
          path: ["exceptions", index],
          message: "Une ouverture exceptionnelle exige une plage horaire",
        });
        return;
      }
      if (!isTimeOfDay(exception.startTime) || !isTimeOfDay(exception.endTime)) {
        errors.push({ path: ["exceptions", index], message: "Plage horaire invalide" });
        return;
      }
      if (toMinutes(exception.endTime) - toMinutes(exception.startTime) < slotDurationMin) {
        errors.push({
          path: ["exceptions", index],
          message: "La plage doit contenir au moins un créneau",
        });
      }
    } else if (exception.startTime || exception.endTime) {
      errors.push({
        path: ["exceptions", index],
        message: "Un jour fermé ne porte pas de plage horaire",
      });
    }
  });

  if (errors.length > 0 || !isTimezone(input.timezone)) return { ok: false, errors };

  return {
    ok: true,
    schedule: {
      timezone: input.timezone,
      slotDurationMin,
      slotBufferMin,
      rules: normalizeRules(input.rules),
      exceptions: [...exceptions]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((exception) => ({
          date: exception.date,
          isOpen: exception.isOpen,
          startTime: exception.isOpen ? exception.startTime ?? null : null,
          endTime: exception.isOpen ? exception.endTime ?? null : null,
          reason: exception.reason ?? null,
        })),
    },
  };
}
