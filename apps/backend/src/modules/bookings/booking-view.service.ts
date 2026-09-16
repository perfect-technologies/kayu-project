import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import { fullName } from "../../common/util/people";
import { PrismaService } from "../../database/prisma.service";
import { PlaceTreeService } from "../places/place-tree.service";
import { toLocalSlot } from "../providers/schedule";
import { clientRatingSummary } from "../reviews/rating-aggregates";

export const bookingInclude = {
  client: { select: { id: true, firstName: true, lastName: true, avatar: true } },
  provider: {
    select: {
      id: true,
      userId: true,
      displayName: true,
      profilePhoto: true,
      subcategory: { select: { name: true } },
    },
  },
  subcategory: { select: { name: true } },
  review: { select: { id: true, rating: true, comment: true, reply: true } },
  clientReview: { select: { id: true, rating: true, comment: true } },
} satisfies Prisma.BookingInclude;

export type BookingRecord = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>;

export type BookingSide = "client" | "provider";

type RatingClient = Pick<Prisma.TransactionClient, "clientReview">;

export function formatSlotLabel(instant: Date, timezone: string): string {
  const day = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: timezone,
  }).format(instant);
  return `${day} à ${toLocalSlot(instant, timezone).time}`;
}

@Injectable()
export class BookingViewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly places: PlaceTreeService,
  ) {}

  async cards(records: BookingRecord[], side: BookingSide, client: RatingClient = this.prisma) {
    const ratings = side === "provider" ? await this.ratingsFor(records, client) : new Map();
    return records.map((record) => this.card(record, side, ratings.get(record.clientId) ?? null));
  }

  async detail(record: BookingRecord, viewer: Actor, client: RatingClient = this.prisma) {
    const side: BookingSide = record.clientId === viewer.id ? "client" : "provider";
    const [ratings, placeChain] = await Promise.all([
      side === "provider" ? this.ratingsFor([record], client) : Promise.resolve(new Map()),
      this.places.chain(record.placeId),
    ]);
    const internal = side === "provider";

    return {
      ...this.card(record, side, ratings.get(record.clientId) ?? null),
      providerId: record.providerId,
      clientId: record.clientId,
      clientPhone: record.clientPhone,
      clientNotes: record.clientNotes,
      providerNotes: internal ? record.providerNotes : null,
      placeId: record.placeId,
      placeChain,
      addressLine: record.addressLine,
      latitude: record.latitude,
      longitude: record.longitude,
      commissionPct: internal ? record.commissionPct : null,
      commissionAmt: internal ? record.commissionAmt : null,
      providerNetAmt: internal ? record.providerNetAmt : null,
      paidAt: record.paidAt,
      confirmedAt: record.confirmedAt,
      completedAt: record.completedAt,
      cancelledById: record.cancelledById,
      review: record.review,
      clientReview: record.clientReview,
    };
  }

  private card(
    record: BookingRecord,
    side: BookingSide,
    clientRating: { avg: number; count: number } | null,
  ) {
    const categoryLabel = record.subcategory?.name ?? record.provider.subcategory?.name ?? null;
    return {
      id: record.id,
      status: record.status,
      scheduledAt: record.scheduledAt,
      scheduledLocal: toLocalSlot(record.scheduledAt, record.timezone),
      durationMin: record.durationMin,
      timezone: record.timezone,
      createdAt: record.createdAt,
      agreedPrice: record.agreedPrice,
      isPaid: record.isPaid,
      cancelReason: record.cancelReason,
      cancelledAt: record.cancelledAt,
      side,
      counterpart:
        side === "client"
          ? {
              userId: record.provider.userId,
              providerId: record.provider.id,
              name: record.provider.displayName,
              photo: record.provider.profilePhoto,
              categoryLabel,
            }
          : {
              userId: record.client.id,
              providerId: null,
              name: fullName(record.client),
              photo: record.client.avatar,
              categoryLabel,
            },
      clientRating: side === "provider" ? clientRating : null,
      hasReview: Boolean(record.review),
      hasClientReview: Boolean(record.clientReview),
    };
  }

  private async ratingsFor(records: BookingRecord[], client: RatingClient) {
    const clientIds = [...new Set(records.map((record) => record.clientId))];
    const summaries = await Promise.all(
      clientIds.map(async (id) => [id, await clientRatingSummary(client, id)] as const),
    );
    return new Map(summaries);
  }
}

export type BookingCard = Awaited<ReturnType<BookingViewService["cards"]>>[number];
export type BookingDetail = Awaited<ReturnType<BookingViewService["detail"]>>;
