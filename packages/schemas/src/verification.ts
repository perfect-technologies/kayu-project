import { z } from "zod";
import {
  DateTimeSchema,
  IdSchema,
  NullableDateTimeSchema,
  PaginationMetaSchema,
  StoragePathSchema,
  type Wire,
  pagination,
} from "./common.js";
import { VerificationDecision, VerificationDocKind, VerificationStatus } from "./enums.js";

export const VerificationStoragePolicy = z.enum(["SUPABASE_PRIVATE"]);
export type VerificationStoragePolicy = z.infer<typeof VerificationStoragePolicy>;

export const VerificationState = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "IN_REVIEW",
  "VERIFIED",
  "REJECTED",
]);
export type VerificationState = z.infer<typeof VerificationState>;

// Files are private: resolve `storagePath` through `GET /me/media/sign-read`.
export const VerificationDocSchema = z.object({
  id: IdSchema,
  kind: VerificationDocKind,
  storagePath: z.string(),
  fileName: z.string(),
  mime: z.string(),
  bytes: z.number().int(),
  uploadedAt: DateTimeSchema,
  reviewedAt: NullableDateTimeSchema,
  reviewedById: z.string().nullable(),
  decision: VerificationDecision.nullable(),
  rejectionReason: z.string().nullable(),
  storagePolicy: VerificationStoragePolicy.optional(),
});
export type VerificationDoc = z.infer<typeof VerificationDocSchema>;

export const VerificationStoragePolicyDetailsSchema = z.object({
  mode: VerificationStoragePolicy,
  title: z.string(),
  description: z.string(),
});
export type VerificationStoragePolicyDetails = z.infer<typeof VerificationStoragePolicyDetailsSchema>;

export const VerificationStateSchema = z.object({
  state: VerificationState,
  progress: z.number().int().min(0).max(100),
  docs: z.array(VerificationDocSchema),
  missingKinds: z.array(VerificationDocKind),
  rejectionReason: z.string().nullable(),
  submittedAt: NullableDateTimeSchema,
  reviewedAt: NullableDateTimeSchema,
  storage: VerificationStoragePolicyDetailsSchema,
});
export const VerificationStateResponseSchema = VerificationStateSchema;
export type VerificationStateResponse = z.infer<typeof VerificationStateSchema>;

export const SubmitVerificationResponseSchema = VerificationStateSchema;
export type SubmitVerificationResponse = VerificationStateResponse;

export const UploadVerificationDocDto = z.object({
  kind: VerificationDocKind,
  path: StoragePathSchema,
  fileName: z.string().trim().max(255).optional(),
  mime: z.string().trim().min(1).max(120),
  bytes: z.number().int().positive(),
});
export type UploadVerificationDocDto = Wire<typeof UploadVerificationDocDto>;
export type UploadVerificationDocInput = z.infer<typeof UploadVerificationDocDto>;

export const UploadVerificationDocResponseSchema = z.object({
  success: z.literal(true),
  doc: VerificationDocSchema,
});
export type UploadVerificationDocResponse = z.infer<typeof UploadVerificationDocResponseSchema>;

export const RemoveVerificationDocResponseSchema = z.object({ success: z.literal(true) });
export type RemoveVerificationDocResponse = z.infer<typeof RemoveVerificationDocResponseSchema>;

export const AdminVerificationQueueSearchParams = pagination(20).extend({
  status: VerificationStatus.optional(),
  q: z.string().trim().min(1).max(120).optional(),
});
export type AdminVerificationQueueSearchParams = Wire<typeof AdminVerificationQueueSearchParams>;
export type AdminVerificationQueueQuery = z.infer<typeof AdminVerificationQueueSearchParams>;

export const AdminVerificationSubmissionSchema = z.object({
  providerId: IdSchema,
  providerName: z.string(),
  providerEmail: z.string().nullable(),
  displayName: z.string(),
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
export type AdminVerificationSubmission = z.infer<typeof AdminVerificationSubmissionSchema>;

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
export type AdminVerificationQueueResponse = z.infer<typeof AdminVerificationQueueResponseSchema>;

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
export type AdminReviewVerificationDocDto = Wire<typeof AdminReviewVerificationDocDto>;
export type AdminReviewVerificationDocInput = z.infer<typeof AdminReviewVerificationDocDto>;

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
export type AdminReviewVerificationDocResponse = z.infer<typeof AdminReviewVerificationDocResponseSchema>;
