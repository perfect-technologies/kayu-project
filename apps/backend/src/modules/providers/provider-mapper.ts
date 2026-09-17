import type { MediaKind, Prisma, ReferenceType } from "@prisma/client";
import { shortName } from "../../common/util/people";
import type { PlaceSummary } from "../places/place-tree.service";
import { distanceKm, effectiveTier, roundCoordinate } from "./provider-visibility";
import { localParts, scheduleSummary } from "./schedule";

export type ReferenceSummary = {
  id: string;
  type: ReferenceType;
  label: string;
  categoryId: string | null;
};

export const referenceSummarySelect = {
  id: true,
  type: true,
  label: true,
  categoryId: true,
} satisfies Prisma.ReferenceItemSelect;

export const providerCardSelect = {
  id: true,
  userId: true,
  displayName: true,
  profilePhoto: true,
  ratingAvg: true,
  ratingCount: true,
  completedJobs: true,
  premiumTier: true,
  premiumUntil: true,
  verificationStatus: true,
  isAvailable: true,
  latitude: true,
  longitude: true,
  placeId: true,
  pricingAmount: true,
  pricingCurrencyId: true,
  pricingUnitId: true,
  publishedAt: true,
  subcategory: {
    select: {
      id: true,
      slug: true,
      name: true,
      parent: { select: { id: true, slug: true, name: true } },
      category: { select: { id: true, slug: true, name: true } },
    },
  },
} satisfies Prisma.ProviderSelect;

export const mediaSelect = {
  id: true,
  kind: true,
  url: true,
  storagePath: true,
  youtubeId: true,
  title: true,
  order: true,
} satisfies Prisma.ProviderMediaSelect;

export const scheduleSelect = {
  timezone: true,
  slotDurationMin: true,
  slotBufferMin: true,
  availabilityRules: {
    select: { dayOfWeek: true, startTime: true, endTime: true },
    orderBy: [{ dayOfWeek: "asc" }, { order: "asc" }],
  },
  availabilityExceptions: {
    select: { date: true, isOpen: true, startTime: true, endTime: true, reason: true },
    orderBy: { date: "asc" },
  },
} satisfies Prisma.ProviderSelect;

export const providerProfileSelect = {
  ...providerCardSelect,
  ...scheduleSelect,
  description: true,
  yearsExperience: true,
  freeSkills: true,
  phone: true,
  whatsapp: true,
  email: true,
  addressLine: true,
  youtubeUrl: true,
  instagramUrl: true,
  tiktokUrl: true,
  facebookUrl: true,
  hidden: true,
  subcategoryId: true,
  user: { select: { id: true, isActive: true } },
  skills: { select: { item: { select: referenceSummarySelect } } },
  references: { select: { kind: true, item: { select: referenceSummarySelect } } },
  media: { select: mediaSelect, orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
  reviews: {
    where: { isPublic: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 5,
    select: {
      id: true,
      rating: true,
      comment: true,
      reply: true,
      repliedAt: true,
      createdAt: true,
      client: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
  },
} satisfies Prisma.ProviderSelect;

export const publicReviewSelect = providerProfileSelect.reviews.select;

export type ProviderCardRow = Prisma.ProviderGetPayload<{ select: typeof providerCardSelect }>;
export type ProviderProfileRow = Prisma.ProviderGetPayload<{ select: typeof providerProfileSelect }>;
export type PublicReviewRow = ProviderProfileRow["reviews"][number];
export type ScheduleRow = Prisma.ProviderGetPayload<{ select: typeof scheduleSelect }>;
export type MediaRow = Prisma.ProviderMediaGetPayload<{ select: typeof mediaSelect }>;

export type CardContext = {
  placeChains: Map<string, PlaceSummary[]>;
  references: Map<string, ReferenceSummary>;
  origin?: { lat: number; lng: number } | null;
  now: Date;
};

export function toReferenceSummary(item: ReferenceSummary): ReferenceSummary {
  return { id: item.id, type: item.type, label: item.label, categoryId: item.categoryId };
}

export function categoryChain(subcategory: ProviderCardRow["subcategory"]) {
  return [
    subcategory.category,
    ...(subcategory.parent ? [subcategory.parent] : []),
    { id: subcategory.id, slug: subcategory.slug, name: subcategory.name },
  ].map((node) => ({ id: node.id, slug: node.slug, name: node.name }));
}

export function pricingReferenceIds(rows: Array<Pick<ProviderCardRow, "pricingCurrencyId" | "pricingUnitId">>) {
  return [
    ...new Set(
      rows.flatMap((row) => [row.pricingCurrencyId, row.pricingUnitId]).filter((id): id is string => Boolean(id)),
    ),
  ];
}

export function toProviderCard(row: ProviderCardRow, context: CardContext) {
  const latitude = roundCoordinate(row.latitude);
  const longitude = roundCoordinate(row.longitude);
  const distance =
    context.origin && latitude !== null && longitude !== null
      ? Math.round(distanceKm(context.origin.lat, context.origin.lng, latitude, longitude) * 10) / 10
      : null;

  return {
    id: row.id,
    displayName: row.displayName,
    profilePhoto: row.profilePhoto,
    categoryChain: categoryChain(row.subcategory),
    placeChain: (row.placeId ? context.placeChains.get(row.placeId) : undefined) ?? [],
    ratingAvg: Number(row.ratingAvg),
    ratingCount: row.ratingCount,
    completedJobs: row.completedJobs,
    premiumTier: effectiveTier(row, context.now),
    verified: row.verificationStatus === "VERIFIED",
    isAvailable: row.isAvailable,
    latitude,
    longitude,
    distanceKm: distance,
    pricing:
      row.pricingAmount === null
        ? null
        : {
            amount: row.pricingAmount,
            currency: (row.pricingCurrencyId && context.references.get(row.pricingCurrencyId)) || null,
            unit: (row.pricingUnitId && context.references.get(row.pricingUnitId)) || null,
          },
  };
}

export function toMedia(row: MediaRow) {
  return {
    id: row.id,
    kind: row.kind as MediaKind,
    url: row.url,
    storagePath: row.storagePath,
    youtubeId: row.youtubeId,
    title: row.title,
    order: row.order,
  };
}

export function toSchedule(row: ScheduleRow, options: { futureOnly?: boolean; now?: Date } = {}) {
  const today = options.futureOnly
    ? localParts(row.timezone, options.now ?? new Date()).date
    : null;
  return {
    timezone: row.timezone,
    slotDurationMin: row.slotDurationMin,
    slotBufferMin: row.slotBufferMin,
    rules: row.availabilityRules.map((rule) => ({
      dayOfWeek: rule.dayOfWeek,
      startTime: rule.startTime,
      endTime: rule.endTime,
    })),
    exceptions: row.availabilityExceptions
      .map((exception) => ({
        date: exception.date.toISOString().slice(0, 10),
        isOpen: exception.isOpen,
        startTime: exception.startTime,
        endTime: exception.endTime,
        reason: exception.reason,
      }))
      .filter((exception) => !today || exception.date >= today),
  };
}

export function toPublicReview(row: PublicReviewRow) {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    reply: row.reply,
    repliedAt: row.repliedAt,
    createdAt: row.createdAt,
    author: { id: row.client.id, name: shortName(row.client), avatar: row.client.avatar },
  };
}

export function toProviderPublic(
  row: ProviderProfileRow,
  context: CardContext & {
    viewerId: string | null;
    contactsVisible: boolean;
    whatsappEnabled: boolean;
    blocked: boolean;
  },
) {
  const schedule = toSchedule(row, { futureOnly: true, now: context.now });
  return {
    ...toProviderCard(row, context),
    ownerId: row.userId,
    description: row.description,
    yearsExperience: row.yearsExperience,
    freeSkills: row.freeSkills,
    skills: row.skills.map((skill) => toReferenceSummary(skill.item)),
    languages: row.references
      .filter((reference) => reference.kind === "LANGUAGE")
      .map((reference) => toReferenceSummary(reference.item)),
    interventionModes: row.references
      .filter((reference) => reference.kind === "INTERVENTION_MODE")
      .map((reference) => toReferenceSummary(reference.item)),
    media: row.media.map(toMedia),
    schedule,
    scheduleSummary: scheduleSummary(schedule.rules),
    social: {
      youtubeUrl: row.youtubeUrl,
      instagramUrl: row.instagramUrl,
      tiktokUrl: row.tiktokUrl,
      facebookUrl: row.facebookUrl,
    },
    contacts: context.contactsVisible
      ? {
          phone: row.phone,
          whatsapp: context.whatsappEnabled ? row.whatsapp : null,
          email: row.email,
          addressLine: row.addressLine,
          latitude: row.latitude,
          longitude: row.longitude,
        }
      : null,
    contactsLocked: !context.contactsVisible,
    blocked: context.blocked,
    reviewsPreview: row.reviews.map(toPublicReview),
    publishedAt: row.publishedAt,
    subcategoryId: row.subcategoryId,
    placeId: row.placeId,
    isOwner: context.viewerId === row.userId,
    hidden: row.hidden,
    verificationStatus: row.verificationStatus,
  };
}

export type ProviderCard = ReturnType<typeof toProviderCard>;
export type ProviderPublic = ReturnType<typeof toProviderPublic>;
