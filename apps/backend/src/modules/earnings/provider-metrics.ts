import type { BookingStatus } from "@prisma/client";
import { addDays, localParts, localSlotToInstant, weekdayOf } from "../providers/schedule";

const DAY_MS = 86_400_000;

export type WeekWindow = { monday: string; start: Date; end: Date };

export function currentWeek(timezone: string, now: Date): WeekWindow {
  const today = localParts(timezone, now).date;
  const monday = addDays(today, -((weekdayOf(today) + 6) % 7));
  return {
    monday,
    start: localSlotToInstant(monday, "00:00", timezone),
    end: localSlotToInstant(addDays(monday, 7), "00:00", timezone),
  };
}

export function weekDayIndex(week: WeekWindow, instant: Date, timezone: string): number | null {
  const date = localParts(timezone, instant).date;
  const index = Math.round((Date.parse(date) - Date.parse(week.monday)) / DAY_MS);
  return index >= 0 && index < 7 ? index : null;
}

export function sumByWeekDay<T>(
  week: WeekWindow,
  timezone: string,
  rows: T[],
  instantOf: (row: T) => Date,
  valueOf: (row: T) => number,
): number[] {
  const days = [0, 0, 0, 0, 0, 0, 0];
  for (const row of rows) {
    const index = weekDayIndex(week, instantOf(row), timezone);
    if (index !== null) days[index] += valueOf(row);
  }
  return days;
}

export function countsByStatus(
  groups: Array<{ status: BookingStatus; _count: { _all: number } }>,
): Record<BookingStatus, number> {
  const counts: Record<BookingStatus, number> = {
    PENDING: 0,
    CONFIRMED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };
  for (const group of groups) counts[group.status] = group._count._all;
  return counts;
}

export function acceptanceRate(counts: Record<BookingStatus, number>): number | null {
  const total = counts.PENDING + counts.CONFIRMED + counts.COMPLETED + counts.CANCELLED;
  return total === 0 ? null : Math.round((100 * (counts.CONFIRMED + counts.COMPLETED)) / total);
}
