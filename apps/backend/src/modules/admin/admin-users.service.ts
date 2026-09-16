import { HttpStatus, Injectable } from "@nestjs/common";
import type { BookingStatus, Prisma, UserRole } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import type { AdminUpdateUserInput, AdminUserSearchQuery } from "../../common/contract";
import { apiError } from "../../common/http/errors";
import { pageArgs, toPage } from "../../common/http/pagination";
import { fullName } from "../../common/util/people";
import { PrismaService } from "../../database/prisma.service";
import { ActivityLogService } from "../activity/activity-log.service";
import { PlaceTreeService } from "../places/place-tree.service";
import { effectiveTier } from "../providers/provider-visibility";
import { scheduleSummary } from "../providers/schedule";
import { clientRatingSummary } from "../reviews/rating-aggregates";

const userInclude = {
  place: { select: { label: true } },
  provider: { select: { id: true, displayName: true, hidden: true, verificationStatus: true } },
} satisfies Prisma.UserInclude;

type AdminUserRecord = Prisma.UserGetPayload<{ include: typeof userInclude }>;

const cvProviderInclude = {
  subcategory: {
    select: {
      id: true,
      name: true,
      slug: true,
      parent: { select: { id: true, name: true, slug: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
  },
  skills: { select: { item: { select: { id: true, label: true } } } },
  references: { select: { kind: true, item: { select: { id: true, label: true } } } },
  media: { orderBy: { order: "asc" } },
  availabilityRules: { select: { dayOfWeek: true, startTime: true, endTime: true } },
} satisfies Prisma.ProviderInclude;

const ALLOWED_ROLE_CHANGES: Array<[UserRole, UserRole]> = [
  ["CLIENT", "ADMIN"],
  ["ADMIN", "CLIENT"],
];

const BOOKING_STATUSES: BookingStatus[] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityLogService,
    private readonly places: PlaceTreeService,
  ) {}

  async list(query: AdminUserSearchQuery) {
    const where: Prisma.UserWhereInput = {};
    if (query.role) where.role = query.role;
    if (query.suspended !== undefined) where.isActive = !query.suspended;
    if (query.q) {
      const contains = { contains: query.q, mode: "insensitive" as const };
      where.OR = [
        { firstName: contains },
        { lastName: contains },
        { email: contains },
        { phone: contains },
        { place: { label: contains } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        ...pageArgs(query),
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        include: userInclude,
      }),
    ]);

    return toPage(users.map((user) => this.mapUser(user)), total, query);
  }

  async update(actor: Actor, userId: string, body: AdminUpdateUserInput, ipAddress?: string | null) {
    if (userId === actor.id) {
      throw apiError(
        HttpStatus.BAD_REQUEST,
        "SELF_ACTION",
        "Vous ne pouvez pas modifier votre propre compte ici",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({ where: { id: userId }, include: userInclude });
      if (!target) throw apiError(HttpStatus.NOT_FOUND, "NOT_FOUND", "Utilisateur introuvable");

      const nextRole = body.role ?? target.role;
      if (nextRole !== target.role) {
        const allowed = ALLOWED_ROLE_CHANGES.some(
          ([from, to]) => from === target.role && to === nextRole,
        );
        if (!allowed || target.provider) {
          throw apiError(
            HttpStatus.CONFLICT,
            "ROLE_CHANGE_NOT_ALLOWED",
            "Seul le passage Client ⇄ Admin est possible",
          );
        }
      }

      const nextActive = body.suspended === undefined ? target.isActive : !body.suspended;
      const wasActiveAdmin = target.role === "ADMIN" && target.isActive;
      const staysActiveAdmin = nextRole === "ADMIN" && nextActive;
      if (wasActiveAdmin && !staysActiveAdmin) {
        await tx.$queryRaw`SELECT id FROM "User" WHERE role = 'ADMIN' FOR UPDATE`;
        const otherActiveAdmins = await tx.user.count({
          where: { role: "ADMIN", isActive: true, id: { not: target.id } },
        });
        if (otherActiveAdmins === 0) {
          throw apiError(
            HttpStatus.CONFLICT,
            "LAST_ADMIN",
            "Au moins un administrateur actif doit rester",
          );
        }
      }

      const data: Prisma.UserUpdateInput = {};
      if (nextRole !== target.role) data.role = nextRole;
      if (body.suspended === true) {
        data.isActive = false;
        data.suspendedAt = target.isActive ? new Date() : target.suspendedAt;
        data.suspendedReason = body.suspendedReason ?? null;
      } else if (body.suspended === false) {
        data.isActive = true;
        data.suspendedAt = null;
        data.suspendedReason = null;
      }

      const updated = await tx.user.update({ where: { id: userId }, data, include: userInclude });

      const hideProvider = body.suspended === true && Boolean(target.provider) && !target.provider!.hidden;
      if (hideProvider) {
        await tx.provider.update({ where: { id: target.provider!.id }, data: { hidden: true } });
      }

      await this.activity.log(
        {
          userId: actor.id,
          action: "user.update",
          entityType: "User",
          entityId: userId,
          metadata: {
            role: nextRole !== target.role ? { from: target.role, to: nextRole } : null,
            suspended:
              body.suspended === undefined ? null : { from: !target.isActive, to: body.suspended },
            suspendedReason: body.suspended === true ? (body.suspendedReason ?? null) : null,
            providerHidden: hideProvider,
          },
          ipAddress: ipAddress ?? null,
        },
        tx,
      );

      const mapped = this.mapUser(updated);
      return hideProvider && mapped.provider
        ? { ...mapped, provider: { ...mapped.provider, hidden: true } }
        : mapped;
    });
  }

  async cv(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: userInclude });
    if (!user) throw apiError(HttpStatus.NOT_FOUND, "NOT_FOUND", "Utilisateur introuvable");

    const providerRow = user.provider
      ? await this.prisma.provider.findUnique({
          where: { id: user.provider.id },
          include: cvProviderInclude,
        })
      : null;

    const reportTargets: Prisma.ReportWhereInput[] = [{ targetKind: "USER", targetId: user.id }];
    if (providerRow) reportTargets.push({ targetKind: "PROVIDER", targetId: providerRow.id });

    const [
      placeChains,
      bookingsAsClient,
      bookingsAsProvider,
      reviewsGiven,
      clientRating,
      reportsFiled,
      reportsAgainst,
      earnings,
      pricingItems,
      recentActivity,
    ] = await Promise.all([
      this.places.chains([user.placeId, providerRow?.placeId]),
      this.prisma.booking.groupBy({
        by: ["status"],
        where: { clientId: user.id },
        _count: { _all: true },
      }),
      providerRow
        ? this.prisma.booking.groupBy({
            by: ["status"],
            where: { providerId: providerRow.id },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      this.prisma.review.count({ where: { clientId: user.id } }),
      clientRatingSummary(this.prisma, user.id),
      this.prisma.report.count({ where: { reporterId: user.id } }),
      this.prisma.report.count({ where: { OR: reportTargets } }),
      providerRow
        ? this.prisma.transaction.aggregate({
            where: { providerId: providerRow.id },
            _sum: { netAmt: true },
          })
        : Promise.resolve(null),
      providerRow
        ? this.prisma.referenceItem.findMany({
            where: {
              id: {
                in: [providerRow.pricingCurrencyId, providerRow.pricingUnitId].filter(
                  (id): id is string => Boolean(id),
                ),
              },
            },
            select: { id: true, type: true, label: true, categoryId: true },
          })
        : Promise.resolve([]),
      this.prisma.activityLog.findMany({
        where: {
          OR: [
            { userId: user.id },
            { entityId: user.id },
            ...(providerRow ? [{ entityId: providerRow.id }] : []),
          ],
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 20,
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
      }),
    ]);

    const byStatus = (rows: Array<{ status: BookingStatus; _count: { _all: number } }>) =>
      Object.fromEntries(
        BOOKING_STATUSES.map((status) => [
          status,
          rows.find((row) => row.status === status)?._count._all ?? 0,
        ]),
      ) as Record<BookingStatus, number>;

    const refById = new Map(pricingItems.map((item) => [item.id, item]));

    return {
      user: {
        ...this.mapUser(user),
        bio: user.bio,
        gender: user.gender,
        birthdate: user.birthdate,
        country: user.country,
        roleSelectedAt: user.roleSelectedAt,
        termsAcceptedAt: user.termsAcceptedAt,
        placeChain: placeChains.get(user.placeId ?? "") ?? [],
      },
      provider: providerRow
        ? {
            id: providerRow.id,
            displayName: providerRow.displayName,
            description: providerRow.description,
            yearsExperience: providerRow.yearsExperience,
            profilePhoto: providerRow.profilePhoto,
            contacts: {
              phone: providerRow.phone,
              whatsapp: providerRow.whatsapp,
              email: providerRow.email,
              addressLine: providerRow.addressLine,
              latitude: providerRow.latitude,
              longitude: providerRow.longitude,
            },
            categoryChain: [
              providerRow.subcategory.category,
              providerRow.subcategory.parent,
              {
                id: providerRow.subcategory.id,
                name: providerRow.subcategory.name,
                slug: providerRow.subcategory.slug,
              },
            ].filter((node): node is { id: string; name: string; slug: string } => Boolean(node)),
            placeChain: placeChains.get(providerRow.placeId ?? "") ?? [],
            skills: providerRow.skills.map((skill) => skill.item),
            freeSkills: providerRow.freeSkills,
            languages: providerRow.references
              .filter((ref) => ref.kind === "LANGUAGE")
              .map((ref) => ref.item),
            interventionModes: providerRow.references
              .filter((ref) => ref.kind === "INTERVENTION_MODE")
              .map((ref) => ref.item),
            pricing:
              providerRow.pricingAmount === null
                ? null
                : {
                    amount: providerRow.pricingAmount,
                    currency: refById.get(providerRow.pricingCurrencyId ?? "") ?? null,
                    unit: refById.get(providerRow.pricingUnitId ?? "") ?? null,
                  },
            media: providerRow.media.map((item) => ({
              id: item.id,
              kind: item.kind,
              url: item.url,
              storagePath: item.storagePath,
              youtubeId: item.youtubeId,
              title: item.title,
              order: item.order,
            })),
            social: {
              youtubeUrl: providerRow.youtubeUrl,
              instagramUrl: providerRow.instagramUrl,
              tiktokUrl: providerRow.tiktokUrl,
              facebookUrl: providerRow.facebookUrl,
            },
            timezone: providerRow.timezone,
            scheduleSummary: scheduleSummary(providerRow.availabilityRules),
            isAvailable: providerRow.isAvailable,
            verificationStatus: providerRow.verificationStatus,
            hidden: providerRow.hidden,
            premiumTier: providerRow.premiumTier,
            effectivePremiumTier: effectiveTier(providerRow),
            premiumUntil: providerRow.premiumUntil,
            ratingAvg: Number(providerRow.ratingAvg),
            ratingCount: providerRow.ratingCount,
            completedJobs: providerRow.completedJobs,
            publishedAt: providerRow.publishedAt,
          }
        : null,
      activity: {
        bookingsAsClient: byStatus(bookingsAsClient),
        bookingsAsProvider: providerRow ? byStatus(bookingsAsProvider) : null,
        reviewsGiven,
        reviewsReceived: providerRow
          ? { avg: Number(providerRow.ratingAvg), count: providerRow.ratingCount }
          : { avg: 0, count: 0 },
        clientRating,
        reportsFiled,
        reportsAgainst,
        lastLoginAt: user.lastLoginAt,
        earningsNet: earnings?._sum.netAmt ?? 0,
      },
      recentActivity: recentActivity.map((row) => ({
        id: row.id,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        metadata: row.metadata,
        ipAddress: row.ipAddress,
        createdAt: row.createdAt,
        actor: row.user ? { id: row.user.id, name: fullName(row.user) } : null,
      })),
    };
  }

  private mapUser(user: AdminUserRecord) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: fullName(user),
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      isActive: user.isActive,
      suspendedAt: user.suspendedAt,
      suspendedReason: user.suspendedReason,
      placeId: user.placeId,
      placeLabel: user.place?.label ?? null,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      provider: user.provider
        ? {
            id: user.provider.id,
            displayName: user.provider.displayName,
            hidden: user.provider.hidden,
            verificationStatus: user.provider.verificationStatus,
          }
        : null,
    };
  }
}
