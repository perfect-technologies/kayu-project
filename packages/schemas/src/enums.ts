import { z } from "zod";

export const UserRole = z.enum(["CLIENT", "PROVIDER", "ADMIN"]);
export type UserRole = z.infer<typeof UserRole>;

export const ClientTrustLevel = z.enum([
  "NEW_CLIENT",
  "REGULAR",
  "GOOD_CLIENT",
  "VIP_CLIENT",
]);
export type ClientTrustLevel = z.infer<typeof ClientTrustLevel>;

export const TrustLevel = z.enum([
  "NEWCOMER",
  "ESTABLISHED",
  "TRUSTED",
  "EXPERT",
  "TOP_RATED",
]);
export type TrustLevel = z.infer<typeof TrustLevel>;

export const VerificationStatus = z.enum([
  "PENDING",
  "UNDER_REVIEW",
  "VERIFIED",
  "REJECTED",
]);
export type VerificationStatus = z.infer<typeof VerificationStatus>;

export const BadgeType = z.enum([
  "PUNCTUAL",
  "QUALITY_WORK",
  "FAST_RESPONSE",
  "GREAT_COMMUNICATOR",
  "ID_VERIFIED",
  "CERTIFIED",
  "INSURED",
  "SUPER_PRO",
  "CLIENT_FAVORITE",
  "REPEAT_CLIENTS",
  "TOP_EARNER",
]);
export type BadgeType = z.infer<typeof BadgeType>;

export const BookingStatus = z.enum([
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);
export type BookingStatus = z.infer<typeof BookingStatus>;

export const FinalOfferStatus = z.enum([
  "PENDING",
  "ACCEPTED",
  "DECLINED",
  "CANCELLED",
  "EXPIRED",
]);
export type FinalOfferStatus = z.infer<typeof FinalOfferStatus>;

export const PaymentRating = z.enum([
  "PREPAID",
  "ONTIME",
  "LATE",
  "PARTIAL",
  "DISPUTED",
]);
export type PaymentRating = z.infer<typeof PaymentRating>;

export const MessageType = z.enum([
  "TEXT",
  "IMAGE",
  "FILE",
  "LOCATION",
  "BOOKING_REQUEST",
  "QUOTE",
]);
export type MessageType = z.infer<typeof MessageType>;

export const NotificationType = z.enum([
  "BOOKING_NEW",
  "BOOKING_CONFIRMED",
  "BOOKING_CANCELLED",
  "BOOKING_COMPLETED",
  "BOOKING_STARTED",
  "NEW_MESSAGE",
  "NEW_REVIEW",
  "NEW_CLIENT_REVIEW",
  "PAYMENT_RECEIVED",
  "CERTIFICATION_VERIFIED",
  "BADGE_EARNED",
  "JOB_REQUEST_NEW",
  "QUOTE_RECEIVED",
  "QUOTE_ACCEPTED",
  "QUOTE_DECLINED",
  "FINAL_OFFER_RECEIVED",
  "FINAL_OFFER_ACCEPTED",
  "FINAL_OFFER_DECLINED",
  "SYSTEM",
]);
export type NotificationType = z.infer<typeof NotificationType>;

export const JobRequestStatus = z.enum([
  "OPEN",
  "MATCHED",
  "EXPIRED",
  "CANCELLED",
]);
export type JobRequestStatus = z.infer<typeof JobRequestStatus>;

export const VisibilityLevel = z.enum([
  "PUBLIC",
  "REGISTERED",
  "CLIENTS_ONLY",
  "PRIVATE",
]);
export type VisibilityLevel = z.infer<typeof VisibilityLevel>;

export const DocType = z.enum([
  "DIPLOMA",
  "CERTIFICATE",
  "LICENSE",
  "INSURANCE",
  "ID_DOCUMENT",
  "WORK_PERMIT",
  "OTHER",
]);
export type DocType = z.infer<typeof DocType>;

export const CertificationStatus = VerificationStatus;
export type CertificationStatus = z.infer<typeof CertificationStatus>;

export const PortfolioImageType = z.enum([
  "BEFORE",
  "DURING",
  "AFTER",
  "GENERAL",
  "DETAIL",
  "PLAN",
]);
export type PortfolioImageType = z.infer<typeof PortfolioImageType>;

export const SubscriptionPlan = z.enum(["BASIC", "STANDARD", "PREMIUM"]);
export type SubscriptionPlan = z.infer<typeof SubscriptionPlan>;

export const TransactionType = z.enum(["EARNING", "PAYOUT", "BONUS", "REFUND"]);
export type TransactionType = z.infer<typeof TransactionType>;

export const TransactionStatus = z.enum(["PENDING", "COMPLETED", "FAILED"]);
export type TransactionStatus = z.infer<typeof TransactionStatus>;

export const PayoutOperator = z.enum(["MPESA", "AIRTEL", "ORANGE", "MTN"]);
export type PayoutOperator = z.infer<typeof PayoutOperator>;

export const PayoutStatus = z.enum([
  "READY",
  "PENDING",
  "COMPLETED",
  "FAILED",
  "ON_HOLD",
]);
export type PayoutStatus = z.infer<typeof PayoutStatus>;
