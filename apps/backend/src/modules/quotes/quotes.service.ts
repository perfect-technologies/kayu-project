import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import { PrismaService } from "../../database/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

type QuoteLineInput = {
  label: string;
  qty: number;
  unit: string;
  unitPrice: number;
};

type CreateQuoteInput = {
  jobRequestId?: string;
  lines: QuoteLineInput[];
  message: string;
  validityDays: number;
  startDateKind: string;
  discountPct: number;
};

type UpdateQuoteInput = Partial<Omit<CreateQuoteInput, "jobRequestId">>;

const COMMISSION_PCT = 10;

const quoteInclude = {
  lines: { orderBy: { order: "asc" as const } },
  jobRequest: {
    select: {
      id: true,
      service: true,
      address: true,
      city: true,
      budget: true,
      status: true,
    },
  },
  provider: {
    select: {
      id: true,
      userId: true,
      profession: true,
      hourlyRate: true,
      isPremium: true,
      totalReviews: true,
      totalJobs: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          city: true,
        },
      },
    },
  },
  client: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatar: true,
      email: true,
      phone: true,
    },
  },
} satisfies Prisma.QuoteInclude;

type QuoteRecord = Prisma.QuoteGetPayload<{ include: typeof quoteInclude }>;

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ============ Pro ============

  async listMine(actor: Actor) {
    const providerId = await this.requireProviderId(actor);
    const quotes = await this.prisma.quote.findMany({
      where: { providerId },
      orderBy: { createdAt: "desc" },
      include: quoteInclude,
    });
    return {
      success: true as const,
      quotes: quotes.map((q) => this.mapQuote(q)),
    };
  }

  async getForPro(actor: Actor, id: string) {
    const providerId = await this.requireProviderId(actor);
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: quoteInclude,
    });
    if (!quote) throw new NotFoundException("Devis introuvable");
    if (quote.providerId !== providerId) {
      throw new ForbiddenException("Accès refusé");
    }
    return { success: true as const, quote: this.mapQuote(quote) };
  }

  async create(actor: Actor, input: CreateQuoteInput) {
    const providerId = await this.requireProviderId(actor);

    const clientId = await this.resolveClientIdForNew(
      input.jobRequestId,
      providerId,
    );

    const totals = computeTotals(input.lines, input.discountPct);

    const quote = await this.prisma.quote.create({
      data: {
        jobRequestId: input.jobRequestId ?? null,
        providerId,
        clientId,
        message: input.message,
        validityDays: input.validityDays,
        startDateKind: input.startDateKind,
        discountPct: input.discountPct,
        ...totals,
        status: "DRAFT",
        lines: {
          create: input.lines.map((line, i) => ({
            label: line.label,
            qty: line.qty,
            unit: line.unit,
            unitPrice: line.unitPrice,
            order: i,
          })),
        },
      },
      include: quoteInclude,
    });

    return { success: true as const, quote: this.mapQuote(quote) };
  }

  async update(actor: Actor, id: string, input: UpdateQuoteInput) {
    const providerId = await this.requireProviderId(actor);
    if ("jobRequestId" in input) {
      throw new BadRequestException(
        "La demande associée au devis ne peut pas être modifiée",
      );
    }
    const existing = await this.prisma.quote.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!existing) throw new NotFoundException("Devis introuvable");
    if (existing.providerId !== providerId) {
      throw new ForbiddenException("Accès refusé");
    }
    if (existing.status !== "DRAFT") {
      throw new BadRequestException(
        "Seuls les devis en brouillon peuvent être modifiés",
      );
    }

    const nextLines = input.lines ?? existing.lines;
    const nextDiscountPct = input.discountPct ?? existing.discountPct;
    const totals = computeTotals(nextLines, nextDiscountPct);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (input.lines) {
        await tx.quoteLineItem.deleteMany({ where: { quoteId: id } });
        await tx.quoteLineItem.createMany({
          data: input.lines.map((line, i) => ({
            quoteId: id,
            label: line.label,
            qty: line.qty,
            unit: line.unit,
            unitPrice: line.unitPrice,
            order: i,
          })),
        });
      }
      return tx.quote.update({
        where: { id },
        data: {
          message: input.message ?? existing.message,
          validityDays: input.validityDays ?? existing.validityDays,
          startDateKind: input.startDateKind ?? existing.startDateKind,
          discountPct: nextDiscountPct,
          jobRequestId: existing.jobRequestId,
          ...totals,
        },
        include: quoteInclude,
      });
    });

    return { success: true as const, quote: this.mapQuote(updated) };
  }

  async send(actor: Actor, id: string) {
    const providerId = await this.requireProviderId(actor);
    const existing = await this.prisma.quote.findUnique({
      where: { id },
      include: quoteInclude,
    });
    if (!existing) throw new NotFoundException("Devis introuvable");
    if (existing.providerId !== providerId) {
      throw new ForbiddenException("Accès refusé");
    }
    if (existing.status !== "DRAFT") {
      throw new BadRequestException("Le devis a déjà été envoyé");
    }

    const now = new Date();
    const expiresAt = addDays(now, existing.validityDays);

    const updated = await this.prisma.$transaction(async (tx) => {
      const q = await tx.quote.update({
        where: { id },
        data: { status: "SENT", sentAt: now, expiresAt },
        include: quoteInclude,
      });

      await this.notifications.create(
        {
          userId: existing.clientId,
          type: "QUOTE_RECEIVED",
          title: "Nouveau devis reçu",
          message: `Un pro vous a envoyé un devis pour « ${existing.jobRequest?.service ?? "votre demande"} »`,
          data: {
            quoteId: id,
            jobRequestId: existing.jobRequestId ?? undefined,
          } as Prisma.InputJsonValue,
        },
        tx,
      );

      return q;
    });

    return { success: true as const, quote: this.mapQuote(updated) };
  }

  // ============ Client ============

  async getForClient(actor: Actor, id: string) {
    const quote = await this.getSettledQuote(id);
    if (quote.clientId !== actor.id && actor.role !== "ADMIN") {
      throw new ForbiddenException("Accès refusé");
    }
    return { success: true as const, quote: this.mapQuote(quote) };
  }

  async listForJobRequest(actor: Actor, jobRequestId: string) {
    const request = await this.prisma.jobRequest.findUnique({
      where: { id: jobRequestId },
      select: { id: true, clientId: true },
    });
    if (!request) throw new NotFoundException("Demande introuvable");
    if (request.clientId !== actor.id && actor.role !== "ADMIN") {
      throw new ForbiddenException("Accès refusé");
    }

    const quotes = await this.prisma.quote.findMany({
      where: {
        jobRequestId,
        status: { in: ["SENT", "ACCEPTED", "DECLINED", "EXPIRED"] },
      },
      orderBy: { sentAt: "desc" },
      include: quoteInclude,
    });

    const now = new Date();
    const visible = quotes.map((q) => this.maybeExpire(q, now));

    return {
      success: true as const,
      quotes: visible.map((q) => this.mapQuote(q)),
    };
  }

  async accept(actor: Actor, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const quote = await tx.quote.findUnique({
        where: { id },
        include: quoteInclude,
      });
      if (!quote) throw new NotFoundException("Devis introuvable");
      if (quote.clientId !== actor.id && actor.role !== "ADMIN") {
        throw new ForbiddenException("Accès refusé");
      }

      const now = new Date();
      if (quote.expiresAt && quote.expiresAt < now) {
        await tx.quote.update({
          where: { id },
          data: { status: "EXPIRED" },
        });
        throw new BadRequestException("Le devis a expiré");
      }

      if (quote.status !== "SENT") {
        throw new BadRequestException(
          "Seuls les devis envoyés peuvent être acceptés",
        );
      }

      const hourLine = quote.lines.find((l) => l.unit === "Heure");
      const durationMinutes = hourLine
        ? Math.max(30, Math.round(hourLine.qty * 60))
        : 120;

      const booking = await tx.booking.create({
        data: {
          clientId: quote.clientId,
          providerId: quote.providerId,
          title: quote.jobRequest?.service ?? "Mission sur devis",
          description: quote.message,
          address: quote.jobRequest?.address ?? null,
          city: quote.jobRequest?.city ?? null,
          scheduledDate: computeScheduledDate(quote.startDateKind),
          duration: durationMinutes,
          price: quote.total,
          status: "CONFIRMED",
          confirmedAt: now,
        },
      });

      const updatedQuote = await tx.quote.update({
        where: { id },
        data: {
          status: "ACCEPTED",
          acceptedAt: now,
          bookingId: booking.id,
        },
        include: quoteInclude,
      });

      if (quote.jobRequestId) {
        await tx.jobRequest.update({
          where: { id: quote.jobRequestId },
          data: { status: "MATCHED" },
        });
        await tx.quote.updateMany({
          where: {
            jobRequestId: quote.jobRequestId,
            id: { not: id },
            status: "SENT",
          },
          data: { status: "DECLINED", declinedAt: now },
        });
      }

      const providerUser = await tx.provider.findUnique({
        where: { id: quote.providerId },
        select: { userId: true },
      });

      if (providerUser) {
        await this.notifications.create(
          {
            userId: providerUser.userId,
            type: "QUOTE_ACCEPTED",
            title: "Devis accepté !",
            message: `Votre devis pour « ${quote.jobRequest?.service ?? "une mission"} » a été accepté.`,
            data: {
              quoteId: id,
              bookingId: booking.id,
            } as Prisma.InputJsonValue,
          },
          tx,
        );
      }

      return {
        success: true as const,
        quote: this.mapQuote(updatedQuote),
        booking: this.mapBookingForResponse(booking),
      };
    });
  }

  async decline(actor: Actor, id: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: quoteInclude,
    });
    if (!quote) throw new NotFoundException("Devis introuvable");
    if (quote.clientId !== actor.id && actor.role !== "ADMIN") {
      throw new ForbiddenException("Accès refusé");
    }
    if (quote.status !== "SENT") {
      throw new BadRequestException(
        "Seuls les devis envoyés peuvent être refusés",
      );
    }

    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      const q = await tx.quote.update({
        where: { id },
        data: { status: "DECLINED", declinedAt: now },
        include: quoteInclude,
      });

      const providerUser = await tx.provider.findUnique({
        where: { id: quote.providerId },
        select: { userId: true },
      });

      if (providerUser) {
        await this.notifications.create(
          {
            userId: providerUser.userId,
            type: "QUOTE_DECLINED",
            title: "Devis refusé",
            message: `Votre devis pour « ${quote.jobRequest?.service ?? "une mission"} » a été refusé.`,
            data: { quoteId: id } as Prisma.InputJsonValue,
          },
          tx,
        );
      }

      return q;
    });

    return { success: true as const, quote: this.mapQuote(updated) };
  }

  // ============ Internals ============

  private async resolveClientIdForNew(
    jobRequestId: string | undefined,
    providerId: string,
  ): Promise<string> {
    if (!jobRequestId) {
      throw new BadRequestException(
        "jobRequestId est requis pour créer un devis",
      );
    }
    const request = await this.prisma.jobRequest.findUnique({
      where: { id: jobRequestId },
      select: {
        clientId: true,
        status: true,
        matches: {
          where: { providerId, dismissedAt: null },
          select: { id: true },
          take: 1,
        },
      },
    });
    if (!request) throw new NotFoundException("Demande introuvable");
    if (request.status !== "OPEN") {
      throw new BadRequestException("Cette demande n'accepte plus de devis");
    }
    if (request.matches.length === 0) {
      throw new ForbiddenException("Cette demande ne vous est pas attribuée");
    }
    return request.clientId;
  }

  private async getSettledQuote(id: string): Promise<QuoteRecord> {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: quoteInclude,
    });
    if (!quote) throw new NotFoundException("Devis introuvable");
    const now = new Date();
    return this.maybeExpire(quote, now);
  }

  private maybeExpire(quote: QuoteRecord, now: Date): QuoteRecord {
    if (
      quote.status === "SENT" &&
      quote.expiresAt &&
      quote.expiresAt < now
    ) {
      this.prisma.quote
        .update({ where: { id: quote.id }, data: { status: "EXPIRED" } })
        .catch(() => {
          /* best-effort — next read will retry */
        });
      return { ...quote, status: "EXPIRED" };
    }
    return quote;
  }

  private async requireProviderId(actor: Actor): Promise<string> {
    if (actor.role !== "PROVIDER" && actor.role !== "ADMIN") {
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

  private mapQuote(record: QuoteRecord) {
    return {
      id: record.id,
      jobRequestId: record.jobRequestId,
      providerId: record.providerId,
      clientId: record.clientId,
      message: record.message,
      validityDays: record.validityDays,
      startDateKind: record.startDateKind,
      discountPct: record.discountPct,
      subtotal: record.subtotal,
      discountAmt: record.discountAmt,
      total: record.total,
      commissionPct: record.commissionPct,
      commissionAmt: record.commissionAmt,
      payoutAmt: record.payoutAmt,
      status: record.status,
      sentAt: record.sentAt,
      acceptedAt: record.acceptedAt,
      declinedAt: record.declinedAt,
      expiresAt: record.expiresAt,
      bookingId: record.bookingId,
      lines: record.lines
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((l) => ({
          id: l.id,
          label: l.label,
          qty: l.qty,
          unit: l.unit,
          unitPrice: l.unitPrice,
          order: l.order,
        })),
      provider: record.provider
        ? {
            id: record.provider.id,
            userId: record.provider.userId,
            profession: record.provider.profession,
            hourlyRate: record.provider.hourlyRate,
            isPremium: record.provider.isPremium,
            totalReviews: record.provider.totalReviews,
            totalJobs: record.provider.totalJobs,
            user: {
              id: record.provider.user.id,
              firstName: record.provider.user.firstName,
              lastName: record.provider.user.lastName,
              avatar: record.provider.user.avatar,
              city: record.provider.user.city,
            },
          }
        : undefined,
      client: record.client
        ? {
            id: record.client.id,
            firstName: record.client.firstName,
            lastName: record.client.lastName,
            avatar: record.client.avatar,
            email: record.client.email,
            phone: record.client.phone,
          }
        : undefined,
      jobRequest: record.jobRequest
        ? {
            id: record.jobRequest.id,
            service: record.jobRequest.service,
            address: record.jobRequest.address,
            city: record.jobRequest.city,
            budget: record.jobRequest.budget,
            status: record.jobRequest.status,
          }
        : null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private mapBookingForResponse(
    booking: Prisma.BookingGetPayload<Record<string, never>>,
  ) {
    return {
      id: booking.id,
      clientId: booking.clientId,
      providerId: booking.providerId,
      serviceId: booking.serviceId,
      title: booking.title,
      description: booking.description,
      status: booking.status,
      address: booking.address,
      city: booking.city,
      clientLatitude: booking.clientLatitude,
      clientLongitude: booking.clientLongitude,
      scheduledDate: booking.scheduledDate,
      duration: booking.duration,
      price: booking.price,
      clientNotes: booking.clientNotes,
      providerNotes: booking.providerNotes,
      paymentMethod: booking.paymentMethod,
      isPaid: booking.isPaid,
      paidAt: booking.paidAt,
      confirmedAt: booking.confirmedAt,
      startedAt: booking.startedAt,
      completedAt: booking.completedAt,
      cancelledAt: booking.cancelledAt,
      cancelReason: booking.cancelReason,
      cancelledBy: booking.cancelledBy,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }
}

function computeTotals(lines: QuoteLineInput[], discountPct: number) {
  const subtotal = lines.reduce(
    (sum, l) => sum + Math.round(l.qty * l.unitPrice),
    0,
  );
  const clampedDiscount = Math.max(0, Math.min(100, discountPct));
  const discountAmt = Math.round((subtotal * clampedDiscount) / 100);
  const total = subtotal - discountAmt;
  const commissionPct = COMMISSION_PCT;
  const commissionAmt = Math.round((total * commissionPct) / 100);
  const payoutAmt = total - commissionAmt;
  return {
    subtotal,
    discountAmt,
    total,
    commissionPct,
    commissionAmt,
    payoutAmt,
  };
}

function addDays(date: Date, days: number): Date {
  const out = new Date(date);
  out.setDate(out.getDate() + days);
  return out;
}

function computeScheduledDate(kind: string): Date {
  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    9,
    0,
    0,
  );
  if (kind === "today") return today;
  if (kind === "tomorrow") return addDays(today, 1);
  if (kind === "this_week" || kind === "week") return addDays(today, 3);
  const trimmed = kind.trim();
  const isoDate = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDate) {
    const parsed = new Date(
      Number(isoDate[1]),
      Number(isoDate[2]) - 1,
      Number(isoDate[3]),
      9,
      0,
      0,
    );
    if (isExactLocalDate(parsed, Number(isoDate[1]), Number(isoDate[2]), Number(isoDate[3]))) {
      return parsed;
    }
  }
  const frDate = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (frDate) {
    const parsed = new Date(
      Number(frDate[3]),
      Number(frDate[2]) - 1,
      Number(frDate[1]),
      9,
      0,
      0,
    );
    if (isExactLocalDate(parsed, Number(frDate[3]), Number(frDate[2]), Number(frDate[1]))) {
      return parsed;
    }
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return addDays(today, 1);
}

function isExactLocalDate(date: Date, year: number, month: number, day: number) {
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}
