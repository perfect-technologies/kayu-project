import { z } from "zod";
import {
  DateTimeSchema,
  IdSchema,
  NullableDateTimeSchema,
  PaginationMetaSchema,
  PaginationParams,
} from "./common.js";
import { VerificationStatus } from "./enums.js";

export const VerificationDocKind = z.enum([
  "ID_FRONT",
  "ID_BACK",
  "SELFIE",
  "ADDRESS",
  "CERT_OPTIONAL",
]);
export type VerificationDocKind = z.infer<typeof VerificationDocKind>;

export const VerificationDecision = z.enum(["APPROVED", "REJECTED"]);
export type VerificationDecision = z.infer<typeof VerificationDecision>;

export const VerificationStoragePolicy = z.enum([
  "LAUNCH_STUB_METADATA_ONLY",
]);
export type VerificationStoragePolicy = z.infer<
  typeof VerificationStoragePolicy
>;

export const VerificationState = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "IN_REVIEW",
  "VERIFIED",
  "REJECTED",
]);
export type VerificationState = z.infer<typeof VerificationState>;

export const VerificationDocSchema = z.object({
  id: IdSchema,
  kind: VerificationDocKind,
  url: z.string().min(1),
  storagePolicy: VerificationStoragePolicy,
  fileName: z.string().nullable(),
  fileSize: z.number().int().nullable(),
  mimeType: z.string().nullable(),
  uploadedAt: DateTimeSchema,
  reviewedAt: NullableDateTimeSchema,
  reviewedBy: z.string().nullable(),
  decision: VerificationDecision.nullable(),
  rejectionReason: z.string().nullable(),
});
export type VerificationDoc = z.infer<typeof VerificationDocSchema>;

export const VerificationStoragePolicyDetailsSchema = z.object({
  mode: VerificationStoragePolicy,
  title: z.string(),
  description: z.string(),
});
export type VerificationStoragePolicyDetails = z.infer<
  typeof VerificationStoragePolicyDetailsSchema
>;

export const VerificationStateResponseSchema = z.object({
  state: VerificationState,
  progress: z.number().int().min(0).max(100),
  docs: z.array(VerificationDocSchema),
  missingKinds: z.array(VerificationDocKind),
  rejectionReason: z.string().nullable(),
  submittedAt: NullableDateTimeSchema,
  reviewedAt: NullableDateTimeSchema,
  storage: VerificationStoragePolicyDetailsSchema,
});
export type VerificationStateResponse = z.infer<
  typeof VerificationStateResponseSchema
>;

export const UploadVerificationDocDto = z.object({
  kind: VerificationDocKind,
  fileName: z.string().max(255).optional(),
  fileSize: z.number().int().positive().optional(),
  mimeType: z.string().max(120).optional(),
});
export type UploadVerificationDocDtoType = z.infer<
  typeof UploadVerificationDocDto
>;

export const UploadVerificationDocResponseSchema = z.object({
  success: z.literal(true),
  doc: VerificationDocSchema,
});
export type UploadVerificationDocResponse = z.infer<
  typeof UploadVerificationDocResponseSchema
>;

// ---------- Disputes ----------

export const DisputeStatus = z.enum([
  "NEW",
  "PENDING_PRO",
  "PENDING_CLIENT",
  "INVESTIGATING",
  "ESCALATED",
  "RESOLVED",
]);
export type DisputeStatus = z.infer<typeof DisputeStatus>;

export const DisputeSeverity = z.enum(["LOW", "MEDIUM", "HIGH"]);
export type DisputeSeverity = z.infer<typeof DisputeSeverity>;

export const DisputeOrigin = z.enum(["CLIENT", "PROVIDER"]);
export type DisputeOrigin = z.infer<typeof DisputeOrigin>;

export const DisputeEvidenceSchema = z.object({
  id: IdSchema,
  url: z.string().min(1),
  note: z.string().nullable(),
  uploadedAt: DateTimeSchema,
  uploadedByRole: z.enum(["client", "pro", "ops"]),
});
export type DisputeEvidence = z.infer<typeof DisputeEvidenceSchema>;

export const DisputeBookingSummarySchema = z.object({
  id: IdSchema,
  title: z.string(),
  price: z.number().nullable(),
  scheduledDate: NullableDateTimeSchema,
});

export const DisputeClientSummarySchema = z.object({
  id: IdSchema,
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  avatar: z.string().nullable(),
});

export const DisputeSchema = z.object({
  id: IdSchema,
  bookingId: IdSchema,
  origin: DisputeOrigin,
  openedById: IdSchema,
  reason: z.string(),
  clientStatement: z.string().nullable(),
  proStatement: z.string().nullable(),
  status: DisputeStatus,
  severity: DisputeSeverity,
  resolution: z.string().nullable(),
  resolutionPct: z.number().int().nullable(),
  resolvedAt: NullableDateTimeSchema,
  deadlineAt: NullableDateTimeSchema,
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  evidences: z.array(DisputeEvidenceSchema),
  booking: DisputeBookingSummarySchema.nullable().optional(),
  client: DisputeClientSummarySchema.nullable().optional(),
});
export type Dispute = z.infer<typeof DisputeSchema>;

export const DisputeEnvelopeSchema = z.object({
  dispute: DisputeSchema.nullable(),
});
export type DisputeEnvelopeResponse = z.infer<typeof DisputeEnvelopeSchema>;

export const RespondDisputeDto = z.object({
  statement: z.string().min(10).max(2000),
  evidenceUrls: z.array(z.string().min(1).max(2048)).max(5).default([]),
});
export type RespondDisputeDtoType = z.infer<typeof RespondDisputeDto>;

export const RespondDisputeResponseSchema = z.object({
  success: z.literal(true),
  dispute: DisputeSchema,
});
export type RespondDisputeResponse = z.infer<
  typeof RespondDisputeResponseSchema
>;

export const SubmitVerificationResponseSchema = VerificationStateResponseSchema;
export type SubmitVerificationResponse = VerificationStateResponse;

export const AdminVerificationQueueSearchParams = PaginationParams.extend({
  status: VerificationStatus.optional(),
  search: z.string().optional(),
}).extend({
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
export type AdminVerificationQueueSearchParams = z.infer<
  typeof AdminVerificationQueueSearchParams
>;

export const AdminVerificationSubmissionSchema = z.object({
  providerId: IdSchema,
  providerName: z.string(),
  providerEmail: z.string().nullable(),
  profession: z.string(),
  verificationStatus: VerificationStatus,
  submittedAt: NullableDateTimeSchema,
  reviewedAt: NullableDateTimeSchema,
  rejectionReason: z.string().nullable(),
  docs: z.array(VerificationDocSchema),
  counts: z.object({
    total: z.number().int().min(0),
    pending: z.number().int().min(0),
    approved: z.number().int().min(0),
    rejected: z.number().int().min(0),
  }),
});
export type AdminVerificationSubmission = z.infer<
  typeof AdminVerificationSubmissionSchema
>;

export const AdminVerificationQueueResponseSchema = z.object({
  success: z.literal(true),
  submissions: z.array(AdminVerificationSubmissionSchema),
  pagination: PaginationMetaSchema,
  stats: z.object({
    underReview: z.number().int().min(0),
    rejected: z.number().int().min(0),
    verified: z.number().int().min(0),
  }),
});
export type AdminVerificationQueueResponse = z.infer<
  typeof AdminVerificationQueueResponseSchema
>;

export const AdminReviewVerificationDocDto = z
  .object({
    providerId: IdSchema,
    docId: IdSchema,
    decision: VerificationDecision,
    rejectionReason: z.string().trim().max(500).optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.decision === "REJECTED" &&
      (!value.rejectionReason || value.rejectionReason.trim().length === 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["rejectionReason"],
        message: "rejectionReason is required when rejecting a document",
      });
    }
  });
export type AdminReviewVerificationDocDtoType = z.infer<
  typeof AdminReviewVerificationDocDto
>;

export const AdminReviewVerificationDocResponseSchema = z.object({
  success: z.literal(true),
  providerId: IdSchema,
  previousStatus: VerificationStatus,
  verificationStatus: VerificationStatus,
  docs: z.array(VerificationDocSchema),
  reviewedDoc: VerificationDocSchema,
  reviewedAt: NullableDateTimeSchema,
  rejectionReason: z.string().nullable(),
});
export type AdminReviewVerificationDocResponse = z.infer<
  typeof AdminReviewVerificationDocResponseSchema
>;
