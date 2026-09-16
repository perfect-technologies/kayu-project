import { z } from "zod";

export const UserRole = z.enum(["CLIENT", "PROVIDER", "ADMIN"]);
export type UserRole = z.infer<typeof UserRole>;

export const VerificationStatus = z.enum(["PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED"]);
export type VerificationStatus = z.infer<typeof VerificationStatus>;

export const VerificationDocKind = z.enum(["ID_FRONT", "ID_BACK", "SELFIE", "ADDRESS", "CERT_OPTIONAL"]);
export type VerificationDocKind = z.infer<typeof VerificationDocKind>;

export const VerificationDecision = z.enum(["APPROVED", "REJECTED"]);
export type VerificationDecision = z.infer<typeof VerificationDecision>;

export const PremiumTier = z.enum(["FREE", "VERIFIED", "BOOSTED", "ELITE"]);
export type PremiumTier = z.infer<typeof PremiumTier>;

export const PlaceKind = z.enum([
  "COUNTRY",
  "PROVINCE",
  "CITY",
  "TERRITORY",
  "COMMUNE",
  "SECTOR",
  "CHIEFDOM",
  "QUARTIER",
  "VILLAGE",
]);
export type PlaceKind = z.infer<typeof PlaceKind>;

export const SuggestionStatus = z.enum(["PENDING", "APPROVED", "REJECTED"]);
export type SuggestionStatus = z.infer<typeof SuggestionStatus>;

export const ReferenceType = z.enum(["LANGUAGE", "INTERVENTION_MODE", "CURRENCY", "PRICE_UNIT", "SKILL"]);
export type ReferenceType = z.infer<typeof ReferenceType>;

export const MediaKind = z.enum(["IMAGE", "VIDEO_UPLOAD", "VIDEO_YOUTUBE"]);
export type MediaKind = z.infer<typeof MediaKind>;

export const BookingStatus = z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]);
export type BookingStatus = z.infer<typeof BookingStatus>;

export const TransactionType = z.enum(["EARNING", "BONUS"]);
export type TransactionType = z.infer<typeof TransactionType>;

export const TransactionStatus = z.enum(["PENDING", "COMPLETED"]);
export type TransactionStatus = z.infer<typeof TransactionStatus>;

export const NotificationType = z.enum([
  "BOOKING_NEW",
  "BOOKING_CONFIRMED",
  "BOOKING_COMPLETED",
  "BOOKING_CANCELLED",
  "NEW_MESSAGE",
  "NEW_REVIEW",
  "NEW_CLIENT_REVIEW",
  "VERIFICATION_UPDATED",
  "PLACE_SUGGESTION_RESOLVED",
  "SYSTEM",
]);
export type NotificationType = z.infer<typeof NotificationType>;

export const ReportTargetKind = z.enum(["USER", "PROVIDER", "REVIEW", "MESSAGE", "CONVERSATION"]);
export type ReportTargetKind = z.infer<typeof ReportTargetKind>;

export const ReportStatus = z.enum(["OPEN", "RESOLVED"]);
export type ReportStatus = z.infer<typeof ReportStatus>;

export const ContactStatus = z.enum(["NEW", "READ", "REPLIED", "CLOSED"]);
export type ContactStatus = z.infer<typeof ContactStatus>;

export const AddressLabel = z.enum(["HOME", "WORK", "OTHER"]);
export type AddressLabel = z.infer<typeof AddressLabel>;

export const UploadPurpose = z.enum(["avatar", "media", "attachments", "verification"]);
export type UploadPurpose = z.infer<typeof UploadPurpose>;

export const MessageAttachmentKind = z.enum(["image", "audio"]);
export type MessageAttachmentKind = z.infer<typeof MessageAttachmentKind>;

export const ProviderLeadStatus = z.enum([
  "SUBMITTED",
  "IN_REVIEW",
  "NEEDS_INFO",
  "QUALIFIED",
  "REJECTED",
  "WITHDRAWN",
  "INVITED",
  "ACTIVATED",
]);
export type ProviderLeadStatus = z.infer<typeof ProviderLeadStatus>;

export const ClientLeadStatus = z.enum([
  "SUBMITTED",
  "ELIGIBLE",
  "PAUSED",
  "DECLINED",
  "WITHDRAWN",
  "INVITED",
  "ACTIVATED",
]);
export type ClientLeadStatus = z.infer<typeof ClientLeadStatus>;

export const ProviderLeadExperienceBand = z.enum([
  "STARTING",
  "ONE_TO_THREE_YEARS",
  "FOUR_PLUS_YEARS",
]);
export type ProviderLeadExperienceBand = z.infer<
  typeof ProviderLeadExperienceBand
>;

export const ClientLeadTiming = z.enum([
  "WITHIN_7_DAYS",
  "WITHIN_30_DAYS",
  "LATER",
  "EXPLORING",
]);
export type ClientLeadTiming = z.infer<typeof ClientLeadTiming>;

export const LeadPreferredContact = z.enum(["PHONE", "WHATSAPP"]);
export type LeadPreferredContact = z.infer<typeof LeadPreferredContact>;

export const LeadSubmissionOutcome = z.enum([
  "CREATED",
  "DUPLICATE_REVIEW_REQUIRED",
]);
export type LeadSubmissionOutcome = z.infer<typeof LeadSubmissionOutcome>;
