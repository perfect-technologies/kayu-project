import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import type {
  PayoutOperator,
  Prisma,
  Transaction,
  TransactionType,
} from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import { PrismaService } from "../../database/prisma.service";

type TransactionsQuery = {
  type?: TransactionType;
  page: number;
  limit: number;
};

type CreatePayoutBody = {
  operator: PayoutOperator;
  amount: number;
  phone: string;
};

const WEEK_DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const transactionInclude = {
  booking: {
    select: {
      id: true,
      title: true,
      client: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      service: {
        select: {
          name: true,
        },
      },
    },
  },
  payout: {
    select: {
      id: true,
      operator: true,
    },
  },
} satisfies Prisma.TransactionInclude;

type TransactionRecord = Prisma.TransactionGetPayload<{
  include: typeof transactionInclude;
}>;

@Injectable()
export class EarningsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(actor: Actor) {
    const providerId = await this.requireProviderId(actor);
    const now = new Date();
    const weekStart = startOfISOWeek(now);
    const lastWeekStart = addDays(weekStart, -7);

    const [
      availableAgg,
      pendingAgg,
      lifetimeAgg,
      weekTxs,
      lastWeekAgg,
    ] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: {
          providerId,
          type: { in: ["EARNING", "BONUS"] },
          status: "COMPLETED",
        },
        _sum: { netAmt: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          providerId,
          type: { in: ["EARNING", "BONUS"] },
          status: "PENDING",
        },
        _sum: { netAmt: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          providerId,
          type: { in: ["EARNING", "BONUS"] },
        },
        _sum: { netAmt: true },
      }),
      this.prisma.transaction.findMany({
        where: {
          providerId,
          type: "EARNING",
          occurredAt: { gte: weekStart },
        },
        select: { netAmt: true, occurredAt: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          providerId,
          type: "EARNING",
          occurredAt: { gte: lastWeekStart, lt: weekStart },
        },
        _sum: { netAmt: true },
      }),
    ]);

    const earningsCompleted = availableAgg._sum.netAmt ?? 0;
    const balance = earningsCompleted;

    const lastWeekTotal = lastWeekAgg._sum.netAmt ?? 0;
    const days = this.buildWeeklyDays(weekTxs, weekStart, now);
    const weekTotal = days.reduce((s, d) => s + d.amount, 0);
    const deltaPct =
      lastWeekTotal > 0
        ? ((weekTotal - lastWeekTotal) / lastWeekTotal) * 100
        : weekTotal > 0
          ? 100
          : 0;

    return {
      summary: {
        balance,
        pending: pendingAgg._sum.netAmt ?? 0,
        lifetime: lifetimeAgg._sum.netAmt ?? 0,
        weekly: {
          days,
          total: weekTotal,
          lastWeekTotal,
          deltaPct: Math.round(deltaPct),
        },
      },
    };
  }

  async transactions(actor: Actor, query: TransactionsQuery) {
    const providerId = await this.requireProviderId(actor);
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {
      providerId,
      ...(query.type ? { type: query.type } : { type: { in: ["EARNING", "BONUS"] } }),
    };

    const [total, rows] = await Promise.all([
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.findMany({
        where,
        orderBy: { occurredAt: "desc" },
        skip,
        take: limit,
        include: transactionInclude,
      }),
    ]);

    return {
      transactions: rows.map((tx) => this.mapTransaction(tx)),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  async createPayout(actor: Actor, body: CreatePayoutBody) {
    const providerId = await this.requireProviderId(actor);

    // Compute available balance (EARNING+BONUS COMPLETED - PAYOUT netAmt (pending+completed, abs))
    const [earningsAgg, payoutsAgg] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: {
          providerId,
          type: { in: ["EARNING", "BONUS"] },
          status: "COMPLETED",
        },
        _sum: { netAmt: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          providerId,
          type: "PAYOUT",
          status: { in: ["PENDING", "COMPLETED"] },
        },
        _sum: { netAmt: true },
      }),
    ]);

    const earningsCompleted = earningsAgg._sum.netAmt ?? 0;
    const payoutsAbs = Math.abs(payoutsAgg._sum.netAmt ?? 0);
    const available = Math.max(0, earningsCompleted - payoutsAbs);

    if (body.amount <= 0) {
      throw new BadRequestException("Montant invalide");
    }
    if (body.amount > available) {
      throw new BadRequestException(
        "Montant supérieur au solde disponible",
      );
    }

    const feeAmt = Math.round(body.amount * 0.01);
    const netAmt = body.amount - feeAmt;
    const phoneMasked = maskPhone(body.phone);

    const result = await this.prisma.$transaction(async (tx) => {
      const payout = await tx.payout.create({
        data: {
          providerId,
          operator: body.operator,
          phoneFull: body.phone,
          phoneMasked,
          amount: body.amount,
          feeAmt,
          netAmt,
          status: "PENDING",
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          providerId,
          type: "PAYOUT",
          payoutId: payout.id,
          amount: -body.amount,
          feeAmt,
          netAmt: -netAmt,
          paymentMethod: body.operator.toLowerCase(),
          status: "PENDING",
          occurredAt: new Date(),
        },
        include: transactionInclude,
      });

      // TODO: call PSP here — for now, stub
      // await this.pspClient.requestDisbursement({ operator, phone, amount: netAmt })

      return { payout, transaction };
    });

    return {
      success: true as const,
      payout: this.mapPayout(result.payout),
      transaction: this.mapTransaction(result.transaction),
    };
  }

  async payouts(actor: Actor) {
    const providerId = await this.requireProviderId(actor);
    const rows = await this.prisma.payout.findMany({
      where: { providerId },
      orderBy: { requestedAt: "desc" },
    });
    return {
      payouts: rows.map((p) => this.mapPayout(p)),
    };
  }

  private async requireProviderId(actor: Actor): Promise<string> {
    if (actor.role !== "PROVIDER") {
      throw new ForbiddenException("Accès réservé aux prestataires");
    }
    const provider = await this.prisma.provider.findUnique({
      where: { userId: actor.id },
      select: { id: true },
    });
    if (!provider) {
      throw new BadRequestException("Profil prestataire requis");
    }
    return provider.id;
  }

  private buildWeeklyDays(
    rows: { netAmt: number; occurredAt: Date }[],
    weekStart: Date,
    now: Date,
  ) {
    const totals = new Array(7).fill(0) as number[];
    for (const row of rows) {
      const diff = Math.floor(
        (row.occurredAt.getTime() - weekStart.getTime()) / 86_400_000,
      );
      if (diff >= 0 && diff < 7) {
        totals[diff] += row.netAmt;
      }
    }

    const todayDiff = Math.floor(
      (stripTime(now).getTime() - weekStart.getTime()) / 86_400_000,
    );

    return WEEK_DAY_LABELS.map((day, i) => ({
      day,
      amount: totals[i] ?? 0,
      isToday: i === todayDiff ? true : undefined,
      isFuture: i > todayDiff ? true : undefined,
    }));
  }

  private mapTransaction(tx: TransactionRecord) {
    return {
      id: tx.id,
      providerId: tx.providerId,
      type: tx.type,
      bookingId: tx.bookingId,
      payoutId: tx.payoutId,
      amount: tx.amount,
      feeAmt: tx.feeAmt,
      netAmt: tx.netAmt,
      paymentMethod: tx.paymentMethod,
      status: tx.status,
      reference: tx.reference,
      note: tx.note,
      label: this.buildLabel(tx),
      occurredAt: tx.occurredAt,
      createdAt: tx.createdAt,
    };
  }

  private buildLabel(tx: TransactionRecord): string {
    if (tx.type === "PAYOUT") {
      const op = tx.payout?.operator;
      return op ? `Virement vers ${formatOperator(op)}` : "Virement Mobile Money";
    }
    if (tx.type === "BONUS") {
      return tx.note ?? "Bonus KAYOU";
    }
    if (tx.booking) {
      const title = tx.booking.service?.name ?? tx.booking.title;
      const clientName = `${tx.booking.client.firstName ?? ""} ${tx.booking.client.lastName ?? ""}`.trim();
      return clientName ? `${title} · ${clientName}` : title;
    }
    return "Gain";
  }

  private mapPayout(payout: {
    id: string;
    providerId: string;
    operator: PayoutOperator;
    phoneMasked: string;
    amount: number;
    feeAmt: number;
    netAmt: number;
    status: Transaction["status"] extends never ? never : string;
    reference: string | null;
    holdReason: string | null;
    requestedAt: Date;
    completedAt: Date | null;
  }) {
    return {
      id: payout.id,
      providerId: payout.providerId,
      operator: payout.operator,
      phoneMasked: payout.phoneMasked,
      amount: payout.amount,
      feeAmt: payout.feeAmt,
      netAmt: payout.netAmt,
      status: payout.status,
      reference: payout.reference,
      holdReason: payout.holdReason,
      requestedAt: payout.requestedAt,
      completedAt: payout.completedAt,
    };
  }
}

function startOfISOWeek(d: Date): Date {
  const day = d.getDay(); // 0=Sun..6=Sat
  const diffToMonday = (day + 6) % 7; // days since Monday
  const monday = new Date(d);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - diffToMonday);
  return monday;
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

function stripTime(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function maskPhone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.length < 4) return trimmed;
  const visible = trimmed.slice(-3);
  const prefix = trimmed.slice(0, Math.max(0, trimmed.length - 6));
  return `${prefix} *** ${visible}`.trim();
}

function formatOperator(operator: PayoutOperator): string {
  switch (operator) {
    case "MPESA":
      return "M-Pesa";
    case "AIRTEL":
      return "Airtel Money";
    case "ORANGE":
      return "Orange Money";
    case "MTN":
      return "MTN MoMo";
    default:
      return "Mobile Money";
  }
}
