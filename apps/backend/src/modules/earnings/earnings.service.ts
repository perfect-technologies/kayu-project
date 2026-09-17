import { Injectable } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import type { EarningsTransactionsQuery } from "../../common/contract";
import { notFound } from "../../common/http/errors";
import { pageArgs, toPage } from "../../common/http/pagination";
import { fullName } from "../../common/util/people";
import { PrismaService } from "../../database/prisma.service";
import { toLocalSlot } from "../providers/schedule";
import { acceptanceRate, countsByStatus, currentWeek, sumByWeekDay } from "./provider-metrics";

const LEDGER_TYPES = ["EARNING", "BONUS"] as const;

@Injectable()
export class EarningsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(actor: Actor, now: Date = new Date()) {
    const provider = await this.requireProvider(actor);
    const week = currentWeek(provider.timezone, now);

    const [total, weekRows, statusGroups, completedThisWeek] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { providerId: provider.id, type: { in: [...LEDGER_TYPES] } },
        _sum: { netAmt: true },
      }),
      this.prisma.transaction.findMany({
        where: {
          providerId: provider.id,
          type: { in: [...LEDGER_TYPES] },
          occurredAt: { gte: week.start, lt: week.end },
        },
        select: { netAmt: true, occurredAt: true },
      }),
      this.prisma.booking.groupBy({
        by: ["status"],
        where: { providerId: provider.id },
        _count: { _all: true },
      }),
      this.prisma.booking.count({
        where: {
          providerId: provider.id,
          status: "COMPLETED",
          scheduledAt: { gte: week.start, lt: week.end },
        },
      }),
    ]);

    const byDay = sumByWeekDay(
      week,
      provider.timezone,
      weekRows,
      (row) => row.occurredAt,
      (row) => row.netAmt,
    );

    return {
      total: total._sum.netAmt ?? 0,
      thisWeek: byDay.reduce((sum, value) => sum + value, 0),
      byDay,
      completedThisWeek,
      acceptanceRate: acceptanceRate(countsByStatus(statusGroups)),
      ratingAvg: Number(provider.ratingAvg),
      ratingCount: provider.ratingCount,
      currency: "CDF" as const,
    };
  }

  async transactions(actor: Actor, query: EarningsTransactionsQuery) {
    const provider = await this.requireProvider(actor);
    const where = { providerId: provider.id };

    const [total, rows] = await Promise.all([
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.findMany({
        where,
        orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
        ...pageArgs(query),
        include: {
          booking: {
            select: {
              id: true,
              scheduledAt: true,
              timezone: true,
              client: { select: { firstName: true, lastName: true } },
              subcategory: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    return toPage(
      rows.map((row) => ({
        id: row.id,
        type: row.type,
        amount: row.amount,
        feeAmt: row.feeAmt,
        netAmt: row.netAmt,
        status: row.status,
        note: row.note,
        occurredAt: row.occurredAt,
        booking: row.booking
          ? {
              id: row.booking.id,
              scheduledAt: row.booking.scheduledAt,
              scheduledLocal: toLocalSlot(row.booking.scheduledAt, row.booking.timezone),
              clientName: fullName(row.booking.client, "Client"),
              categoryLabel: row.booking.subcategory?.name ?? null,
            }
          : null,
      })),
      total,
      query,
    );
  }

  private async requireProvider(actor: Actor) {
    const provider = await this.prisma.provider.findUnique({
      where: { userId: actor.id },
      select: { id: true, timezone: true, ratingAvg: true, ratingCount: true },
    });
    if (!provider) throw notFound("Profil prestataire introuvable");
    return provider;
  }
}
