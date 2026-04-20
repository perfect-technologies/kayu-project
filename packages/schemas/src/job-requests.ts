import { z } from "zod";
import {
  DateTimeSchema,
  IdSchema,
  NullableDateTimeSchema,
} from "./common.js";
import { JobRequestStatus } from "./enums.js";
import { CategorySummarySchema, UserSummarySchema } from "./models.js";

export const JobRequestClientSummarySchema = UserSummarySchema.extend({
  rating: z.number().nullable().optional(),
  jobs: z.number().int().min(0).default(0),
  newClient: z.boolean().default(false),
});

export const JobRequestSchema = z.object({
  id: IdSchema,
  clientId: IdSchema,
  client: JobRequestClientSummarySchema,
  category: CategorySummarySchema.nullable(),
  subcategoryId: IdSchema.nullable(),
  service: z.string(),
  description: z.string(),
  address: z.string(),
  city: z.string(),
  commune: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  whenPref: z.string(),
  estimatedHours: z.number().nullable(),
  budget: z.number().int().nullable(),
  photoCount: z.number().int().min(0).default(0),
  status: JobRequestStatus,
  urgent: z.boolean(),
  competingCount: z.number().int().min(0).default(0),
  expiresAt: NullableDateTimeSchema,
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export const JobRequestForProSchema = JobRequestSchema.extend({
  matchScore: z.number().int().min(0).max(100),
  distanceKm: z.number().nullable().optional(),
  notifiedAt: DateTimeSchema,
  dismissedAt: NullableDateTimeSchema,
  viewedAt: NullableDateTimeSchema,
});

export const CreateJobRequestDto = z.object({
  categoryId: IdSchema.optional(),
  subcategoryId: IdSchema.optional(),
  service: z.string().min(3),
  description: z.string().min(10),
  address: z.string().min(3),
  city: z.string().min(1),
  commune: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  whenPref: z.string().min(1),
  estimatedHours: z.number().positive().optional(),
  budget: z.number().int().positive().optional(),
  urgent: z.boolean().default(false),
  photoCount: z.number().int().min(0).default(0),
});

export const JobRequestResponseSchema = z.object({
  success: z.literal(true),
  request: JobRequestSchema,
});

export const JobRequestsListResponseSchema = z.object({
  success: z.literal(true),
  requests: z.array(JobRequestSchema),
});

export const JobRequestForProResponseSchema = z.object({
  success: z.literal(true),
  request: JobRequestForProSchema,
});

export const JobRequestsInboxResponseSchema = z.object({
  success: z.literal(true),
  requests: z.array(JobRequestForProSchema),
});

export const JobRequestMutationResponseSchema = z.object({
  success: z.literal(true),
});

export type JobRequestClientSummary = z.infer<typeof JobRequestClientSummarySchema>;
export type JobRequest = z.infer<typeof JobRequestSchema>;
export type JobRequestForPro = z.infer<typeof JobRequestForProSchema>;
export type CreateJobRequestDtoType = z.infer<typeof CreateJobRequestDto>;
export type JobRequestResponse = z.infer<typeof JobRequestResponseSchema>;
export type JobRequestsListResponse = z.infer<typeof JobRequestsListResponseSchema>;
export type JobRequestForProResponse = z.infer<typeof JobRequestForProResponseSchema>;
export type JobRequestsInboxResponse = z.infer<typeof JobRequestsInboxResponseSchema>;
export type JobRequestMutationResponse = z.infer<typeof JobRequestMutationResponseSchema>;
