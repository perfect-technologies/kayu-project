import { HttpStatus, Injectable } from "@nestjs/common";
import type { BookingStatus, Prisma } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import type {
  BookingsQuery,
  CompleteBookingInput,
  CreateBookingInput,
  UpdateBookingNotesInput,
} from "../../common/contract";
import { apiError, notFound } from "../../common/http/errors";
import { pageArgs, toPage } from "../../common/http/pagination";
import { isUniqueViolation, lockRow } from "../../common/util/db";
import { fullName } from "../../common/util/people";
import { PrismaService } from "../../database/prisma.service";
import { ActivityLogService } from "../activity/activity-log.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PlaceTreeService } from "../places/place-tree.service";
import { ProvidersAvailabilityService } from "../providers/providers-availability.service";
import { localSlotToInstant } from "../providers/schedule";
import { SafetyService } from "../safety/safety.service";
import { SiteSettingsService } from "../settings/site-settings.service";
import {
  type BookingDetail,
  type BookingRecord,
  BookingViewService,
  bookingInclude,
  formatSlotLabel,
} from "./booking-view.service";

type Tx = Prisma.TransactionClient;

const CANCELLABLE: BookingStatus[] = ["PENDING", "CONFIRMED"];

const slotTaken = () =>
  apiError(HttpStatus.CONFLICT, "SLOT_TAKEN", "Ce créneau n'est plus disponible.");

const invalidTransition = () =>
  apiError(
    HttpStatus.CONFLICT,
    "INVALID_TRANSITION",
    "Cette action n'est pas possible pour le statut actuel de la réservation.",
  );

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: ProvidersAvailabilityService,
    private readonly places: PlaceTreeService,
    private readonly safety: SafetyService,
    private readonly settings: SiteSettingsService,
    private readonly notifications: NotificationsService,
    private readonly activity: ActivityLogService,
    private readonly view: BookingViewService,
  ) {}

  async create(actor: Actor, input: CreateBookingInput): Promise<BookingDetail> {
    if (!(await this.settings.getBoolean("feat_booking"))) {
      throw apiError(
        HttpStatus.FORBIDDEN,
        "FEATURE_DISABLED",
        "La réservation est momentanément indisponible.",
      );
    }

    const provider = await this.prisma.provider.findUnique({
      where: { id: input.providerId },
      select: {
        id: true,
        userId: true,
        hidden: true,
        isAvailable: true,
        subcategoryId: true,
        user: { select: { isActive: true } },
      },
    });
    if (!provider || provider.hidden || !provider.user.isActive) {
      throw notFound("Prestataire introuvable");
    }
    if (provider.userId === actor.id) {
      throw apiError(HttpStatus.BAD_REQUEST, "SELF_ACTION", "Vous ne pouvez pas vous réserver vous-même.");
    }
    if (await this.safety.isBlocked(actor.id, provider.userId)) {
      throw apiError(HttpStatus.FORBIDDEN, "BLOCKED", "Cette interaction est bloquée.");
    }
    if (!provider.isAvailable) {
      throw apiError(
        HttpStatus.CONFLICT,
        "PROVIDER_UNAVAILABLE",
        "Ce prestataire ne prend pas de réservation pour le moment.",
      );
    }

    const location = await this.resolveLocation(actor, input);

    let booking: BookingRecord;
    try {
      booking = await this.prisma.$transaction(async (tx) => {
        await lockRow(tx, "Provider", provider.id);
        const day = await this.availability.computeForDate(provider.id, input.date, { client: tx });
        if (!day || !day.slots.includes(input.time)) throw slotTaken();

        const scheduledAt = localSlotToInstant(input.date, input.time, day.timezone);
        const created = await tx.booking.create({
          data: {
            clientId: actor.id,
            providerId: provider.id,
            status: "PENDING",
            scheduledAt,
            durationMin: day.slotDurationMin,
            bufferMin: day.slotBufferMin,
            timezone: day.timezone,
            subcategoryId: provider.subcategoryId,
            clientPhone: input.clientPhone,
            clientNotes: input.clientNotes ?? null,
            ...location,
          },
          include: bookingInclude,
        });

        await this.notifications.create(
          {
            userId: provider.userId,
            type: "BOOKING_NEW",
            title: "Nouvelle demande de réservation",
            message: `${fullName(actor, "Un client")} souhaite réserver le ${formatSlotLabel(scheduledAt, day.timezone)}.`,
            data: { bookingId: created.id },
          },
          tx,
        );
        return created;
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw slotTaken();
      throw error;
    }

    return this.view.detail(booking, actor);
  }

  async list(actor: Actor, query: BookingsQuery) {
    const side = actor.role === "PROVIDER" ? "provider" : "client";
    let where: Prisma.BookingWhereInput;
    if (side === "provider") {
      const provider = await this.prisma.provider.findUnique({
        where: { userId: actor.id },
        select: { id: true },
      });
      if (!provider) return toPage([], 0, query);
      where = { providerId: provider.id };
    } else {
      where = { clientId: actor.id };
    }
    if (query.status) where.status = query.status;

    const ascending = query.status === "PENDING" || query.status === "CONFIRMED";
    const [total, records] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        include: bookingInclude,
        orderBy: [
          { scheduledAt: ascending ? "asc" : "desc" },
          { id: ascending ? "asc" : "desc" },
        ],
        ...pageArgs(query),
      }),
    ]);

    return toPage(await this.view.cards(records, side), total, query);
  }

  async get(actor: Actor, bookingId: string): Promise<BookingDetail> {
    const record = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: bookingInclude,
    });
    if (
      !record ||
      (actor.role !== "ADMIN" && record.clientId !== actor.id && record.provider.userId !== actor.id)
    ) {
      throw notFound("Réservation introuvable");
    }
    return this.view.detail(record, actor);
  }

  async confirm(actor: Actor, bookingId: string): Promise<BookingDetail> {
    const record = await this.prisma.$transaction(async (tx) => {
      const booking = await this.loadForUpdate(tx, bookingId);
      if (!booking || booking.provider.userId !== actor.id) throw notFound("Réservation introuvable");
      if (booking.status !== "PENDING") throw invalidTransition();

      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: "CONFIRMED", confirmedAt: new Date() },
        include: bookingInclude,
      });
      await this.notifications.create(
        {
          userId: booking.clientId,
          type: "BOOKING_CONFIRMED",
          title: "Réservation confirmée",
          message: `${booking.provider.displayName} a confirmé votre réservation du ${formatSlotLabel(booking.scheduledAt, booking.timezone)}.`,
          data: { bookingId },
        },
        tx,
      );
      return updated;
    });
    return this.view.detail(record, actor);
  }

  async complete(
    actor: Actor,
    bookingId: string,
    input: CompleteBookingInput,
  ): Promise<BookingDetail> {
    const record = await this.prisma.$transaction(async (tx) => {
      const booking = await this.loadForUpdate(tx, bookingId);
      if (!booking || booking.provider.userId !== actor.id) throw notFound("Réservation introuvable");
      if (booking.status !== "CONFIRMED") throw invalidTransition();

      const now = new Date();
      const data: Prisma.BookingUpdateInput = { status: "COMPLETED", completedAt: now };
      if (input.agreedPrice !== undefined) {
        const commissionAmt = Math.round((input.agreedPrice * booking.commissionPct) / 100);
        const providerNetAmt = input.agreedPrice - commissionAmt;
        const isPaid = input.isPaid ?? false;
        Object.assign(data, {
          agreedPrice: input.agreedPrice,
          commissionAmt,
          providerNetAmt,
          isPaid,
          paidAt: isPaid ? now : null,
        });
        await tx.transaction.create({
          data: {
            providerId: booking.providerId,
            bookingId,
            type: "EARNING",
            amount: input.agreedPrice,
            feeAmt: commissionAmt,
            netAmt: providerNetAmt,
            status: isPaid ? "COMPLETED" : "PENDING",
            occurredAt: now,
          },
        });
      }

      const updated = await tx.booking.update({
        where: { id: bookingId },
        data,
        include: bookingInclude,
      });
      await tx.provider.update({
        where: { id: booking.providerId },
        data: { completedJobs: { increment: 1 } },
      });
      await this.notifications.create(
        {
          userId: booking.clientId,
          type: "BOOKING_COMPLETED",
          title: "Prestation terminée",
          message: `${booking.provider.displayName} a marqué la prestation comme terminée. Laissez un avis !`,
          data: { bookingId },
        },
        tx,
      );
      return updated;
    });
    return this.view.detail(record, actor);
  }

  async cancel(
    actor: Actor,
    bookingId: string,
    input: { reason?: string },
    context?: { ipAddress?: string | null },
  ): Promise<BookingDetail> {
    const reason = input.reason?.trim() || null;

    const record = await this.prisma.$transaction(async (tx) => {
      const booking = await this.loadForUpdate(tx, bookingId);
      const role = !booking
        ? null
        : booking.provider.userId === actor.id
          ? "provider"
          : booking.clientId === actor.id
            ? "client"
            : actor.role === "ADMIN"
              ? "admin"
              : null;
      if (!booking || !role) throw notFound("Réservation introuvable");
      if (!CANCELLABLE.includes(booking.status)) throw invalidTransition();
      if (role !== "client" && !reason) {
        throw apiError(
          HttpStatus.BAD_REQUEST,
          "REASON_REQUIRED",
          "Indiquez le motif de l'annulation.",
        );
      }

      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelledById: actor.id,
          cancelReason: reason,
        },
        include: bookingInclude,
      });

      const slot = formatSlotLabel(booking.scheduledAt, booking.timezone);
      const recipients =
        role === "client"
          ? [booking.provider.userId]
          : role === "provider"
            ? [booking.clientId]
            : [booking.clientId, booking.provider.userId];
      const by =
        role === "client"
          ? fullName(updated.client, "Le client")
          : role === "provider"
            ? booking.provider.displayName
            : "L'équipe KAYOU";
      for (const userId of recipients) {
        await this.notifications.create(
          {
            userId,
            type: "BOOKING_CANCELLED",
            title: "Réservation annulée",
            message: `${by} a annulé la réservation du ${slot}.${reason ? ` Motif : ${reason}` : ""}`,
            data: { bookingId },
          },
          tx,
        );
      }

      if (role === "admin") {
        await this.activity.log(
          {
            userId: actor.id,
            action: "booking.cancel",
            entityType: "Booking",
            entityId: bookingId,
            metadata: { previousStatus: booking.status, reason },
            ipAddress: context?.ipAddress ?? null,
          },
          tx,
        );
      }
      return updated;
    });
    return this.view.detail(record, actor);
  }

  async updateNotes(
    actor: Actor,
    bookingId: string,
    input: UpdateBookingNotesInput,
  ): Promise<BookingDetail> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { provider: { select: { userId: true } } },
    });
    if (!booking || booking.provider.userId !== actor.id) throw notFound("Réservation introuvable");

    const record = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { providerNotes: input.providerNotes || null },
      include: bookingInclude,
    });
    return this.view.detail(record, actor);
  }

  private async loadForUpdate(tx: Tx, bookingId: string) {
    await lockRow(tx, "Booking", bookingId);
    return tx.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        clientId: true,
        providerId: true,
        status: true,
        scheduledAt: true,
        timezone: true,
        commissionPct: true,
        provider: { select: { userId: true, displayName: true } },
      },
    });
  }

  private async resolveLocation(actor: Actor, input: CreateBookingInput) {
    if (input.addressId) {
      const address = await this.prisma.address.findFirst({
        where: { id: input.addressId, userId: actor.id },
        select: { placeId: true, addressLine: true, latitude: true, longitude: true },
      });
      if (!address) throw notFound("Adresse introuvable");
      return address;
    }
    if (input.placeId) await this.places.assertSelectable(input.placeId);
    return {
      placeId: input.placeId ?? null,
      addressLine: input.addressLine ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
    };
  }
}
