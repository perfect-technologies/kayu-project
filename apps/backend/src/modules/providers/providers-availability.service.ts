import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

type AvailabilityDayStatus = "available" | "off" | "full" | "past";

export interface AvailabilityDay {
  date: string;
  status: AvailabilityDayStatus;
  slots: string[];
}

export interface AvailabilityRangeResult {
  days: AvailabilityDay[];
  workWindow: { start: string; end: string } | null;
}

const SLOT_MINUTES = 60;

function ymd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function eachDay(fromYmd: string, toYmd: string): Date[] {
  const out: Date[] = [];
  const start = new Date(`${fromYmd}T00:00:00Z`);
  const end = new Date(`${toYmd}T00:00:00Z`);
  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + 86400000)) {
    out.push(new Date(d));
  }
  return out;
}

function parseHHMM(s: string): { h: number; m: number } {
  const [hh, mm] = s.split(":").map(Number);
  return { h: hh, m: mm };
}

function generateSlots(start: string, end: string): string[] {
  const a = parseHHMM(start);
  const b = parseHHMM(end);
  const startMin = a.h * 60 + a.m;
  const endMin = b.h * 60 + b.m;
  const slots: string[] = [];
  for (let t = startMin; t + SLOT_MINUTES <= endMin; t += SLOT_MINUTES) {
    slots.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
  }
  return slots;
}

@Injectable()
export class ProvidersAvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async computeRange(
    providerId: string,
    fromYmd: string,
    toYmd: string,
    now: Date = new Date(),
  ): Promise<AvailabilityRangeResult> {
    const [schedules, exceptions, bookings] = await Promise.all([
      this.prisma.availabilitySchedule.findMany({ where: { providerId } }),
      this.prisma.availabilityException.findMany({
        where: { providerId, date: { gte: new Date(`${fromYmd}T00:00:00Z`), lte: new Date(`${toYmd}T23:59:59Z`) } },
      }),
      this.prisma.booking.findMany({
        where: {
          providerId,
          status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
          scheduledDate: { gte: new Date(`${fromYmd}T00:00:00Z`), lte: new Date(`${toYmd}T23:59:59Z`) },
        },
        select: { scheduledDate: true, duration: true },
      }),
    ]);

    const scheduleByDow = new Map<number, { startTime: string; endTime: string; isAvailable: boolean }>();
    for (const s of schedules) scheduleByDow.set(s.dayOfWeek, s);

    const exceptionByDate = new Map<string, boolean>();
    for (const e of exceptions) exceptionByDate.set(ymd(e.date), e.isAvailable);

    const today = ymd(now);

    const days: AvailabilityDay[] = eachDay(fromYmd, toYmd).map((d) => {
      const dateStr = ymd(d);

      if (dateStr < today) {
        return { date: dateStr, status: "past", slots: [] };
      }

      const dow = d.getUTCDay();
      const sched = scheduleByDow.get(dow);
      if (!sched || !sched.isAvailable) {
        return { date: dateStr, status: "off", slots: [] };
      }

      const exception = exceptionByDate.get(dateStr);
      if (exception === false) {
        return { date: dateStr, status: "off", slots: [] };
      }

      let slots = generateSlots(sched.startTime, sched.endTime);

      // Drop today's past hours
      if (dateStr === today) {
        const cutoff = now.getUTCHours() * 60 + now.getUTCMinutes();
        slots = slots.filter((slot) => {
          const { h, m } = parseHHMM(slot);
          return h * 60 + m >= cutoff;
        });
      }

      // Drop slots that overlap any existing booking for this date
      const dayBookings = bookings.filter(
        (b): b is typeof b & { scheduledDate: Date } =>
          b.scheduledDate !== null && ymd(b.scheduledDate) === dateStr,
      );
      slots = slots.filter((slot) => {
        const { h, m } = parseHHMM(slot);
        const slotStartMin = h * 60 + m;
        const slotEndMin = slotStartMin + SLOT_MINUTES;
        for (const b of dayBookings) {
          const bStart = b.scheduledDate.getUTCHours() * 60 + b.scheduledDate.getUTCMinutes();
          const bEnd = bStart + (b.duration ?? 60);
          if (slotStartMin < bEnd && slotEndMin > bStart) return false;
        }
        return true;
      });

      return {
        date: dateStr,
        status: slots.length > 0 ? "available" : "full",
        slots,
      };
    });

    const anySchedule = schedules[0];
    const workWindow = anySchedule ? { start: anySchedule.startTime, end: anySchedule.endTime } : null;

    return { days, workWindow };
  }
}
