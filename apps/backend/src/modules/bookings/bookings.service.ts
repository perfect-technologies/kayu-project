import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { BookingStatus, Prisma } from "@prisma/client";
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
};

type UpdateBookingBody = {
  status?: BookingStatus;
  cancelReason?: string;
  providerNotes?: string;
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
  service: {
    select: {
      id: true,
      name: true,
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
          service: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.BookingInclude;

type BookingRecord = Prisma.BookingGetPayload<{
  include: typeof bookingInclude;
}>;

type BookingDetailRecord = Prisma.BookingGetPayload<{
  include: typeof bookingDetailInclude;
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

    const booking = await this.prisma.$transaction(async (tx) => {
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
          clientNotes: body.clientNotes ?? null,
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

      if (
        updateData.status === "COMPLETED" &&
        booking.status !== "COMPLETED"
      ) {
        await this.createEarningTransaction(tx, saved);
      }

      if (typeof updateData.status === "string") {
        await this.createStatusNotification(tx, booking, actor, updateData.status);
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

    if (body.providerNotes !== undefined) {
      if (!isProvider && !isAdmin) {
        throw new ForbiddenException("Only the provider can update provider notes");
      }

      updateData.providerNotes = body.providerNotes;
    }

    if (!body.status) {
      return updateData;
    }

    if (body.status === "CANCELLED") {
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
    const price = Math.round(booking.price ?? 0);
    if (price <= 0) {
      return;
    }
    const feeAmt = Math.round(price * 0.1);
    const netAmt = price - feeAmt;
    const isPaid = booking.isPaid === true;
    await tx.transaction.create({
      data: {
        providerId: booking.providerId,
        type: "EARNING",
        bookingId: booking.id,
        amount: price,
        feeAmt,
        netAmt,
        paymentMethod: booking.paymentMethod ?? "cash",
        status: isPaid ? "COMPLETED" : "PENDING",
        occurredAt: new Date(),
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
      service: booking.service,
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
            service:
              booking.review.booking.service?.name ?? booking.review.booking.title,
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
