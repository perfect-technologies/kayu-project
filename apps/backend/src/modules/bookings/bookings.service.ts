import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { BookingStatus, FinalOfferStatus, Prisma } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import { PrismaService } from "../../database/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

type BookingQuery = {
  status?: BookingStatus;
  role: "client" | "provider";
  page: number;
  limit: number;
};

type CreateBookingBody = {
  providerId: string;
  title: string;
  description?: string;
  address?: string;
  city?: string;
  scheduledDate: Date;
  duration?: number;
  price?: number;
  clientNotes?: string;
  subcategoryId?: string;
  commune?: string;
};

type FinalOfferQuery = {
  status?: FinalOfferStatus;
  conversationId?: string;
  bookingId?: string;
  page: number;
  limit: number;
};

type CreateFinalOfferBody = {
  providerId: string;
  clientId: string;
  conversationId?: string;
  bookingId?: string;
  title: string;
  description?: string;
  price: number;
  duration?: number;
  scheduledDate: Date;
  address?: string;
  city?: string;
  notes?: string;
  paymentMethod?: "cash";
  expiresAt?: Date;
};

type UpdateBookingBody = {
  status?: BookingStatus;
  cancelReason?: string;
  providerNotes?: string;
  isPaid?: true;
  paymentMethod?: "cash";
};

const participantUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  avatar: true,
  isVerified: true,
} satisfies Prisma.UserSelect;

const bookingInclude = {
  client: {
    select: participantUserSelect,
  },
  provider: {
    select: {
      id: true,
      userId: true,
      profession: true,
      user: {
        select: participantUserSelect,
      },
    },
  },
  review: {
    select: {
      id: true,
      bookingId: true,
      clientId: true,
      providerId: true,
      overallScore: true,
      comment: true,
      isPublic: true,
      createdAt: true,
    },
  },
  clientReview: {
    select: {
      id: true,
      bookingId: true,
      clientId: true,
      providerId: true,
      paymentTimeliness: true,
      communication: true,
      respectfulness: true,
      comment: true,
      isPublic: true,
      createdAt: true,
    },
  },
} satisfies Prisma.BookingInclude;

const bookingDetailInclude = {
  ...bookingInclude,
  review: {
    include: {
      client: {
        select: participantUserSelect,
      },
      booking: {
        select: {
          title: true,
        },
      },
    },
  },
} satisfies Prisma.BookingInclude;

const finalOfferInclude = {
  client: {
    select: participantUserSelect,
  },
  provider: {
    select: {
      id: true,
      userId: true,
      profession: true,
      user: {
        select: participantUserSelect,
      },
    },
  },
  booking: {
    select: {
      id: true,
      title: true,
      status: true,
      scheduledDate: true,
      price: true,
      commissionPct: true,
      commissionAmt: true,
      providerNetAmt: true,
    },
  },
} satisfies Prisma.FinalOfferInclude;

type BookingRecord = Prisma.BookingGetPayload<{
  include: typeof bookingInclude;
}>;

type BookingDetailRecord = Prisma.BookingGetPayload<{
  include: typeof bookingDetailInclude;
}>;

type FinalOfferRecord = Prisma.FinalOfferGetPayload<{
  include: typeof finalOfferInclude;
}>;

type BookingAccessRecord = Prisma.BookingGetPayload<{
  include: {
    provider: {
      select: {
        id: true;
        userId: true;
      };
    };
  };
}>;

const OFFLINE_PAYMENT_PENDING_NOTE =
  "Paiement en especes a confirmer avant disponibilite.";
const OFFLINE_PAYMENT_CONFIRMED_NOTE =
  "Paiement en especes confirme.";
const DEFAULT_COMMISSION_PCT = 10;

type CommissionEconomics = {
  grossAmount: number;
  commissionPct: number;
  commissionAmt: number;
  providerNetAmt: number;
};

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(actor: Actor, query: BookingQuery) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;
    const where = await this.buildWhere(actor, query);

    const [total, bookings] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: "desc" }],
        include: bookingInclude,
      }),
    ]);

    return {
      success: true as const,
      bookings: bookings.map((booking) => this.mapBooking(booking)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  async create(actor: Actor, body: CreateBookingBody) {
    const provider = await this.prisma.provider.findUnique({
      where: { id: body.providerId },
      select: {
        id: true,
        userId: true,
        isAvailable: true,
      },
    });

    if (!provider) {
      throw new NotFoundException("Provider not found");
    }

    if (provider.userId === actor.id) {
      throw new BadRequestException("You cannot book yourself");
    }

    if (!provider.isAvailable) {
      throw new BadRequestException("Provider is not available");
    }

    const slotStart = body.scheduledDate;
    const slotDuration = body.duration ?? 60;
    const slotEnd = new Date(slotStart.getTime() + slotDuration * 60_000);

    const dayStart = new Date(slotStart);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const sameDay = await this.prisma.booking.findMany({
      where: {
        providerId: body.providerId,
        status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
        scheduledDate: { gte: dayStart, lt: dayEnd },
      },
      select: { scheduledDate: true, duration: true },
    });

    const conflict = sameDay.some((b) => {
      if (!b.scheduledDate) return false;
      const bStart = b.scheduledDate.getTime();
      const bEnd = bStart + ((b.duration ?? 60) * 60_000);
      return slotStart.getTime() < bEnd && slotEnd.getTime() > bStart;
    });

    if (conflict) {
      throw new ConflictException("SLOT_TAKEN: this slot is no longer available");
    }

    const booking = await this.prisma.$transaction(async (tx) => {
      const economics = calculateCommissionEconomics(body.price);
      const created = await tx.booking.create({
        data: {
          clientId: actor.id,
          providerId: body.providerId,
          title: body.title,
          description: body.description ?? null,
          address: body.address ?? null,
          city: body.city ?? null,
          scheduledDate: body.scheduledDate,
          duration: body.duration ?? null,
          price: body.price ?? null,
          commissionPct: economics.commissionPct,
          commissionAmt: economics.commissionAmt,
          providerNetAmt: economics.providerNetAmt,
          clientNotes: body.clientNotes ?? null,
          subcategoryId: body.subcategoryId ?? null,
          commune: body.commune ?? null,
          status: "PENDING",
        },
        include: bookingInclude,
      });

      await this.notifications.create(
        {
          userId: provider.userId,
          type: "BOOKING_NEW",
          title: "Nouvelle reservation",
          message: `${this.getDisplayName(actor)} souhaite vous reserver pour "${body.title}"`,
          data: {
            bookingId: created.id,
          },
        },
        tx,
      );

      return created;
    });

    return {
      success: true as const,
      booking: this.mapBooking(booking),
    };
  }

  async findFinalOffers(actor: Actor, query: FinalOfferQuery) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;
    const where = await this.buildFinalOfferWhere(actor, query);

    const [total, finalOffers] = await Promise.all([
      this.prisma.finalOffer.count({ where }),
      this.prisma.finalOffer.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: "desc" }],
        include: finalOfferInclude,
      }),
    ]);

    return {
      success: true as const,
      finalOffers: finalOffers.map((offer) => this.mapFinalOffer(offer)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  async createFinalOffer(actor: Actor, body: CreateFinalOfferBody) {
    if (body.paymentMethod && body.paymentMethod !== "cash") {
      throw new BadRequestException("Final offers only support cash payment");
    }

    const provider = await this.getProviderForFinalOffer(actor, body.providerId);

    if (provider.userId === body.clientId) {
      throw new BadRequestException("You cannot send a final offer to yourself");
    }

    const client = await this.prisma.user.findUnique({
      where: { id: body.clientId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!client) {
      throw new NotFoundException("Client not found");
    }

    if (client.role !== "CLIENT") {
      throw new BadRequestException("Final offers can only be sent to clients");
    }

    await this.assertConversationMatchesParticipants(
      body.conversationId,
      body.clientId,
      provider.userId,
    );

    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const bookingId = body.bookingId ?? null;
      const existingBooking = bookingId
        ? await this.getFinalOfferBookingForMutation(
            tx,
            bookingId,
            body.clientId,
            body.providerId,
          )
        : null;

      if (bookingId) {
        await tx.finalOffer.updateMany({
          where: {
            providerId: body.providerId,
            clientId: body.clientId,
            bookingId,
            status: { in: ["PENDING", "ACCEPTED"] },
          },
          data: {
            status: "CANCELLED",
            cancelledAt: now,
          },
        });
      }

      if (!bookingId && body.conversationId) {
        await tx.finalOffer.updateMany({
          where: {
            providerId: body.providerId,
            clientId: body.clientId,
            conversationId: body.conversationId,
            bookingId: null,
            status: "PENDING",
          },
          data: {
            status: "CANCELLED",
            cancelledAt: now,
          },
        });
      }

      const economics = calculateCommissionEconomics(body.price);
      const created = await tx.finalOffer.create({
        data: {
          providerId: body.providerId,
          clientId: body.clientId,
          conversationId: body.conversationId ?? null,
          bookingId,
          title: body.title,
          description: body.description ?? null,
          price: body.price,
          duration: body.duration ?? null,
          scheduledDate: body.scheduledDate,
          address: body.address ?? null,
          city: body.city ?? null,
          notes: body.notes ?? null,
          paymentMethod: "cash",
          commissionPct: economics.commissionPct,
          commissionAmt: economics.commissionAmt,
          providerNetAmt: economics.providerNetAmt,
          expiresAt: body.expiresAt ?? null,
          status: "ACCEPTED",
          acceptedAt: now,
        },
        include: finalOfferInclude,
      });

      const booking = existingBooking
        ? await this.updateBookingFromFinalOffer(
            tx,
            created,
            existingBooking.status,
            now,
          )
        : await this.createBookingFromFinalOffer(tx, created, now);

      const updatedOffer = await tx.finalOffer.update({
        where: { id: created.id },
        data: {
          bookingId: booking.id,
        },
        include: finalOfferInclude,
      });

      await this.notifications.create(
        {
          userId: body.clientId,
          type: "FINAL_OFFER_RECEIVED",
          title: "Accord final enregistre",
          message: `${this.getDisplayName(actor)} a enregistre l'accord final pour "${body.title}"`,
          data: {
            finalOfferId: updatedOffer.id,
            bookingId: booking.id,
            conversationId: created.conversationId ?? undefined,
            paymentMethod: "cash",
            status: "ACCEPTED",
          },
        },
        tx,
      );

      await this.notifications.create(
        {
          userId: provider.userId,
          type: "FINAL_OFFER_ACCEPTED",
          title: "Reservation confirmee",
          message: `L'accord final pour "${body.title}" a confirme la reservation`,
          data: {
            finalOfferId: updatedOffer.id,
            bookingId: booking.id,
            conversationId: created.conversationId ?? undefined,
            paymentMethod: "cash",
            status: "CONFIRMED",
          },
        },
        tx,
      );

      return { finalOffer: updatedOffer, booking };
    });

    return {
      success: true as const,
      finalOffer: this.mapFinalOffer(result.finalOffer),
      booking: this.mapBooking(result.booking),
    };
  }

  async findFinalOfferById(actor: Actor, id: string) {
    const finalOffer = await this.prisma.finalOffer.findUnique({
      where: { id },
      include: finalOfferInclude,
    });

    if (!finalOffer) {
      throw new NotFoundException("Final offer not found");
    }

    this.assertFinalOfferAccess(actor, finalOffer);

    return {
      success: true as const,
      finalOffer: this.mapFinalOffer(finalOffer),
    };
  }

  async acceptFinalOffer(actor: Actor, id: string) {
    const existing = await this.prisma.finalOffer.findUnique({
      where: { id },
      include: finalOfferInclude,
    });

    if (!existing) {
      throw new NotFoundException("Final offer not found");
    }

    this.assertFinalOfferClient(actor, existing);

    const now = new Date();
    if (existing.status === "ACCEPTED") {
      const booking = existing.bookingId
        ? await this.prisma.booking.findUnique({
            where: { id: existing.bookingId },
            include: bookingInclude,
          })
        : null;

      if (!booking) {
        throw new BadRequestException("Accepted final offer is missing a booking");
      }

      return {
        success: true as const,
        finalOffer: this.mapFinalOffer(existing),
        booking: this.mapBooking(booking),
      };
    }

    if (existing.expiresAt && existing.expiresAt < now) {
      await this.prisma.finalOffer.update({
        where: { id },
        data: { status: "EXPIRED" },
      });
      throw new BadRequestException("Final offer has expired");
    }

    return this.prisma.$transaction(async (tx) => {
      const finalOffer = await tx.finalOffer.findUnique({
        where: { id },
        include: finalOfferInclude,
      });

      if (!finalOffer) {
        throw new NotFoundException("Final offer not found");
      }

      this.assertFinalOfferClient(actor, finalOffer);

      if (finalOffer.status === "ACCEPTED") {
        const booking = finalOffer.bookingId
          ? await tx.booking.findUnique({
              where: { id: finalOffer.bookingId },
              include: bookingInclude,
            })
          : null;

        if (!booking) {
          throw new BadRequestException("Accepted final offer is missing a booking");
        }

        return {
          success: true as const,
          finalOffer: this.mapFinalOffer(finalOffer),
          booking: this.mapBooking(booking),
        };
      }

      if (finalOffer.status !== "PENDING") {
        throw new BadRequestException("Only pending final offers can be accepted");
      }

      const booking = finalOffer.bookingId
        ? await this.confirmBookingFromFinalOffer(tx, finalOffer, now)
        : await this.createBookingFromFinalOffer(tx, finalOffer, now);

      const updatedOffer = await tx.finalOffer.update({
        where: { id },
        data: {
          status: "ACCEPTED",
          acceptedAt: now,
          bookingId: booking.id,
        },
        include: finalOfferInclude,
      });

      if (finalOffer.bookingId) {
        await tx.finalOffer.updateMany({
          where: {
            bookingId: finalOffer.bookingId,
            id: { not: id },
            status: "PENDING",
          },
          data: {
            status: "CANCELLED",
            cancelledAt: now,
          },
        });
      }

      await this.notifications.create(
        {
          userId: finalOffer.provider.userId,
          type: "FINAL_OFFER_ACCEPTED",
          title: "Offre finale acceptee",
          message: `Votre offre finale pour "${finalOffer.title}" a ete acceptee`,
          data: {
            finalOfferId: id,
            bookingId: booking.id,
            status: "ACCEPTED",
          },
        },
        tx,
      );

      return {
        success: true as const,
        finalOffer: this.mapFinalOffer(updatedOffer),
        booking: this.mapBooking(booking),
      };
    });
  }

  async declineFinalOffer(actor: Actor, id: string) {
    const existing = await this.prisma.finalOffer.findUnique({
      where: { id },
      include: finalOfferInclude,
    });

    if (!existing) {
      throw new NotFoundException("Final offer not found");
    }

    this.assertFinalOfferClient(actor, existing);

    if (existing.status !== "PENDING") {
      throw new BadRequestException("Only pending final offers can be declined");
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.finalOffer.update({
        where: { id },
        data: {
          status: "DECLINED",
          declinedAt: new Date(),
        },
        include: finalOfferInclude,
      });

      await this.notifications.create(
        {
          userId: existing.provider.userId,
          type: "FINAL_OFFER_DECLINED",
          title: "Offre finale refusee",
          message: `Votre offre finale pour "${existing.title}" a ete refusee`,
          data: {
            finalOfferId: id,
            bookingId: existing.bookingId ?? undefined,
            status: "DECLINED",
          },
        },
        tx,
      );

      return saved;
    });

    return {
      success: true as const,
      finalOffer: this.mapFinalOffer(updated),
    };
  }

  async findById(actor: Actor, id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: bookingDetailInclude,
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    this.assertBookingAccess(actor, booking);

    return {
      success: true as const,
      booking: this.mapBookingDetail(booking),
    };
  }

  async update(actor: Actor, id: string, body: UpdateBookingBody) {
    const booking = await this.getBookingForMutation(id);
    this.assertBookingAccess(actor, booking);

    const updateData = this.buildUpdateData(actor, booking, body);

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException("No valid booking changes provided");
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const completedNow =
        updateData.status === "COMPLETED" && booking.status !== "COMPLETED";
      const paymentConfirmedNow =
        updateData.isPaid === true && booking.isPaid !== true;

      if (updateData.status === "COMPLETED" && booking.status !== "COMPLETED") {
        await tx.provider.update({
          where: { id: booking.providerId },
          data: {
            totalJobs: {
              increment: 1,
            },
          },
        });
      }

      const saved = await tx.booking.update({
        where: { id },
        data: updateData,
        include: bookingDetailInclude,
      });

      if (completedNow) {
        await this.createEarningTransaction(tx, saved);
      }

      if (paymentConfirmedNow && !completedNow) {
        await this.completeEarningTransaction(tx, saved);
      }

      if (typeof updateData.status === "string") {
        await this.createStatusNotification(tx, booking, actor, updateData.status);
      }

      if (paymentConfirmedNow) {
        await this.createPaymentNotification(tx, saved, actor);
      }

      return saved;
    });

    return {
      success: true as const,
      booking: this.mapBooking(updated),
    };
  }

  async cancel(actor: Actor, id: string) {
    const booking = await this.getBookingForMutation(id);
    this.assertBookingAccess(actor, booking);

    if (!this.canCancel(booking.status)) {
      throw new BadRequestException("Only pending or confirmed bookings can be cancelled");
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.booking.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelledBy: actor.id,
        },
        include: bookingDetailInclude,
      });

      await this.createStatusNotification(tx, booking, actor, "CANCELLED");

      return saved;
    });

    return {
      success: true as const,
      booking: this.mapBooking(updated),
    };
  }

  private async buildFinalOfferWhere(
    actor: Actor,
    query: FinalOfferQuery,
  ): Promise<Prisma.FinalOfferWhereInput> {
    const filters: Prisma.FinalOfferWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.conversationId ? { conversationId: query.conversationId } : {}),
      ...(query.bookingId ? { bookingId: query.bookingId } : {}),
    };

    if (actor.role === "ADMIN") {
      return filters;
    }

    if (actor.role === "PROVIDER") {
      const provider = await this.prisma.provider.findUnique({
        where: { userId: actor.id },
        select: { id: true },
      });

      if (!provider) {
        throw new BadRequestException("Provider profile is required");
      }

      return {
        ...filters,
        providerId: provider.id,
      };
    }

    return {
      ...filters,
      clientId: actor.id,
    };
  }

  private async getProviderForFinalOffer(actor: Actor, providerId: string) {
    if (actor.role !== "PROVIDER") {
      throw new ForbiddenException("Only providers can send final offers");
    }

    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!provider) {
      throw new NotFoundException("Provider not found");
    }

    if (provider.userId !== actor.id) {
      throw new ForbiddenException("You can only send your own final offers");
    }

    return provider;
  }

  private async assertConversationMatchesParticipants(
    conversationId: string | undefined,
    clientId: string,
    providerUserId: string,
  ) {
    if (!conversationId) {
      return;
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        user1Id: true,
        user2Id: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }

    const participantIds = [conversation.user1Id, conversation.user2Id];
    if (!participantIds.includes(clientId) || !participantIds.includes(providerUserId)) {
      throw new BadRequestException(
        "Conversation does not match the final offer participants",
      );
    }
  }

  private async getFinalOfferBookingForMutation(
    tx: Prisma.TransactionClient,
    bookingId: string,
    clientId: string,
    providerId: string,
  ) {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        clientId: true,
        providerId: true,
        status: true,
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    if (booking.clientId !== clientId || booking.providerId !== providerId) {
      throw new BadRequestException(
        "Booking does not match the final offer participants",
      );
    }

    if (booking.status === "COMPLETED" || booking.status === "CANCELLED") {
      throw new BadRequestException(
        "Completed or cancelled bookings cannot receive a final offer",
      );
    }

    return booking;
  }

  private assertFinalOfferAccess(
    actor: Actor,
    finalOffer: { clientId: string; provider: { userId: string } },
  ) {
    const isParticipant =
      finalOffer.clientId === actor.id || finalOffer.provider.userId === actor.id;

    if (!isParticipant && actor.role !== "ADMIN") {
      throw new ForbiddenException("You do not have access to this final offer");
    }
  }

  private assertFinalOfferClient(
    actor: Actor,
    finalOffer: { clientId: string },
  ) {
    if (finalOffer.clientId !== actor.id) {
      throw new ForbiddenException("Only the target client can update this final offer");
    }
  }

  private async confirmBookingFromFinalOffer(
    tx: Prisma.TransactionClient,
    finalOffer: FinalOfferRecord,
    now: Date,
  ): Promise<BookingRecord> {
    if (!finalOffer.bookingId) {
      throw new BadRequestException("Final offer is not attached to a booking");
    }

    const booking = await tx.booking.findUnique({
      where: { id: finalOffer.bookingId },
      select: {
        clientId: true,
        providerId: true,
        status: true,
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    if (
      booking.clientId !== finalOffer.clientId ||
      booking.providerId !== finalOffer.providerId
    ) {
      throw new BadRequestException(
        "Booking does not match the final offer participants",
      );
    }

    if (booking.status !== "PENDING") {
      throw new BadRequestException("Only pending bookings can be confirmed");
    }

    return tx.booking.update({
      where: { id: finalOffer.bookingId },
      data: this.buildBookingDataFromFinalOffer(finalOffer, now),
      include: bookingInclude,
    });
  }

  private async createBookingFromFinalOffer(
    tx: Prisma.TransactionClient,
    finalOffer: FinalOfferRecord,
    now: Date,
  ): Promise<BookingRecord> {
    return tx.booking.create({
      data: {
        clientId: finalOffer.clientId,
        providerId: finalOffer.providerId,
        ...this.buildBookingDataFromFinalOffer(finalOffer, now),
      },
      include: bookingInclude,
    });
  }

  private async updateBookingFromFinalOffer(
    tx: Prisma.TransactionClient,
    finalOffer: FinalOfferRecord,
    currentStatus: BookingStatus,
    now: Date,
  ): Promise<BookingRecord> {
    if (!finalOffer.bookingId) {
      throw new BadRequestException("Final offer is not attached to a booking");
    }

    return tx.booking.update({
      where: { id: finalOffer.bookingId },
      data: this.buildBookingDataFromFinalOffer(finalOffer, now, currentStatus),
      include: bookingInclude,
    });
  }

  private buildBookingDataFromFinalOffer(
    finalOffer: FinalOfferRecord,
    now: Date,
    currentStatus?: BookingStatus,
  ) {
    const shouldConfirm = !currentStatus || currentStatus === "PENDING";
    const economics = economicsFromRecord(finalOffer);

    return {
      title: finalOffer.title,
      description: finalOffer.description,
      address: finalOffer.address,
      city: finalOffer.city,
      scheduledDate: finalOffer.scheduledDate,
      duration: finalOffer.duration,
      price: finalOffer.price,
      commissionPct: economics.commissionPct,
      commissionAmt: economics.commissionAmt,
      providerNetAmt: economics.providerNetAmt,
      providerNotes: finalOffer.notes,
      paymentMethod: "cash",
      ...(shouldConfirm
        ? {
            status: "CONFIRMED" as const,
            confirmedAt: now,
          }
        : {}),
    };
  }

  private async buildWhere(actor: Actor, query: BookingQuery): Promise<Prisma.BookingWhereInput> {
    if (actor.role === "ADMIN") {
      return query.status ? { status: query.status } : {};
    }

    if (actor.role === "PROVIDER") {
      const provider = await this.prisma.provider.findUnique({
        where: { userId: actor.id },
        select: { id: true },
      });

      if (!provider) {
        throw new BadRequestException("Provider profile is required");
      }

      return {
        ...(query.status ? { status: query.status } : {}),
        providerId: provider.id,
      };
    }

    if (query.role === "provider") {
      const provider = await this.prisma.provider.findUnique({
        where: { userId: actor.id },
        select: { id: true },
      });

      if (!provider) {
        throw new BadRequestException("Provider profile is required");
      }

      return {
        ...(query.status ? { status: query.status } : {}),
        providerId: provider.id,
      };
    }

    return {
      ...(query.status ? { status: query.status } : {}),
      clientId: actor.id,
    };
  }

  private async getBookingForMutation(id: string): Promise<BookingAccessRecord> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        provider: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    return booking;
  }

  private buildUpdateData(
    actor: Actor,
    booking: BookingAccessRecord,
    body: UpdateBookingBody,
  ): Prisma.BookingUpdateInput {
    const updateData: Prisma.BookingUpdateInput = {};
    const isClient = booking.clientId === actor.id;
    const isProvider = booking.provider.userId === actor.id;
    const isAdmin = actor.role === "ADMIN";
    const paymentConfirmationRequested = body.isPaid === true;

    if (body.providerNotes !== undefined) {
      if (!isProvider && !isAdmin) {
        throw new ForbiddenException("Only the provider can update provider notes");
      }

      updateData.providerNotes = body.providerNotes;
    }

    if (body.status === "CANCELLED") {
      if (paymentConfirmationRequested || body.paymentMethod) {
        throw new BadRequestException(
          "Cancelled bookings cannot confirm payment",
        );
      }

      if (!isClient && !isProvider && !isAdmin) {
        throw new ForbiddenException("Only booking participants can cancel a booking");
      }

      if (!this.canCancel(booking.status)) {
        throw new BadRequestException("Only pending or confirmed bookings can be cancelled");
      }

      updateData.status = "CANCELLED";
      updateData.cancelReason = body.cancelReason ?? null;
      updateData.cancelledAt = new Date();
      updateData.cancelledBy = actor.id;
      return updateData;
    }

    if (paymentConfirmationRequested) {
      if (!isProvider && !isAdmin) {
        throw new ForbiddenException("Only the provider can confirm payment");
      }

      const willBeCompleted =
        booking.status === "COMPLETED" || body.status === "COMPLETED";

      if (!willBeCompleted) {
        throw new BadRequestException(
          "Payment can only be confirmed for completed bookings",
        );
      }

      if (booking.isPaid) {
        throw new BadRequestException("Payment is already confirmed");
      }

      updateData.isPaid = true;
      updateData.paidAt = new Date();
      updateData.paymentMethod = body.paymentMethod ?? booking.paymentMethod ?? "cash";
    } else if (body.paymentMethod) {
      throw new BadRequestException(
        "paymentMethod requires payment confirmation",
      );
    }

    if (!body.status) {
      return updateData;
    }

    if (!isProvider && !isAdmin) {
      throw new ForbiddenException("Only the provider can change this booking status");
    }

    if (body.status === "CONFIRMED" && booking.status === "PENDING") {
      updateData.status = "CONFIRMED";
      updateData.confirmedAt = new Date();
      return updateData;
    }

    if (body.status === "IN_PROGRESS" && booking.status === "CONFIRMED") {
      updateData.status = "IN_PROGRESS";
      updateData.startedAt = new Date();
      return updateData;
    }

    if (body.status === "COMPLETED" && booking.status === "IN_PROGRESS") {
      updateData.status = "COMPLETED";
      updateData.completedAt = new Date();
      return updateData;
    }

    throw new BadRequestException(
      `Invalid booking status transition from ${booking.status} to ${body.status}`,
    );
  }

  private assertBookingAccess(actor: Actor, booking: { clientId: string; provider: { userId: string } }) {
    const isParticipant =
      booking.clientId === actor.id || booking.provider.userId === actor.id;

    if (!isParticipant && actor.role !== "ADMIN") {
      throw new ForbiddenException("You do not have access to this booking");
    }
  }

  private canCancel(status: BookingStatus) {
    return status === "PENDING" || status === "CONFIRMED";
  }

  private async createEarningTransaction(
    tx: Prisma.TransactionClient,
    booking: BookingRecord,
  ) {
    const economics = economicsFromRecord(booking);
    if (economics.grossAmount <= 0) {
      return;
    }
    const isPaid = booking.isPaid === true;
    await tx.transaction.create({
      data: {
        providerId: booking.providerId,
        type: "EARNING",
        bookingId: booking.id,
        amount: economics.grossAmount,
        feeAmt: economics.commissionAmt,
        netAmt: economics.providerNetAmt,
        paymentMethod: booking.paymentMethod ?? "cash",
        status: isPaid ? "COMPLETED" : "PENDING",
        note: isPaid
          ? OFFLINE_PAYMENT_CONFIRMED_NOTE
          : OFFLINE_PAYMENT_PENDING_NOTE,
        occurredAt: new Date(),
      },
    });
  }

  private async completeEarningTransaction(
    tx: Prisma.TransactionClient,
    booking: BookingRecord,
  ) {
    const existing = await tx.transaction.findFirst({
      where: {
        providerId: booking.providerId,
        bookingId: booking.id,
        type: "EARNING",
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      await this.createEarningTransaction(tx, booking);
      return;
    }

    await tx.transaction.update({
      where: { id: existing.id },
      data: {
        paymentMethod: booking.paymentMethod ?? "cash",
        status: "COMPLETED",
        note: OFFLINE_PAYMENT_CONFIRMED_NOTE,
      },
    });
  }

  private async createStatusNotification(
    tx: Prisma.TransactionClient,
    booking: BookingAccessRecord,
    actor: Actor,
    status: BookingStatus,
  ) {
    const notification = this.getStatusNotificationPayload(booking.title, status);
    if (!notification) {
      return;
    }

    const targetUserId = booking.clientId === actor.id ? booking.provider.userId : booking.clientId;

    await this.notifications.create(
      {
        userId: targetUserId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: {
          bookingId: booking.id,
          status,
        },
      },
      tx,
    );
  }

  private async createPaymentNotification(
    tx: Prisma.TransactionClient,
    booking: BookingRecord,
    actor: Actor,
  ) {
    const targetUserId = booking.clientId === actor.id ? booking.provider.userId : booking.clientId;
    const paymentMethod = formatPaymentMethodLabel(booking.paymentMethod);

    await this.notifications.create(
      {
        userId: targetUserId,
        type: "PAYMENT_RECEIVED",
        title: "Paiement confirme",
        message: `Le paiement ${paymentMethod} de la reservation "${booking.title}" a ete confirme`,
        data: {
          bookingId: booking.id,
          paymentMethod: booking.paymentMethod ?? "cash",
          isPaid: true,
        },
      },
      tx,
    );
  }

  private getStatusNotificationPayload(title: string, status: BookingStatus) {
    switch (status) {
      case "CONFIRMED":
        return {
          type: "BOOKING_CONFIRMED" as const,
          title: "Reservation confirmee",
          message: `La reservation "${title}" a ete confirmee`,
        };
      case "IN_PROGRESS":
        return {
          type: "BOOKING_STARTED" as const,
          title: "Intervention demarree",
          message: `La reservation "${title}" est maintenant en cours`,
        };
      case "COMPLETED":
        return {
          type: "BOOKING_COMPLETED" as const,
          title: "Reservation terminee",
          message: `La reservation "${title}" a ete marquee comme terminee`,
        };
      case "CANCELLED":
        return {
          type: "BOOKING_CANCELLED" as const,
          title: "Reservation annulee",
          message: `La reservation "${title}" a ete annulee`,
        };
      default:
        return null;
    }
  }

  private mapBooking(booking: BookingRecord) {
    return {
      id: booking.id,
      clientId: booking.clientId,
      providerId: booking.providerId,
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
      commissionPct: booking.commissionPct,
      commissionAmt: booking.commissionAmt,
      providerNetAmt: booking.providerNetAmt,
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
      cancelledByRole: this.getCancelledByRole(booking),
      reviewed: Boolean(booking.review),
      myRating: booking.review ? this.roundRating(booking.review.overallScore) : null,
      clientReviewed: Boolean(booking.clientReview),
      clientRating: booking.clientReview
        ? this.roundClientRating(booking.clientReview)
        : null,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      client: booking.client,
      provider: booking.provider,
    };
  }

  private mapBookingDetail(booking: BookingDetailRecord) {
    return {
      ...this.mapBooking(booking),
      review: booking.review
        ? {
            id: booking.review.id,
            bookingId: booking.review.bookingId,
            clientId: booking.review.clientId,
            providerId: booking.review.providerId,
            rating: this.roundRating(booking.review.overallScore),
            punctuality: booking.review.punctuality,
            quality: booking.review.quality,
            communication: booking.review.communication,
            value: booking.review.value,
            professionalism: booking.review.professionalism,
            overallScore: booking.review.overallScore,
            satisfactionTags: booking.review.satisfactionTags
              ? JSON.stringify(booking.review.satisfactionTags)
              : null,
            comment: booking.review.comment,
            reply: booking.review.reply,
            repliedAt: booking.review.repliedAt,
            isPublic: booking.review.isPublic,
            isEdited: booking.review.isEdited,
            createdAt: booking.review.createdAt,
            updatedAt: booking.review.updatedAt,
            client: booking.review.client,
            service: booking.review.booking.title,
          }
        : null,
      clientReview: booking.clientReview
        ? {
            id: booking.clientReview.id,
            bookingId: booking.clientReview.bookingId,
            clientId: booking.clientReview.clientId,
            providerId: booking.clientReview.providerId,
            rating: this.roundClientRating(booking.clientReview),
            paymentRating: booking.clientReview.paymentTimeliness,
            paymentTimeliness: booking.clientReview.paymentTimeliness,
            comment: booking.clientReview.comment,
            isPublic: booking.clientReview.isPublic,
            createdAt: booking.clientReview.createdAt,
          }
        : null,
    };
  }

  private mapFinalOffer(finalOffer: FinalOfferRecord) {
    return {
      id: finalOffer.id,
      providerId: finalOffer.providerId,
      clientId: finalOffer.clientId,
      conversationId: finalOffer.conversationId,
      bookingId: finalOffer.bookingId,
      title: finalOffer.title,
      description: finalOffer.description,
      price: finalOffer.price,
      duration: finalOffer.duration,
      scheduledDate: finalOffer.scheduledDate,
      address: finalOffer.address,
      city: finalOffer.city,
      notes: finalOffer.notes,
      paymentMethod: "cash" as const,
      commissionPct: finalOffer.commissionPct,
      commissionAmt: finalOffer.commissionAmt,
      providerNetAmt: finalOffer.providerNetAmt,
      status: finalOffer.status,
      sentAt: finalOffer.sentAt,
      acceptedAt: finalOffer.acceptedAt,
      declinedAt: finalOffer.declinedAt,
      cancelledAt: finalOffer.cancelledAt,
      expiresAt: finalOffer.expiresAt,
      createdAt: finalOffer.createdAt,
      updatedAt: finalOffer.updatedAt,
      client: finalOffer.client,
      provider: finalOffer.provider,
      booking: finalOffer.booking,
    };
  }

  private roundRating(value: number) {
    return Math.round(value * 10) / 10;
  }

  private roundClientRating(review: {
    communication: number | null;
    respectfulness: number | null;
  }) {
    const ratings = [review.communication, review.respectfulness].filter(
      (value): value is number => typeof value === "number",
    );

    if (ratings.length === 0) {
      return null;
    }

    return this.roundRating(
      ratings.reduce((sum, value) => sum + value, 0) / ratings.length,
    );
  }

  private getCancelledByRole(booking: {
    cancelledBy: string | null;
    clientId: string;
    provider: { userId: string };
  }) {
    if (!booking.cancelledBy) {
      return null;
    }

    if (booking.cancelledBy === booking.clientId) {
      return "client";
    }

    if (booking.cancelledBy === booking.provider.userId) {
      return "provider";
    }

    return "admin";
  }

  private getDisplayName(actor: Actor) {
    const fullName = `${actor.firstName ?? ""} ${actor.lastName ?? ""}`.trim();
    return fullName || "Un client";
  }
}

function formatPaymentMethodLabel(
  paymentMethod: "cash" | string | null | undefined,
) {
  switch (paymentMethod?.toLowerCase()) {
    case "cash":
    default:
      return "en especes";
  }
}

function calculateCommissionEconomics(
  price: number | null | undefined,
  commissionPct = DEFAULT_COMMISSION_PCT,
): CommissionEconomics {
  const grossAmount = Math.max(0, Math.round(price ?? 0));
  const commissionAmt = Math.round((grossAmount * commissionPct) / 100);

  return {
    grossAmount,
    commissionPct,
    commissionAmt,
    providerNetAmt: grossAmount - commissionAmt,
  };
}

function economicsFromRecord(record: {
  price?: number | null;
  commissionPct?: number | null;
  commissionAmt?: number | null;
  providerNetAmt?: number | null;
}): CommissionEconomics {
  const computed = calculateCommissionEconomics(
    record.price,
    record.commissionPct ?? DEFAULT_COMMISSION_PCT,
  );

  if (
    computed.grossAmount > 0 &&
    typeof record.commissionAmt === "number" &&
    typeof record.providerNetAmt === "number" &&
    (record.commissionAmt > 0 || record.providerNetAmt > 0)
  ) {
    return {
      ...computed,
      commissionAmt: record.commissionAmt,
      providerNetAmt: record.providerNetAmt,
    };
  }

  return computed;
}
