import { z } from "zod";

export const UserRole = z.enum(["CLIENT", "PROVIDER", "ADMIN"]);
export const VerificationStatus = z.enum(["PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED"]);
export const PremiumTier = z.enum(["FREE", "VERIFIED", "BOOSTED", "ELITE"]);
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
export const SuggestionStatus = z.enum(["PENDING", "APPROVED", "REJECTED"]);
export const ReferenceType = z.enum([
  "LANGUAGE",
  "INTERVENTION_MODE",
  "CURRENCY",
  "PRICE_UNIT",
  "SKILL",
]);
export const MediaKind = z.enum(["IMAGE", "VIDEO_UPLOAD", "VIDEO_YOUTUBE"]);
export const BookingStatus = z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]);
export const TransactionType = z.enum(["EARNING", "BONUS"]);
export const TransactionStatus = z.enum(["PENDING", "COMPLETED"]);
export const ReportTargetKind = z.enum(["USER", "PROVIDER", "REVIEW", "MESSAGE", "CONVERSATION"]);
export const ReportStatus = z.enum(["OPEN", "RESOLVED"]);
export const ContactStatus = z.enum(["NEW", "READ", "REPLIED", "CLOSED"]);
export const AddressLabel = z.enum(["HOME", "WORK", "OTHER"]);
export const VerificationDocKind = z.enum(["ID_FRONT", "ID_BACK", "SELFIE", "ADDRESS", "CERT_OPTIONAL"]);
export const VerificationDecision = z.enum(["APPROVED", "REJECTED"]);
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
export const UploadPurpose = z.enum(["avatar", "media", "attachments", "verification"]);
export const MessageAttachmentKind = z.enum(["image", "audio"]);

export type UploadPurpose = z.infer<typeof UploadPurpose>;
