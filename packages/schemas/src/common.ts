import { z } from "zod";

export const IdSchema = z.string().trim().min(1).max(64);
export const DateTimeSchema = z.union([z.string(), z.date()]);
export const NullableDateTimeSchema = DateTimeSchema.nullable();
export const JsonObjectSchema = z.record(z.string(), z.unknown());

export const BooleanQuerySchema = z.preprocess((value) => {
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return value;
}, z.boolean());

export const pagination = (defaultLimit: number) =>
  z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(defaultLimit),
  });

export const PaginationQuery = pagination(20);

export const createPaginatedResponseSchema = <ItemSchema extends z.ZodTypeAny>(
  itemSchema: ItemSchema,
) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
  });

// Kept for the unchanged `/admin/verification/submissions` envelope.
export const PaginationMetaSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  hasMore: z.boolean().optional(),
});

export const OkResponseSchema = z.object({ ok: z.literal(true) });

export const DateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date attendue au format AAAA-MM-JJ")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, "Date invalide");

export const PhoneE164Schema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s().-]/g, ""))
  .pipe(z.string().regex(/^\+[1-9]\d{6,14}$/, "Numéro international invalide."));

export const StoragePathSchema = z
  .string()
  .trim()
  .min(1)
  .max(512)
  .regex(/^[A-Za-z0-9._/-]+$/, "Chemin de fichier invalide");

export const HttpsUrlSchema = z
  .string()
  .trim()
  .max(500)
  .url()
  .refine((value) => value.startsWith("https://"), "Lien HTTPS attendu");

export const LatitudeSchema = z.coerce.number().min(-90).max(90);
export const LongitudeSchema = z.coerce.number().min(-180).max(180);

export const CountrySchema = z.enum(["RDC", "Congo"]);

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length > 0 ? value : null))
    .nullable()
    .optional();

export const csvIds = z
  .string()
  .trim()
  .transform((value) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  )
  .pipe(z.array(IdSchema).max(100));

export const API_ERROR_CODES = [
  "ACCOUNT_SUSPENDED",
  "FORBIDDEN",
  "NOT_FOUND",
  "BLOCKED",
  "FEATURE_DISABLED",
  "SELF_ACTION",
  "SLOT_TAKEN",
  "PROVIDER_UNAVAILABLE",
  "INVALID_TRANSITION",
  "REASON_REQUIRED",
  "BOOKING_NOT_COMPLETED",
  "ALREADY_EXISTS",
  "LAST_ADMIN",
  "ADMIN_ACCOUNT",
  "ROLE_CHANGE_NOT_ALLOWED",
  "REFERENCED",
  "INVALID_REFERENCE",
  "INVALID_MEDIA",
  "DOCS_MISSING",
  "RATE_LIMITED",
  "RECIPIENT_UNAVAILABLE",
  "LIMIT_REACHED",
] as const;

export const ApiErrorCodeSchema = z.enum(API_ERROR_CODES);

export const ValidationIssueSchema = z.object({
  path: z.string(),
  message: z.string(),
  code: z.string(),
});

// Business errors carry `code` plus per-code extras (`suspendedReason`, `counts`,
// `missingKinds`, `retryAfter`); Nest's own errors carry `error`; validation adds `errors`.
export const ApiErrorResponseSchema = z.looseObject({
  statusCode: z.number().int().optional(),
  code: z.string().optional(),
  message: z.string(),
  error: z.string().optional(),
  errors: z.array(ValidationIssueSchema).optional(),
});

type RequiredKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? never : K }[keyof T];

/**
 * What a client sends for a request schema: a key is optional when the schema accepts it missing
 * (optional or defaulted), and its type is the parsed type, so coerced query fields read as
 * `number` / `boolean` instead of `unknown`.
 */
export type Wire<S extends z.ZodTypeAny> = {
  [K in Extract<keyof z.output<S>, RequiredKeys<z.input<S>>>]: z.output<S>[K];
} & {
  [K in Exclude<keyof z.output<S>, RequiredKeys<z.input<S>>>]?: z.output<S>[K];
};

export type Pagination = z.infer<typeof PaginationQuery>;
export type PaginatedResponse<T> = { items: T[]; total: number; page: number; limit: number };
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
export type OkResponse = z.infer<typeof OkResponseSchema>;
export type Country = z.infer<typeof CountrySchema>;
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;
export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
