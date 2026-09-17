import { z } from "zod";
import {
  BooleanQuerySchema,
  IdSchema,
  LatitudeSchema,
  LongitudeSchema,
  optionalText,
  pagination,
} from "./common";
import {
  BookingStatus,
  ContactStatus,
  PlaceKind,
  PremiumTier,
  ReferenceType,
  ReportStatus,
  ReportTargetKind,
  SuggestionStatus,
  UserRole,
  VerificationDecision,
  VerificationStatus,
} from "./enums";

export const SITE_SETTING_STRING_KEYS = [
  "hero_title",
  "hero_subtitle",
  "hero_cta",
  "tagline",
  "how1_title",
  "how1_desc",
  "how2_title",
  "how2_desc",
  "how3_title",
  "how3_desc",
  "premium_title",
  "premium_subtitle",
  "maintenance_message",
  "contact_phone",
  "contact_email",
  "contact_website",
] as const;

export const SITE_SETTING_BOOLEAN_KEYS = [
  "feat_booking",
  "feat_reviews",
  "feat_whatsapp",
  "contacts_require_premium",
  "maintenance_mode",
] as const;

export const SITE_SETTING_DEFAULTS = {
  ...Object.fromEntries(SITE_SETTING_STRING_KEYS.map((key) => [key, ""])),
  feat_booking: true,
  feat_reviews: true,
  feat_whatsapp: true,
  contacts_require_premium: false,
  maintenance_mode: false,
} as SiteSettings;

export const SiteSettingsSchema = z.object({
  ...Object.fromEntries(SITE_SETTING_STRING_KEYS.map((key) => [key, z.string().max(2000)])),
  ...Object.fromEntries(SITE_SETTING_BOOLEAN_KEYS.map((key) => [key, z.boolean()])),
} as Record<(typeof SITE_SETTING_STRING_KEYS)[number], z.ZodString> &
  Record<(typeof SITE_SETTING_BOOLEAN_KEYS)[number], z.ZodBoolean>);

export const AdminUpdateSettingsDto = SiteSettingsSchema.partial()
  .strict()
  .refine((body) => Object.keys(body).length > 0, { message: "Aucun paramètre à mettre à jour" });

const search = z.string().trim().min(1).max(120).optional();

export const AdminUserSearchParams = pagination(50).extend({
  q: search,
  role: UserRole.optional(),
  suspended: BooleanQuerySchema.optional(),
});

export const AdminUpdateUserDto = z
  .object({
    role: UserRole.optional(),
    suspended: z.boolean().optional(),
    suspendedReason: z.string().trim().min(1).max(500).nullable().optional(),
  })
  .refine((body) => body.role !== undefined || body.suspended !== undefined, {
    message: "Aucun champ à mettre à jour",
  })
  .refine((body) => body.suspended !== true || Boolean(body.suspendedReason), {
    path: ["suspendedReason"],
    message: "Le motif de suspension est obligatoire",
  });

export const AdminProviderSearchParams = pagination(50).extend({
  q: search,
  verificationStatus: VerificationStatus.optional(),
  premiumTier: PremiumTier.optional(),
  hidden: BooleanQuerySchema.optional(),
});

export const AdminUpdateProviderDto = z
  .object({
    hidden: z.boolean().optional(),
    premiumTier: PremiumTier.optional(),
    premiumUntil: z.coerce.date().nullable().optional(),
    verificationStatus: VerificationStatus.optional(),
    rejectionReason: z.string().trim().min(1).max(500).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: "Aucun champ à mettre à jour" })
  .refine((body) => body.verificationStatus !== "REJECTED" || Boolean(body.rejectionReason), {
    path: ["rejectionReason"],
    message: "Le motif de refus est obligatoire",
  });

export const AdminVerificationQueueSearchParams = pagination(20).extend({
  status: VerificationStatus.optional(),
  q: search,
});

export const AdminReviewVerificationDocDto = z
  .object({
    providerId: IdSchema,
    docId: IdSchema,
    decision: VerificationDecision,
    rejectionReason: z.string().trim().max(500).optional(),
  })
  .refine((body) => body.decision !== "REJECTED" || Boolean(body.rejectionReason), {
    path: ["rejectionReason"],
    message: "Le motif de refus est obligatoire",
  });

export const AdminBookingSearchParams = pagination(50).extend({
  q: search,
  status: BookingStatus.optional(),
});

export const AdminCancelBookingDto = z.object({
  reason: z.string().trim().min(3).max(500),
});

export const AdminReviewSearchParams = pagination(50).extend({
  q: search,
  rating: z.coerce.number().int().min(1).max(5).optional(),
  isPublic: BooleanQuerySchema.optional(),
});

export const AdminUpdateReviewDto = z.object({
  isPublic: z.boolean(),
});

export const AdminConversationSearchParams = pagination(50).extend({
  q: search,
});

export const AdminMessagesQueryParams = pagination(100);

export const AdminContactSearchParams = pagination(50).extend({
  q: search,
  status: ContactStatus.optional(),
});

export const AdminUpdateContactDto = z.object({
  status: ContactStatus,
});

export const AdminReportSearchParams = pagination(50).extend({
  status: ReportStatus.optional(),
  targetKind: ReportTargetKind.optional(),
});

export const AdminResolveReportDto = z.object({
  status: z.literal("RESOLVED").default("RESOLVED"),
  resolution: z.string().trim().min(1).max(1000),
});

export const AdminCreateCategoryDto = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9_-]+$/),
  description: optionalText(500),
  icon: optionalText(60),
  image: optionalText(500),
  color: optionalText(60),
  order: z.number().int().min(0).max(10_000).optional(),
  isActive: z.boolean().optional(),
});

export const AdminUpdateCategoryDto = AdminCreateCategoryDto.partial().refine(
  (body) => Object.keys(body).length > 0,
  { message: "Aucun champ à mettre à jour" },
);

export const AdminCreateSubcategoryDto = z.object({
  categoryId: IdSchema,
  parentId: IdSchema.nullable().optional(),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9_-]+$/),
  description: optionalText(500),
  icon: optionalText(60),
  order: z.number().int().min(0).max(10_000).optional(),
  isActive: z.boolean().optional(),
});

export const AdminUpdateSubcategoryDto = AdminCreateSubcategoryDto.omit({
  categoryId: true,
  parentId: true,
})
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: "Aucun champ à mettre à jour" });

const aliases = z.array(z.string().trim().min(1).max(100)).max(20);

export const AdminPlaceSearchParams = pagination(100).extend({
  q: search,
  kind: PlaceKind.optional(),
  parentId: IdSchema.optional(),
  active: BooleanQuerySchema.optional(),
});

export const AdminCreatePlaceDto = z.object({
  kind: PlaceKind,
  label: z.string().trim().min(2).max(100),
  parentId: IdSchema.nullable().optional(),
  aliases: aliases.default([]),
  source: optionalText(500),
  latitude: LatitudeSchema.nullable().optional(),
  longitude: LongitudeSchema.nullable().optional(),
  active: z.boolean().optional(),
});

export const AdminUpdatePlaceDto = z
  .object({
    label: z.string().trim().min(2).max(100).optional(),
    aliases: aliases.optional(),
    source: optionalText(500),
    latitude: LatitudeSchema.nullable().optional(),
    longitude: LongitudeSchema.nullable().optional(),
    active: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: "Aucun champ à mettre à jour" });

export const AdminMergeDto = z
  .object({
    fromId: IdSchema,
    intoId: IdSchema,
  })
  .refine((body) => body.fromId !== body.intoId, {
    path: ["intoId"],
    message: "Choisissez deux éléments différents",
  });

export const AdminSuggestionSearchParams = pagination(50).extend({
  status: SuggestionStatus.optional(),
});

export const AdminReferenceSearchParams = pagination(100).extend({
  q: search,
  type: ReferenceType.optional(),
  categoryId: IdSchema.optional(),
  active: BooleanQuerySchema.optional(),
});

export const AdminCreateReferenceDto = z.object({
  type: ReferenceType,
  label: z.string().trim().min(1).max(100),
  aliases: aliases.default([]),
  categoryId: IdSchema.nullable().optional(),
  order: z.number().int().min(0).max(10_000).optional(),
  active: z.boolean().optional(),
  suggested: z.boolean().optional(),
  source: optionalText(500),
});

export const AdminUpdateReferenceDto = z
  .object({
    label: z.string().trim().min(1).max(100).optional(),
    aliases: aliases.optional(),
    categoryId: IdSchema.nullable().optional(),
    order: z.number().int().min(0).max(10_000).optional(),
    active: z.boolean().optional(),
    suggested: z.boolean().optional(),
    source: optionalText(500),
  })
  .refine((body) => Object.keys(body).length > 0, { message: "Aucun champ à mettre à jour" });

export type SiteSettings = {
  [K in (typeof SITE_SETTING_STRING_KEYS)[number]]: string;
} & {
  [K in (typeof SITE_SETTING_BOOLEAN_KEYS)[number]]: boolean;
};
export type SiteSettingKey = keyof SiteSettings;
export type AdminUpdateSettingsInput = z.infer<typeof AdminUpdateSettingsDto>;
export type AdminUserSearchQuery = z.infer<typeof AdminUserSearchParams>;
export type AdminUpdateUserInput = z.infer<typeof AdminUpdateUserDto>;
export type AdminProviderSearchQuery = z.infer<typeof AdminProviderSearchParams>;
export type AdminUpdateProviderInput = z.infer<typeof AdminUpdateProviderDto>;
export type AdminVerificationQueueQuery = z.infer<typeof AdminVerificationQueueSearchParams>;
export type AdminReviewVerificationDocInput = z.infer<typeof AdminReviewVerificationDocDto>;
export type AdminBookingSearchQuery = z.infer<typeof AdminBookingSearchParams>;
export type AdminCancelBookingInput = z.infer<typeof AdminCancelBookingDto>;
export type AdminReviewSearchQuery = z.infer<typeof AdminReviewSearchParams>;
export type AdminUpdateReviewInput = z.infer<typeof AdminUpdateReviewDto>;
export type AdminConversationSearchQuery = z.infer<typeof AdminConversationSearchParams>;
export type AdminMessagesQuery = z.infer<typeof AdminMessagesQueryParams>;
export type AdminContactSearchQuery = z.infer<typeof AdminContactSearchParams>;
export type AdminUpdateContactInput = z.infer<typeof AdminUpdateContactDto>;
export type AdminReportSearchQuery = z.infer<typeof AdminReportSearchParams>;
export type AdminResolveReportInput = z.infer<typeof AdminResolveReportDto>;
export type AdminCreateCategoryInput = z.infer<typeof AdminCreateCategoryDto>;
export type AdminUpdateCategoryInput = z.infer<typeof AdminUpdateCategoryDto>;
export type AdminCreateSubcategoryInput = z.infer<typeof AdminCreateSubcategoryDto>;
export type AdminUpdateSubcategoryInput = z.infer<typeof AdminUpdateSubcategoryDto>;
export type AdminPlaceSearchQuery = z.infer<typeof AdminPlaceSearchParams>;
export type AdminCreatePlaceInput = z.infer<typeof AdminCreatePlaceDto>;
export type AdminUpdatePlaceInput = z.infer<typeof AdminUpdatePlaceDto>;
export type AdminMergeInput = z.infer<typeof AdminMergeDto>;
export type AdminSuggestionSearchQuery = z.infer<typeof AdminSuggestionSearchParams>;
export type AdminReferenceSearchQuery = z.infer<typeof AdminReferenceSearchParams>;
export type AdminCreateReferenceInput = z.infer<typeof AdminCreateReferenceDto>;
export type AdminUpdateReferenceInput = z.infer<typeof AdminUpdateReferenceDto>;
