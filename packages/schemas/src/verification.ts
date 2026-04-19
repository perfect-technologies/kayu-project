import { z } from "zod";
import {
  DateTimeSchema,
  IdSchema,
  NullableDateTimeSchema,
} from "./common.js";

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
  fileName: z.string().nullable(),
  fileSize: z.number().int().nullable(),
  mimeType: z.string().nullable(),
  uploadedAt: DateTimeSchema,
  decision: VerificationDecision.nullable(),
  rejectionReason: z.string().nullable(),
});
export type VerificationDoc = z.infer<typeof VerificationDocSchema>;

export const VerificationStateResponseSchema = z.object({
  state: VerificationState,
  progress: z.number().int().min(0).max(100),
  docs: z.array(VerificationDocSchema),
  missingKinds: z.array(VerificationDocKind),
  rejectionReason: z.string().nullable(),
  submittedAt: NullableDateTimeSchema,
  reviewedAt: NullableDateTimeSchema,
});
export type VerificationStateResponse = z.infer<
  typeof VerificationStateResponseSchema
>;

export const UploadVerificationDocDto = z.object({
  kind: VerificationDocKind,
  url: z.string().min(1).max(2048),
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
