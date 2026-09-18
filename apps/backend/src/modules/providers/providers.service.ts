import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import type { ProviderSearchQuery } from "../../common/contract";
import { notFound } from "../../common/http/errors";
import { pageArgs, toPage, type PageQuery } from "../../common/http/pagination";
import { PrismaService } from "../../database/prisma.service";
import { PlaceTreeService } from "../places/place-tree.service";
import { SafetyService } from "../safety/safety.service";
import { SiteSettingsService } from "../settings/site-settings.service";
import {
  pricingReferenceIds,
  providerCardSelect,
  providerProfileSelect,
  publicReviewSelect,
  referenceSummarySelect,
  toProviderCard,
  toProviderPublic,
  toPublicReview,
  toReferenceSummary,
  type ProviderCardRow,
  type ReferenceSummary,
} from "./provider-mapper";
import { ProvidersAvailabilityService } from "./providers-availability.service";
import {
  distanceKm,
  effectiveTier,
  roundCoordinate,
  searchableProviderWhere,
} from "./provider-visibility";

type Viewer = Actor | null | undefined;

/** Adds a whole subcategory or category to the text matches (search intent, docs/ai-jev/02). */
export type SearchWidening = { subcategoryId: string } | { categorySlug: string };
export type SearchOptions = { widenTo?: SearchWidening | null };

const insensitive = (value: string) => ({ contains: value, mode: "insensitive" as const });

@Injectable()
export class ProvidersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly places: PlaceTreeService,
    private readonly safety: SafetyService,
    private readonly settings: SiteSettingsService,
    private readonly availability: ProvidersAvailabilityService,
  ) {}

  async search(query: ProviderSearchQuery, viewer?: Viewer, options: SearchOptions = {}) {
    const now = new Date();
    const where = await this.buildSearchWhere(query, viewer, now, options.widenTo ?? null);
    const origin =
      query.lat !== undefined && query.lng !== undefined ? { lat: query.lat, lng: query.lng } : null;

    if (query.sort === "distance" && origin) {
      const candidates = await this.prisma.provider.findMany({
        where,
        select: { id: true, latitude: true, longitude: true },
      });
      const ranked = candidates
        .map((candidate) => {
          const lat = roundCoordinate(candidate.latitude);
          const lng = roundCoordinate(candidate.longitude);
          return {
            id: candidate.id,
            distance: lat === null || lng === null ? null : distanceKm(origin.lat, origin.lng, lat, lng),
          };
        })
        .sort((a, b) => {
          if (a.distance === null && b.distance === null) return a.id.localeCompare(b.id);
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance || a.id.localeCompare(b.id);
        });
      const { skip, take } = pageArgs(query);
      const pageIds = ranked.slice(skip, skip + take).map((item) => item.id);
      const rows = await this.prisma.provider.findMany({
        where: { id: { in: pageIds } },
        select: providerCardSelect,
      });
      const byId = new Map(rows.map((row) => [row.id, row]));
      const ordered = pageIds.map((id) => byId.get(id)).filter((row): row is ProviderCardRow => Boolean(row));
      return toPage(await this.toCards(ordered, origin, now), ranked.length, query);
    }

    const [total, rows] = await Promise.all([
      this.prisma.provider.count({ where }),
      this.prisma.provider.findMany({
        where,
        select: providerCardSelect,
        orderBy: this.searchOrder(query.sort),
        ...pageArgs(query),
      }),
    ]);
    return toPage(await this.toCards(rows, origin, now), total, query);
  }

  async getPublicProfile(id: string, viewer?: Viewer) {
    const now = new Date();
    const row = await this.prisma.provider.findUnique({
      where: { id },
      select: providerProfileSelect,
    });
    if (!row) throw notFound("Prestataire introuvable");

    const isOwner = viewer?.id === row.userId;
    const isAdmin = viewer?.role === "ADMIN";
    if ((row.hidden || !row.user.isActive) && !isOwner && !isAdmin) {
      throw notFound("Prestataire introuvable");
    }

    const [settings, placeChains, references, blocked] = await Promise.all([
      this.settings.getAll(),
      this.places.chains([row.placeId]),
      this.loadReferences(pricingReferenceIds([row])),
      viewer && !isOwner ? this.safety.isBlocked(viewer.id, row.userId) : Promise.resolve(false),
    ]);

    const contactsVisible =
      isOwner ||
      isAdmin ||
      (Boolean(viewer) &&
        (!settings.contacts_require_premium || effectiveTier(row, now) !== "FREE"));

    return toProviderPublic(row, {
      placeChains,
      references,
      now,
      viewerId: viewer?.id ?? null,
      contactsVisible,
      whatsappEnabled: settings.feat_whatsapp,
      blocked,
    });
  }

  async getAvailability(id: string, date: string, viewer?: Viewer) {
    await this.assertVisible(id, viewer);
    const result = await this.availability.computeForDate(id, date);
    if (!result) throw notFound("Prestataire introuvable");
    return result;
  }

  async listReviews(id: string, query: PageQuery, viewer?: Viewer) {
    await this.assertVisible(id, viewer);
    const where: Prisma.ReviewWhereInput = { providerId: id, isPublic: true };
    const [total, rows] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        select: publicReviewSelect,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        ...pageArgs(query),
      }),
    ]);
    return toPage(rows.map(toPublicReview), total, query);
  }

  async assertVisible(id: string, viewer?: Viewer) {
    const provider = await this.prisma.provider.findUnique({
      where: { id },
      select: { id: true, userId: true, hidden: true, user: { select: { isActive: true } } },
    });
    const privileged = viewer && (viewer.id === provider?.userId || viewer.role === "ADMIN");
    if (!provider || ((provider.hidden || !provider.user.isActive) && !privileged)) {
      throw notFound("Prestataire introuvable");
    }
    return provider;
  }

  private async buildSearchWhere(
    query: ProviderSearchQuery,
    viewer: Viewer,
    now: Date,
    widenTo: SearchWidening | null,
  ): Promise<Prisma.ProviderWhereInput> {
    const and: Prisma.ProviderWhereInput[] = [searchableProviderWhere()];

    if (viewer) {
      const blocked = await this.safety.blockedUserIds(viewer.id);
      if (blocked.length > 0) and.push({ userId: { notIn: blocked } });
    }
    if (query.categoryId) and.push({ subcategory: { categoryId: query.categoryId } });
    if (query.categorySlug) and.push({ subcategory: { category: { slug: query.categorySlug } } });
    if (query.subcategoryId) {
      and.push({
        OR: [
          { subcategoryId: query.subcategoryId },
          { subcategory: { parentId: query.subcategoryId } },
        ],
      });
    }
    if (query.placeId) {
      and.push({ placeId: { in: await this.places.descendantIds(query.placeId) } });
    }
    if (query.languageId) {
      and.push({ references: { some: { itemId: query.languageId, kind: "LANGUAGE" } } });
    }
    if (query.modeId) {
      and.push({ references: { some: { itemId: query.modeId, kind: "INTERVENTION_MODE" } } });
    }
    if (query.minRating !== undefined) and.push({ ratingAvg: { gte: query.minRating } });
    if (query.verifiedOnly) and.push({ verificationStatus: "VERIFIED" });
    if (query.premiumOnly) {
      and.push({
        premiumTier: { not: "FREE" },
        OR: [{ premiumUntil: null }, { premiumUntil: { gt: now } }],
      });
    }
    if (query.q) {
      const q = query.q;
      and.push({
        OR: [
          { displayName: insensitive(q) },
          { description: insensitive(q) },
          { subcategory: { name: insensitive(q) } },
          { subcategory: { parent: { is: { name: insensitive(q) } } } },
          { subcategory: { category: { name: insensitive(q) } } },
          { skills: { some: { item: { label: insensitive(q) } } } },
          { freeSkills: { has: q } },
          ...(widenTo ? [widenedWhere(widenTo)] : []),
        ],
      });
    }

    return { AND: and };
  }

  private searchOrder(sort: ProviderSearchQuery["sort"]): Prisma.ProviderOrderByWithRelationInput[] {
    if (sort === "rating") {
      return [{ ratingAvg: "desc" }, { ratingCount: "desc" }, { id: "asc" }];
    }
    if (sort === "newest") {
      return [{ publishedAt: "desc" }, { id: "asc" }];
    }
    return [
      { premiumTier: "desc" },
      { ratingAvg: "desc" },
      { ratingCount: "desc" },
      { publishedAt: "desc" },
      { id: "asc" },
    ];
  }

  private async toCards(
    rows: ProviderCardRow[],
    origin: { lat: number; lng: number } | null,
    now: Date,
  ) {
    const [placeChains, references] = await Promise.all([
      this.places.chains(rows.map((row) => row.placeId)),
      this.loadReferences(pricingReferenceIds(rows)),
    ]);
    return rows.map((row) => toProviderCard(row, { placeChains, references, origin, now }));
  }

  private async loadReferences(ids: string[]): Promise<Map<string, ReferenceSummary>> {
    if (ids.length === 0) return new Map();
    const items = await this.prisma.referenceItem.findMany({
      where: { id: { in: ids } },
      select: referenceSummarySelect,
    });
    return new Map(items.map((item) => [item.id, toReferenceSummary(item)]));
  }
}

function widenedWhere(widenTo: SearchWidening): Prisma.ProviderWhereInput {
  if ("subcategoryId" in widenTo) {
    return { OR: [{ subcategoryId: widenTo.subcategoryId }, { subcategory: { parentId: widenTo.subcategoryId } }] };
  }
  return { subcategory: { category: { slug: widenTo.categorySlug } } };
}
