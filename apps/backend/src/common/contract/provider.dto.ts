import { z } from "zod";
import {
  HttpsUrlSchema,
  IdSchema,
  LatitudeSchema,
  LongitudeSchema,
  PhoneE164Schema,
  StoragePathSchema,
  optionalText,
  pagination,
} from "./common";
import { MediaListInputSchema } from "./media";
import { ScheduleInputSchema } from "./schedule";

const uniqueIds = (max: number) =>
  z
    .array(IdSchema)
    .max(max)
    .refine((ids) => new Set(ids).size === ids.length, "Choix en double");

export const PricingInputSchema = z.object({
  amount: z.number().int().min(0).max(1_000_000_000),
  currencyId: IdSchema,
  unitId: IdSchema,
});

export const SocialLinksInputSchema = z.object({
  youtubeUrl: HttpsUrlSchema.nullable().optional(),
  instagramUrl: HttpsUrlSchema.nullable().optional(),
  tiktokUrl: HttpsUrlSchema.nullable().optional(),
  facebookUrl: HttpsUrlSchema.nullable().optional(),
});

const providerFields = {
  displayName: z.string().trim().min(2).max(120),
  phone: PhoneE164Schema,
  whatsapp: PhoneE164Schema.nullable().optional(),
  email: z.string().trim().toLowerCase().max(254).email().nullable().optional(),
  profilePhoto: z.union([StoragePathSchema, HttpsUrlSchema]).nullable().optional(),
  subcategoryId: IdSchema,
  yearsExperience: z.number().int().min(0).max(80).nullable().optional(),
  skillIds: uniqueIds(30).default([]),
  freeSkills: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  description: optionalText(2000),
  placeId: IdSchema,
  addressLine: optionalText(200),
  latitude: LatitudeSchema.nullable().optional(),
  longitude: LongitudeSchema.nullable().optional(),
  languageIds: uniqueIds(20).default([]),
  modeIds: uniqueIds(10).default([]),
  pricing: PricingInputSchema.nullable().optional(),
  schedule: ScheduleInputSchema,
  media: MediaListInputSchema.default([]),
  social: SocialLinksInputSchema.optional(),
};

const coordinatesTogether = (value: { latitude?: number | null; longitude?: number | null }) =>
  (value.latitude === undefined || value.latitude === null) ===
  (value.longitude === undefined || value.longitude === null);

export const PublishProviderDto = z
  .object({
    ...providerFields,
    acceptTerms: z.literal(true, { message: "Les conditions doivent être acceptées" }),
  })
  .refine(coordinatesTogether, { path: ["latitude"], message: "Latitude et longitude vont ensemble" });

export const UpdateProviderDto = z
  .object({
    displayName: providerFields.displayName.optional(),
    phone: providerFields.phone.optional(),
    whatsapp: providerFields.whatsapp,
    email: providerFields.email,
    profilePhoto: providerFields.profilePhoto,
    subcategoryId: providerFields.subcategoryId.optional(),
    yearsExperience: providerFields.yearsExperience,
    skillIds: uniqueIds(30).optional(),
    freeSkills: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
    description: providerFields.description,
    placeId: providerFields.placeId.optional(),
    addressLine: providerFields.addressLine,
    latitude: providerFields.latitude,
    longitude: providerFields.longitude,
    languageIds: uniqueIds(20).optional(),
    modeIds: uniqueIds(10).optional(),
    pricing: providerFields.pricing,
    schedule: ScheduleInputSchema.optional(),
    media: MediaListInputSchema.optional(),
    social: SocialLinksInputSchema.optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: "Aucun champ à mettre à jour" })
  .refine(
    (body) =>
      (body.latitude === undefined && body.longitude === undefined) || coordinatesTogether(body),
    { path: ["latitude"], message: "Latitude et longitude vont ensemble" },
  );

export const PutScheduleDto = ScheduleInputSchema;

export const PutMediaDto = z.object({
  items: MediaListInputSchema,
});

export const UpdateAvailabilityDto = z.object({
  isAvailable: z.boolean(),
});

export const EarningsTransactionsQueryParams = pagination(20);

export type PublishProviderInput = z.infer<typeof PublishProviderDto>;
export type UpdateProviderInput = z.infer<typeof UpdateProviderDto>;
export type PutMediaInput = z.infer<typeof PutMediaDto>;
export type UpdateAvailabilityInput = z.infer<typeof UpdateAvailabilityDto>;
export type EarningsTransactionsQuery = z.infer<typeof EarningsTransactionsQueryParams>;
