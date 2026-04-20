import { z } from "zod";
import {
  DateTimeSchema,
  IdSchema,
  NullableDateTimeSchema,
} from "./common.js";
import { BookingSchema, ProviderSchema, UserSummarySchema } from "./models.js";

export const QuoteStatus = z.enum([
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "DECLINED",
  "EXPIRED",
]);
export type QuoteStatus = z.infer<typeof QuoteStatus>;

export const QuoteLineItemSchema = z.object({
  id: IdSchema,
  label: z.string(),
  qty: z.number().positive(),
  unit: z.string(),
  unitPrice: z.number().int().nonnegative(),
  order: z.number().int().min(0).default(0),
});

export const QuoteProviderSummarySchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  profession: z.string(),
  hourlyRate: z.number().nullable().optional(),
  isPremium: z.boolean().optional(),
  rating: z.number().optional(),
  totalReviews: z.number().int().min(0).optional(),
  totalJobs: z.number().int().min(0).optional(),
  user: UserSummarySchema.extend({
    city: z.string().nullable().optional(),
  }),
});

export const QuoteClientSummarySchema = UserSummarySchema.extend({
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
});

export const QuoteSchema = z.object({
  id: IdSchema,
  jobRequestId: IdSchema.nullable(),
  providerId: IdSchema,
  clientId: IdSchema,
  message: z.string(),
  validityDays: z.number().int().positive(),
  startDateKind: z.string(),
  discountPct: z.number().int().min(0).max(100),
  subtotal: z.number().int(),
  discountAmt: z.number().int(),
  total: z.number().int(),
  commissionPct: z.number().int(),
  commissionAmt: z.number().int(),
  payoutAmt: z.number().int(),
  status: QuoteStatus,
  sentAt: NullableDateTimeSchema,
  acceptedAt: NullableDateTimeSchema,
  declinedAt: NullableDateTimeSchema,
  expiresAt: NullableDateTimeSchema,
  bookingId: IdSchema.nullable(),
  lines: z.array(QuoteLineItemSchema),
  provider: QuoteProviderSummarySchema.optional(),
  client: QuoteClientSummarySchema.optional(),
  jobRequest: z
    .object({
      id: IdSchema,
      service: z.string(),
      address: z.string(),
      city: z.string(),
      budget: z.number().int().nullable(),
      status: z.string(),
    })
    .nullable()
    .optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

// --- Input DTOs ---

export const QuoteLineInputSchema = z.object({
  label: z.string().min(1),
  qty: z.number().positive(),
  unit: z.string().min(1),
  unitPrice: z.number().int().nonnegative(),
});

export const CreateQuoteDto = z.object({
  jobRequestId: IdSchema.optional(),
  lines: z.array(QuoteLineInputSchema).min(1),
  message: z.string().min(1),
  validityDays: z.number().int().positive().max(60).default(7),
  startDateKind: z.string().min(1),
  discountPct: z.number().int().min(0).max(100).default(0),
});

export const UpdateQuoteDto = CreateQuoteDto.omit({ jobRequestId: true })
  .partial()
  .strict();

// --- Responses ---

export const QuoteResponseSchema = z.object({
  success: z.literal(true),
  quote: QuoteSchema,
});

export const QuotesListResponseSchema = z.object({
  success: z.literal(true),
  quotes: z.array(QuoteSchema),
});

export const QuoteAcceptResponseSchema = z.object({
  success: z.literal(true),
  quote: QuoteSchema,
  booking: BookingSchema,
});

export type QuoteLineItem = z.infer<typeof QuoteLineItemSchema>;
export type Quote = z.infer<typeof QuoteSchema>;
export type QuoteLineInput = z.infer<typeof QuoteLineInputSchema>;
export type CreateQuoteDtoType = z.infer<typeof CreateQuoteDto>;
export type UpdateQuoteDtoType = z.infer<typeof UpdateQuoteDto>;
export type QuoteResponse = z.infer<typeof QuoteResponseSchema>;
export type QuotesListResponse = z.infer<typeof QuotesListResponseSchema>;
export type QuoteAcceptResponse = z.infer<typeof QuoteAcceptResponseSchema>;
