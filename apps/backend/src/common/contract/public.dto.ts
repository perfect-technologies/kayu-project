import { z } from "zod";
import {
  BooleanQuerySchema,
  DateOnlySchema,
  IdSchema,
  LatitudeSchema,
  LongitudeSchema,
  csvIds,
  pagination,
} from "./common";
import { PlaceKind, ReferenceType } from "./enums";

export const PlacesQueryParams = pagination(100).extend({
  kind: PlaceKind.optional(),
  parentId: IdSchema.optional(),
  q: z.string().trim().min(1).max(100).optional(),
  ids: csvIds.optional(),
});

export const ReferencesQueryParams = pagination(100).extend({
  type: ReferenceType,
  categoryId: IdSchema.optional(),
  q: z.string().trim().min(1).max(100).optional(),
});

export const ProviderSearchSort = z.enum(["recommended", "rating", "distance", "newest"]);

export const ProviderSearchParams = pagination(20)
  .extend({
    q: z.string().trim().min(1).max(120).optional(),
    categoryId: IdSchema.optional(),
    categorySlug: z.string().trim().min(1).max(120).optional(),
    subcategoryId: IdSchema.optional(),
    placeId: IdSchema.optional(),
    languageId: IdSchema.optional(),
    modeId: IdSchema.optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    verifiedOnly: BooleanQuerySchema.optional(),
    premiumOnly: BooleanQuerySchema.optional(),
    sort: ProviderSearchSort.default("recommended"),
    lat: LatitudeSchema.optional(),
    lng: LongitudeSchema.optional(),
  })
  .superRefine((params, ctx) => {
    if ((params.lat === undefined) !== (params.lng === undefined)) {
      ctx.addIssue({ code: "custom", path: ["lat"], message: "lat et lng vont ensemble" });
    }
    if (params.sort === "distance" && params.lat === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["sort"],
        message: "Le tri par distance exige lat et lng",
      });
    }
  });

export const AvailabilityQueryParams = z.object({
  date: DateOnlySchema,
});

export const ProviderReviewsQueryParams = pagination(10);

export const CreateContactMessageDto = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().toLowerCase().max(254).email("Adresse e-mail invalide"),
  phone: z.string().trim().max(40).nullable().optional(),
  subject: z.string().trim().min(2).max(160),
  message: z.string().trim().min(10).max(5000),
});

export const GeocodeParams = z
  .object({
    q: z.string().trim().min(2).max(200).optional(),
    placeId: IdSchema.optional(),
  })
  .refine((params) => Boolean(params.q) !== Boolean(params.placeId), {
    message: "Fournir q ou placeId",
  });

export const DistanceParams = z.object({
  lat: LatitudeSchema,
  lng: LongitudeSchema,
  providerLat: LatitudeSchema.optional(),
  providerLng: LongitudeSchema.optional(),
});

export type PlacesQuery = z.infer<typeof PlacesQueryParams>;
export type ReferencesQuery = z.infer<typeof ReferencesQueryParams>;
export type ProviderSearchQuery = z.infer<typeof ProviderSearchParams>;
export type AvailabilityQuery = z.infer<typeof AvailabilityQueryParams>;
export type CreateContactMessageInput = z.infer<typeof CreateContactMessageDto>;
export type GeocodeQuery = z.infer<typeof GeocodeParams>;
export type DistanceQuery = z.infer<typeof DistanceParams>;
