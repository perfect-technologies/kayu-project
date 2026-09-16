import { HttpStatus, Injectable } from "@nestjs/common";
import type { ClientReview, Review } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import type {
  CreateClientReviewInput,
  CreateReviewInput,
  ReplyReviewInput,
} from "../../common/contract";
import { apiError, notFound } from "../../common/http/errors";
import { isUniqueViolation, lockRow } from "../../common/util/db";
import { fullName } from "../../common/util/people";
import { PrismaService } from "../../database/prisma.service";
import { BookingViewService, bookingInclude } from "../bookings/booking-view.service";
import { NotificationsService } from "../notifications/notifications.service";
import { toLocalSlot } from "../providers/schedule";
import { SiteSettingsService } from "../settings/site-settings.service";
import { clientRatingSummary, recomputeProviderAggregates } from "./rating-aggregates";

const MINE_LIMIT = 100;

const alreadyExists = () =>
  apiError(HttpStatus.CONFLICT, "ALREADY_EXISTS", "Un avis existe déjà pour cette réservation.");

const notCompleted = () =>
  apiError(
    HttpStatus.CONFLICT,
    "BOOKING_NOT_COMPLETED",
    "La prestation doit être terminée avant de laisser un avis.",
  );

export function mapReview(review: Review) {
  return {
    id: review.id,
    bookingId: review.bookingId,
    providerId: review.providerId,
    clientId: review.clientId,
    rating: review.rating,
    comment: review.comment,
    reply: review.reply,
    repliedAt: review.repliedAt,
    isPublic: review.isPublic,
    createdAt: review.createdAt,
  };
}

export function mapClientReview(review: ClientReview) {
  return {
    id: review.id,
    bookingId: review.bookingId,
    providerId: review.providerId,
    clientId: review.clientId,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
  };
}

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SiteSettingsService,
    private readonly notifications: NotificationsService,
    private readonly view: BookingViewService,
  ) {}

  async create(actor: Actor, input: CreateReviewInput) {
    if (!(await this.settings.getBoolean("feat_reviews"))) {
      throw apiError(
        HttpStatus.FORBIDDEN,
        "FEATURE_DISABLED",
        "Les avis sont momentanément indisponibles.",
      );
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: input.bookingId },
      select: {
        id: true,
        clientId: true,
        providerId: true,
        status: true,
        provider: { select: { userId: true } },
        review: { select: { id: true } },
      },
    });
    if (!booking || booking.clientId !== actor.id) throw notFound("Réservation introuvable");
    if (booking.status !== "COMPLETED") throw notCompleted();
    if (booking.review) throw alreadyExists();

    try {
      const review = await this.prisma.$transaction(async (tx) => {
        await lockRow(tx, "Provider", booking.providerId);
        const created = await tx.review.create({
          data: {
            bookingId: booking.id,
            clientId: actor.id,
            providerId: booking.providerId,
            rating: input.rating,
            comment: input.comment ?? null,
          },
        });
        await recomputeProviderAggregates(tx, booking.providerId);
        await this.notifications.create(
          {
            userId: booking.provider.userId,
            type: "NEW_REVIEW",
            title: "Nouvel avis",
            message: `${fullName(actor, "Un client")} vous a attribué ${input.rating}/5.`,
            data: { bookingId: booking.id, reviewId: created.id },
          },
          tx,
        );
        return created;
      });
      return mapReview(review);
    } catch (error) {
      if (isUniqueViolation(error)) throw alreadyExists();
      throw error;
    }
  }

  async mine(actor: Actor) {
    const [reviews, pending] = await Promise.all([
      this.prisma.review.findMany({
        where: { clientId: actor.id },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: MINE_LIMIT,
        include: {
          provider: { select: { id: true, displayName: true, profilePhoto: true } },
          booking: { select: { id: true, scheduledAt: true, timezone: true } },
        },
      }),
      this.prisma.booking.findMany({
        where: { clientId: actor.id, status: "COMPLETED", review: { is: null } },
        orderBy: [{ scheduledAt: "desc" }, { id: "desc" }],
        take: MINE_LIMIT,
        include: bookingInclude,
      }),
    ]);

    return {
      reviews: reviews.map((review) => ({
        ...mapReview(review),
        provider: review.provider,
        booking: {
          id: review.booking.id,
          scheduledAt: review.booking.scheduledAt,
          scheduledLocal: toLocalSlot(review.booking.scheduledAt, review.booking.timezone),
        },
      })),
      toReview: await this.view.cards(pending, "client"),
    };
  }

  async reply(actor: Actor, reviewId: string, input: ReplyReviewInput) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { provider: { select: { userId: true } } },
    });
    if (!review || review.provider.userId !== actor.id) throw notFound("Avis introuvable");

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { reply: input.reply, repliedAt: new Date() },
    });
    return mapReview(updated);
  }

  async createClientReview(actor: Actor, input: CreateClientReviewInput) {
    const provider = await this.prisma.provider.findUnique({
      where: { userId: actor.id },
      select: { id: true, displayName: true },
    });
    if (!provider) throw notFound("Profil prestataire introuvable");

    const booking = await this.prisma.booking.findUnique({
      where: { id: input.bookingId },
      select: {
        id: true,
        clientId: true,
        providerId: true,
        status: true,
        clientReview: { select: { id: true } },
      },
    });
    if (!booking || booking.providerId !== provider.id) throw notFound("Réservation introuvable");
    if (booking.status !== "COMPLETED") throw notCompleted();
    if (booking.clientReview) throw alreadyExists();

    try {
      const review = await this.prisma.$transaction(async (tx) => {
        const created = await tx.clientReview.create({
          data: {
            bookingId: booking.id,
            providerId: provider.id,
            clientId: booking.clientId,
            rating: input.rating,
            comment: input.comment ?? null,
          },
        });
        await this.notifications.create(
          {
            userId: booking.clientId,
            type: "NEW_CLIENT_REVIEW",
            title: "Vous avez reçu une note",
            message: `${provider.displayName} vous a attribué ${input.rating}/5.`,
            data: { bookingId: booking.id, clientReviewId: created.id },
          },
          tx,
        );
        return created;
      });
      return mapClientReview(review);
    } catch (error) {
      if (isUniqueViolation(error)) throw alreadyExists();
      throw error;
    }
  }

  async clientSummary(clientId: string) {
    return { clientId, ...(await clientRatingSummary(this.prisma, clientId)) };
  }
}
