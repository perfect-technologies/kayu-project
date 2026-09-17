import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AdminBookingSearchQuery } from "../../common/contract";
import { pageArgs, toPage } from "../../common/http/pagination";
import { fullName } from "../../common/util/people";
import { PrismaService } from "../../database/prisma.service";
import { toLocalSlot } from "../providers/schedule";

const bookingInclude = {
  client: { select: { id: true, firstName: true, lastName: true, phone: true } },
  provider: { select: { id: true, displayName: true, phone: true } },
} satisfies Prisma.BookingInclude;

type AdminBookingRecord = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>;

@Injectable()
export class AdminBookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AdminBookingSearchQuery) {
    const where: Prisma.BookingWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.q) {
      const contains = { contains: query.q, mode: "insensitive" as const };
      where.OR = [
        { clientPhone: contains },
        { client: { firstName: contains } },
        { client: { lastName: contains } },
        { client: { phone: contains } },
        { provider: { displayName: contains } },
        { provider: { phone: contains } },
      ];
    }

    const [total, bookings] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        ...pageArgs(query),
        orderBy: [{ scheduledAt: "desc" }, { id: "asc" }],
        include: bookingInclude,
      }),
    ]);

    return toPage(bookings.map((booking) => this.map(booking)), total, query);
  }

  private map(booking: AdminBookingRecord) {
    return {
      id: booking.id,
      status: booking.status,
      scheduledAt: booking.scheduledAt,
      scheduledLocal: toLocalSlot(booking.scheduledAt, booking.timezone),
      timezone: booking.timezone,
      client: {
        id: booking.client.id,
        name: fullName(booking.client),
        phone: booking.client.phone,
      },
      provider: {
        id: booking.provider.id,
        displayName: booking.provider.displayName,
        phone: booking.provider.phone,
      },
      clientPhone: booking.clientPhone,
      agreedPrice: booking.agreedPrice,
      createdAt: booking.createdAt,
      cancelReason: booking.cancelReason,
    };
  }
}
