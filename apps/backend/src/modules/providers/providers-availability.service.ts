import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { addDays, computeSlots, localSlotToInstant } from "./schedule";

type AvailabilityClient = Pick<Prisma.TransactionClient, "provider" | "booking">;

export type DayAvailability = {
  date: string;
  timezone: string;
  slotDurationMin: number;
  slotBufferMin: number;
  slots: string[];
};

export const ACTIVE_BOOKING_STATUSES = ["PENDING", "CONFIRMED"] as const;

@Injectable()
export class ProvidersAvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async computeForDate(
    providerId: string,
    date: string,
    options: { client?: AvailabilityClient; now?: Date } = {},
  ): Promise<DayAvailability | null> {
    const client = options.client ?? this.prisma;
    const provider = await client.provider.findUnique({
      where: { id: providerId },
      select: {
        timezone: true,
        slotDurationMin: true,
        slotBufferMin: true,
        isAvailable: true,
        availabilityRules: { select: { dayOfWeek: true, startTime: true, endTime: true } },
        availabilityExceptions: {
          where: { date: new Date(`${date}T00:00:00.000Z`) },
          select: { date: true, isOpen: true, startTime: true, endTime: true },
        },
      },
    });
    if (!provider) return null;

    const base = {
      date,
      timezone: provider.timezone,
      slotDurationMin: provider.slotDurationMin,
      slotBufferMin: provider.slotBufferMin,
    };
    if (!provider.isAvailable) return { ...base, slots: [] };

    const existing = await client.booking.findMany({
      where: {
        providerId,
        status: { in: [...ACTIVE_BOOKING_STATUSES] },
        scheduledAt: {
          gte: localSlotToInstant(addDays(date, -1), "00:00", provider.timezone),
          lt: localSlotToInstant(addDays(date, 2), "00:00", provider.timezone),
        },
      },
      select: { scheduledAt: true, durationMin: true, bufferMin: true },
    });

    return {
      ...base,
      slots: computeSlots({
        rules: provider.availabilityRules,
        exceptions: provider.availabilityExceptions.map((exception) => ({
          ...exception,
          date: exception.date.toISOString().slice(0, 10),
        })),
        slotDurationMin: provider.slotDurationMin,
        slotBufferMin: provider.slotBufferMin,
        timezone: provider.timezone,
        date,
        existing,
        now: options.now ?? new Date(),
      }),
    };
  }
}
