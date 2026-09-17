import { HttpStatus, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import type { AdminProviderSearchQuery, AdminUpdateProviderInput } from "../../common/contract";
import { apiError } from "../../common/http/errors";
import { pageArgs, toPage } from "../../common/http/pagination";
import { fullName } from "../../common/util/people";
import { PrismaService } from "../../database/prisma.service";
import { ActivityLogService } from "../activity/activity-log.service";
import { NotificationsService } from "../notifications/notifications.service";
import {
  approveDocsForOverride,
  rejectDocsForOverride,
  verificationNotification,
} from "./admin-verification.helpers";

const providerInclude = {
  subcategory: { select: { name: true } },
  place: { select: { label: true } },
  user: { select: { id: true, firstName: true, lastName: true, isActive: true } },
} satisfies Prisma.ProviderInclude;

type AdminProviderRecord = Prisma.ProviderGetPayload<{ include: typeof providerInclude }>;

@Injectable()
export class AdminProvidersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly activity: ActivityLogService,
  ) {}

  async list(query: AdminProviderSearchQuery) {
    const where: Prisma.ProviderWhereInput = {};
    if (query.verificationStatus) where.verificationStatus = query.verificationStatus;
    if (query.premiumTier) where.premiumTier = query.premiumTier;
    if (query.hidden !== undefined) where.hidden = query.hidden;
    if (query.q) {
      const contains = { contains: query.q, mode: "insensitive" as const };
      where.OR = [
        { displayName: contains },
        { phone: contains },
        { user: { firstName: contains } },
        { user: { lastName: contains } },
        { user: { email: contains } },
      ];
    }

    const [total, providers] = await Promise.all([
      this.prisma.provider.count({ where }),
      this.prisma.provider.findMany({
        where,
        ...pageArgs(query),
        orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
        include: providerInclude,
      }),
    ]);

    return toPage(providers.map((provider) => this.map(provider)), total, query);
  }

  async update(
    actor: Actor,
    providerId: string,
    body: AdminUpdateProviderInput,
    ipAddress?: string | null,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const provider = await tx.provider.findUnique({
        where: { id: providerId },
        select: {
          id: true,
          userId: true,
          hidden: true,
          premiumTier: true,
          premiumUntil: true,
          verificationStatus: true,
        },
      });
      if (!provider) throw apiError(HttpStatus.NOT_FOUND, "NOT_FOUND", "Prestataire introuvable");

      const data: Prisma.ProviderUpdateInput = {};
      if (body.hidden !== undefined) data.hidden = body.hidden;
      if (body.premiumTier !== undefined) data.premiumTier = body.premiumTier;
      if (body.premiumUntil !== undefined) data.premiumUntil = body.premiumUntil;
      if (body.premiumTier === "FREE" && body.premiumUntil === undefined) data.premiumUntil = null;

      const status = body.verificationStatus;
      if (status === "VERIFIED") {
        await approveDocsForOverride(tx, providerId, actor.id);
      } else if (status === "REJECTED") {
        await rejectDocsForOverride(tx, providerId, actor.id, body.rejectionReason!);
      }
      if (status !== undefined) data.verificationStatus = status;

      const updated = await tx.provider.update({
        where: { id: providerId },
        data,
        include: providerInclude,
      });

      const statusChanged = status !== undefined && status !== provider.verificationStatus;
      if (statusChanged) {
        await this.notifications.create(
          verificationNotification(provider.userId, providerId, status!, body.rejectionReason),
          tx,
        );
      }

      await this.activity.log(
        {
          userId: actor.id,
          action: "provider.update",
          entityType: "Provider",
          entityId: providerId,
          metadata: {
            hidden: body.hidden === undefined ? null : { from: provider.hidden, to: body.hidden },
            premiumTier:
              body.premiumTier === undefined
                ? null
                : { from: provider.premiumTier, to: body.premiumTier },
            premiumUntil:
              data.premiumUntil === undefined
                ? null
                : (updated.premiumUntil?.toISOString() ?? null),
            verificationStatus:
              status === undefined ? null : { from: provider.verificationStatus, to: status },
            rejectionReason: body.rejectionReason ?? null,
          },
          ipAddress: ipAddress ?? null,
        },
        tx,
      );

      return this.map(updated);
    });
  }

  private map(provider: AdminProviderRecord) {
    return {
      id: provider.id,
      userId: provider.userId,
      displayName: provider.displayName,
      profilePhoto: provider.profilePhoto,
      phone: provider.phone,
      categoryLabel: provider.subcategory?.name ?? null,
      placeLabel: provider.place?.label ?? null,
      verificationStatus: provider.verificationStatus,
      premiumTier: provider.premiumTier,
      premiumUntil: provider.premiumUntil,
      hidden: provider.hidden,
      isAvailable: provider.isAvailable,
      ratingAvg: Number(provider.ratingAvg),
      ratingCount: provider.ratingCount,
      completedJobs: provider.completedJobs,
      publishedAt: provider.publishedAt,
      owner: {
        id: provider.user.id,
        name: fullName(provider.user),
        isActive: provider.user.isActive,
      },
    };
  }
}
