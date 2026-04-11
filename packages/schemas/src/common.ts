import { z } from "zod";

export const IdSchema = z.string().min(1);
export const DateTimeSchema = z.union([z.string(), z.date()]);
export const NullableDateTimeSchema = DateTimeSchema.nullable();
export const JsonObjectSchema = z.record(z.string(), z.unknown());
export const JsonValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  JsonObjectSchema,
  z.array(z.unknown()),
  z.null(),
]);

export const BooleanQueryParamSchema = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

export const PaginationParams = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const PaginationMetaSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  hasMore: z.boolean().optional(),
});

export const createPaginatedResponseSchema = <ItemSchema extends z.ZodTypeAny>(
  itemSchema: ItemSchema,
) =>
  z.object({
    data: z.array(itemSchema),
    pagination: PaginationMetaSchema,
  });

export const createApiSuccessResponseSchema = <DataSchema extends z.ZodTypeAny>(
  dataSchema: DataSchema,
) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
  });

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string().optional(),
  code: z.string().optional(),
  details: z.unknown().optional(),
});

export type PaginationParams = z.infer<typeof PaginationParams>;
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
export type PaginatedResponse<T> = z.infer<
  ReturnType<typeof createPaginatedResponseSchema<z.ZodType<T>>>
>;
export type ApiSuccessResponse<T> = z.infer<
  ReturnType<typeof createApiSuccessResponseSchema<z.ZodType<T>>>
>;
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
