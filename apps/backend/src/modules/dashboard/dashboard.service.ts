import { Injectable } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { notFound } from "../../common/http/errors";
import { PrismaService } from "../../database/prisma.service";
import { BookingViewService, bookingInclude } from "../bookings/booking-view.service";
import {
  acceptanceRate,
  countsByStatus,
  currentWeek,
  sumByWeekDay,
} from "../earnings/provider-metrics";
import { clientRatingSummary } from "../reviews/rating-aggregates";

const LIST_LIMIT = 20;

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly view: BookingViewService,
  ) {}

  async provider(actor: Actor, now: Date = new Date()) {
    const provider = await this.prisma.provider.findUnique({
      where: { userId: actor.id },
      select: {
        id: true,
        displayName: true,
        profilePhoto: true,
        isAvailable: true,
        hidden: true,
        verificationStatus: true,
        premiumTier: true,
        ratingAvg: true,
        ratingCount: true,
        completedJobs: true,
        timezone: true,
      },
    });
    if (!provider) throw notFound("Profil prestataire introuvable");
    const week = currentWeek(provider.timezone, now);

    const [statusGroups, pending, history, completedThisWeek] = await Promise.all([
      this.prisma.booking.groupBy({
        by: ["status"],
        where: { providerId: provider.id },
        _count: { _all: true },
      }),
      this.prisma.booking.findMany({
        where: { providerId: provider.id, status: "PENDING" },
        orderBy: [{ scheduledAt: "asc" }, { id: "asc" }],
        take: LIST_LIMIT,
        include: bookingInclude,
      }),
      this.prisma.booking.findMany({
        where: { providerId: provider.id, status: { not: "PENDING" } },
        orderBy: [{ scheduledAt: "desc" }, { id: "desc" }],
        take: LIST_LIMIT,
        include: bookingInclude,
      }),
      this.prisma.booking.findMany({
        where: {
          providerId: provider.id,
          status: "COMPLETED",
          scheduledAt: { gte: week.start, lt: week.end },
        },
        select: { scheduledAt: true },
      }),
    ]);

    const counts = countsByStatus(statusGroups);
    const ratingAvg = Number(provider.ratingAvg);
    const [pendingBookings, historyBookings] = await Promise.all([
      this.view.cards(pending, "provider"),
      this.view.cards(history, "provider"),
    ]);

    return {
      provider: {
        id: provider.id,
        displayName: provider.displayName,
        profilePhoto: provider.profilePhoto,
        isAvailable: provider.isAvailable,
        hidden: provider.hidden,
        verificationStatus: provider.verificationStatus,
        premiumTier: provider.premiumTier,
        ratingAvg,
        ratingCount: provider.ratingCount,
        completedJobs: provider.completedJobs,
      },
      metrics: {
        pending: counts.PENDING,
        completed: counts.COMPLETED,
        ratingAvg,
        ratingCount: provider.ratingCount,
        acceptanceRate: acceptanceRate(counts),
      },
      pendingBookings,
      history: historyBookings,
      weekCompletedByDay: sumByWeekDay(
        week,
        provider.timezone,
        completedThisWeek,
        (row) => row.scheduledAt,
        () => 1,
      ),
    };
  }

  async client(actor: Actor) {
    const [statusGroups, clientRating, unread] = await Promise.all([
      this.prisma.booking.groupBy({
        by: ["status"],
        where: { clientId: actor.id },
        _count: { _all: true },
      }),
      clientRatingSummary(this.prisma, actor.id),
      this.prisma.conversation.aggregate({
        where: { clientId: actor.id },
        _sum: { clientUnread: true },
      }),
    ]);

    return {
      bookingsByStatus: countsByStatus(statusGroups),
      clientRating,
      unreadMessages: unread._sum.clientUnread ?? 0,
    };
  }
}
