import { z } from "zod";
import {
  ClientLeadTiming,
  LeadPreferredContact,
  ProviderLeadExperienceBand,
} from "./enums.js";

// Frozen launch-lead contract: moved verbatim out of dto.ts and communes.ts. It keeps the
// pre-refactor id rule so marketplace changes to common.ts cannot alter lead validation.
const IdSchema = z.string().min(1);

export const KIN_COMMUNES = [
  "Bandalungwa",
  "Barumbu",
  "Bumbu",
  "Gombe",
  "Kalamu",
  "Kasa-Vungu",
  "Kimbanseke",
  "Kinshasa",
  "Kintambo",
  "Kisenso",
  "Lemba",
  "Limete",
  "Lingwala",
  "Makala",
  "Maluku",
  "Masina",
  "Matete",
  "Mont Ngafula",
  "Ndjili",
  "Ngaba",
  "Ngaliema",
  "Ngiri-Ngiri",
  "Nsele",
  "Selembao",
] as const;

export type KinCommune = (typeof KIN_COMMUNES)[number];

// Tuple form for Zod's z.enum() which wants a non-empty string-tuple; cast to
// the literal-union-preserving shape so z.enum() infers KinCommune, not string.
export const KIN_COMMUNES_TUPLE = KIN_COMMUNES as unknown as [KinCommune, ...KinCommune[]];

const launchAttributionKeySchema = (maxLength: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(maxLength)
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/,
      "Use a stable attribution key containing only letters, numbers, dot, underscore, or hyphen",
    )
    .refine(
      (value) => !/@/.test(value) && !/(?:\D*\d){8}/.test(value),
      "Attribution keys must not contain contact or other personal data",
    )
    .transform((value) => value.toLowerCase());

export const LEAD_ATTRIBUTION_SOURCES = [
  "direct",
  "facebook",
  "instagram",
  "whatsapp",
  "referral",
  "partner",
  "community",
  "google",
  "tiktok",
  "other",
] as const;

export const LEAD_ATTRIBUTION_MEDIA = [
  "direct",
  "organic_social",
  "paid_social",
  "referral",
  "partner",
  "community",
  "qr",
] as const;

const ReferrerHostSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(253)
  .refine(
    (value) =>
      /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(
        value,
      ),
    "Must be a hostname without a scheme, path, query, or port",
  )
  .refine(
    (value) => !/(?:\D*\d){8}/.test(value),
    "Referrer host must not contain contact or other personal data",
  );

export const LeadAttributionDto = z
  .object({
    source: z.enum(LEAD_ATTRIBUTION_SOURCES).optional(),
    medium: z.enum(LEAD_ATTRIBUTION_MEDIA).optional(),
    campaign: launchAttributionKeySchema(100).optional(),
    content: launchAttributionKeySchema(100).optional(),
    referrerHost: ReferrerHostSchema.optional(),
  })
  .strict();

const LaunchLeadBaseDto = z
  .object({
    firstName: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(8).max(32),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((value) => value.toLowerCase())
      .optional(),
    operationalConsent: z.literal(true),
    marketingConsent: z.boolean().default(false),
    privacyNoticeVersion: z.string().trim().min(1).max(100),
    attribution: LeadAttributionDto.optional(),
    website: z.string().trim().max(200).optional(),
    formStartedAt: z.string().datetime({ offset: true }).optional(),
  })
  .strict();

export const CreateProviderLeadDto = LaunchLeadBaseDto.extend({
  primarySubcategoryId: IdSchema,
  additionalSubcategoryIds: z.array(IdSchema).max(2).default([]),
  experienceBand: ProviderLeadExperienceBand,
  homeCommune: z.enum(KIN_COMMUNES_TUPLE),
  serviceCommunes: z.array(z.enum(KIN_COMMUNES_TUPLE)).max(5).default([]),
  hasWhatsApp: z.boolean().optional(),
  summary: z.string().trim().max(300).optional(),
})
  .strict()
  .superRefine((value, ctx) => {
    const allIds = [
      value.primarySubcategoryId,
      ...value.additionalSubcategoryIds,
    ];
    if (new Set(allIds).size !== allIds.length) {
      ctx.addIssue({
        code: "custom",
        path: ["additionalSubcategoryIds"],
        message: "Subcategory IDs must be distinct",
      });
    }
    if (new Set(value.serviceCommunes).size !== value.serviceCommunes.length) {
      ctx.addIssue({
        code: "custom",
        path: ["serviceCommunes"],
        message: "Service communes must be distinct",
      });
    }
  });

export const CreateClientLeadDto = LaunchLeadBaseDto.extend({
  commune: z.enum(KIN_COMMUNES_TUPLE),
  neededSubcategoryIds: z.array(IdSchema).min(1).max(3),
  timing: ClientLeadTiming,
  needSummary: z.string().trim().max(300).optional(),
  preferredContact: LeadPreferredContact.optional(),
})
  .strict()
  .superRefine((value, ctx) => {
    if (
      new Set(value.neededSubcategoryIds).size !==
      value.neededSubcategoryIds.length
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["neededSubcategoryIds"],
        message: "Subcategory IDs must be distinct",
      });
    }
  });

export const CreateLaunchLeadResponseSchema = z.object({
  accepted: z.literal(true),
  message: z.literal("Merci. Votre intérêt a bien été reçu."),
});

export const LAUNCH_FUNNEL_EVENT_NAMES = [
  "launch_landing_viewed",
  "launch_role_selected",
  "launch_form_started",
  "launch_form_validation_failed",
  "launch_lead_submitted",
] as const;

export const LAUNCH_FUNNEL_DEVICE_CLASSES = [
  "mobile",
  "tablet",
  "desktop",
  "unknown",
] as const;

export const LAUNCH_FUNNEL_ROUTES = [
  "/launch",
  "/launch/providers",
  "/launch/clients",
] as const;

export const LAUNCH_FUNNEL_VALIDATION_FIELDS = [
  "form",
  "firstName",
  "phone",
  "email",
  "primarySubcategoryId",
  "additionalSubcategoryIds",
  "experienceBand",
  "homeCommune",
  "serviceCommunes",
  "hasWhatsApp",
  "summary",
  "commune",
  "neededSubcategoryIds",
  "timing",
  "needSummary",
  "preferredContact",
  "operationalConsent",
  "marketingConsent",
  "privacyNoticeVersion",
  "attribution",
] as const;

export const LAUNCH_FUNNEL_VALIDATION_ERROR_CODES = [
  "required",
  "invalid_format",
  "too_short",
  "too_long",
  "invalid_option",
  "duplicate_option",
  "consent_required",
  "rate_limited",
  "network",
  "server",
  "unknown",
] as const;

export const CreateLaunchFunnelEventDto = z
  .object({
    schemaVersion: z.literal(1),
    eventName: z.enum(LAUNCH_FUNNEL_EVENT_NAMES),
    occurredAt: z.string().datetime({ offset: true }),
    route: z.enum(LAUNCH_FUNNEL_ROUTES),
    deviceClass: z.enum(LAUNCH_FUNNEL_DEVICE_CLASSES),
    leadType: z.enum(["PROVIDER", "CLIENT"]).optional(),
    validationField: z.enum(LAUNCH_FUNNEL_VALIDATION_FIELDS).optional(),
    validationErrorCode: z
      .enum(LAUNCH_FUNNEL_VALIDATION_ERROR_CODES)
      .optional(),
    attribution: LeadAttributionDto.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const needsLeadType = value.eventName !== "launch_landing_viewed";
    if (needsLeadType && !value.leadType) {
      ctx.addIssue({
        code: "custom",
        path: ["leadType"],
        message: "leadType is required for this event",
      });
    }

    const isValidationFailure =
      value.eventName === "launch_form_validation_failed";
    if (
      isValidationFailure &&
      (!value.validationField || !value.validationErrorCode)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["validationField"],
        message:
          "validationField and validationErrorCode are required for validation failures",
      });
    }
    if (
      !isValidationFailure &&
      (value.validationField || value.validationErrorCode)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["validationField"],
        message: "validation details are allowed only for validation failures",
      });
    }
  });

export const CreateLaunchFunnelEventResponseSchema = z
  .object({
    accepted: z.literal(true),
  })
  .strict();

export type LeadAttributionDtoType = z.infer<typeof LeadAttributionDto>;
export type CreateProviderLeadDtoType = z.input<typeof CreateProviderLeadDto>;
export type CreateClientLeadDtoType = z.input<typeof CreateClientLeadDto>;
export type CreateLaunchLeadResponse = z.infer<
  typeof CreateLaunchLeadResponseSchema
>;
export type CreateLaunchFunnelEventDtoType = z.input<
  typeof CreateLaunchFunnelEventDto
>;
export type CreateLaunchFunnelEventResponse = z.infer<
  typeof CreateLaunchFunnelEventResponseSchema
>;
