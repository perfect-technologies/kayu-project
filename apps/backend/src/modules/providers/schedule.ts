import { SCHEDULE_LIMITS, toMinutes } from "../../common/contract/schedule";

export type ScheduleRule = { dayOfWeek: number; startTime: string; endTime: string };
export type ScheduleException = {
  date: string;
  isOpen: boolean;
  startTime: string | null;
  endTime: string | null;
};
export type BusyBooking = { scheduledAt: Date; durationMin: number; bufferMin: number };

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

export function localParts(timezone: string, instant: Date): { date: string; minute: number } {
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
      .formatToParts(instant)
      .map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minute: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

function offsetMinutes(timezone: string, instant: Date): number {
  const local = localParts(timezone, instant);
  const [year, month, day] = local.date.split("-").map(Number);
  const wall = Date.UTC(year!, month! - 1, day!, 0, local.minute);
  const floored = Math.floor(instant.getTime() / MINUTE_MS) * MINUTE_MS;
  return Math.round((wall - floored) / MINUTE_MS);
}

export function localSlotToInstant(date: string, time: string, timezone: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const wall = Date.UTC(year!, month! - 1, day!, 0, toMinutes(time));
  let instant = wall - offsetMinutes(timezone, new Date(wall)) * MINUTE_MS;
  instant = wall - offsetMinutes(timezone, new Date(instant)) * MINUTE_MS;
  return new Date(instant);
}

export function toLocalSlot(instant: Date, timezone: string): { date: string; time: string } {
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

  return candidates
    .filter((minute) => !(input.date === today.date && minute <= today.minute))
    .filter((minute) => {
      const slotStart = localSlotToInstant(input.date, clock(minute), input.timezone).getTime();
      const slotEnd = slotStart + step * MINUTE_MS;
      return !input.existing.some((booking) => {
        const busyStart = booking.scheduledAt.getTime();
        const busyEnd = busyStart + (booking.durationMin + booking.bufferMin) * MINUTE_MS;
        return slotStart < busyEnd && slotEnd > busyStart;
      });
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

export function normalizeRules(rules: ScheduleRule[]) {
  const sorted = [...rules].sort(
    (a, b) => a.dayOfWeek - b.dayOfWeek || toMinutes(a.startTime) - toMinutes(b.startTime),
  );
  const orderByDay = new Map<number, number>();
  return sorted.map((rule) => {
    const order = orderByDay.get(rule.dayOfWeek) ?? 0;
    orderByDay.set(rule.dayOfWeek, order + 1);
    return { ...rule, order };
  });
}
