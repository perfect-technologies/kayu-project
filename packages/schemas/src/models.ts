import { z } from "zod";
import {
  BadgeType,
  BookingStatus,
  ClientTrustLevel,
  DocType,
  MessageType,
  NotificationType,
  PaymentRating,
  PayoutOperator,
  PayoutStatus,
  PortfolioImageType,
  SubscriptionPlan,
  TransactionStatus,
  TransactionType,
  TrustLevel,
  UserRole,
  VerificationStatus,
  VisibilityLevel,
} from "./enums.js";
import {
  DateTimeSchema,
  IdSchema,
  JsonValueSchema,
  NullableDateTimeSchema,
} from "./common.js";

export const UserSummarySchema = z.object({
  id: IdSchema,
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
});

export const UserSchema = UserSummarySchema.extend({
  authUserId: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  role: UserRole,
  roleSelectedAt: NullableDateTimeSchema.optional(),
  city: z.string().nullable().optional(),
  country: z.string().default("RDC"),
  address: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  isVerified: z.boolean(),
  emailVerifiedAt: NullableDateTimeSchema.optional(),
  phoneVerifiedAt: NullableDateTimeSchema.optional(),
  isActive: z.boolean(),
  lastLoginAt: NullableDateTimeSchema.optional(),
  clientScore: z.number().optional(),
  clientTrustLevel: ClientTrustLevel.default("NEW_CLIENT"),
  onboardingStep: z.number().int().min(0).max(5).nullable().optional(),
  createdAt: DateTimeSchema.optional(),
  updatedAt: DateTimeSchema.optional(),
});

export const AuthUserSchema = UserSummarySchema.extend({
  email: z.string().email().nullable().optional(),
  role: UserRole,
  roleSelectedAt: NullableDateTimeSchema.optional(),
  isVerified: z.boolean(),
  city: z.string().nullable().optional(),
  country: z.string(),
});

export const CategorySummarySchema = z.object({
  id: IdSchema,
  name: z.string(),
  slug: z.string(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
});

export const CategorySchema = CategorySummarySchema.extend({
  description: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
  providerCount: z.number().int().min(0).optional(),
  providersCount: z.number().int().min(0).optional(),
  createdAt: DateTimeSchema.optional(),
});

export const SubcategorySchema = z.object({
  id: IdSchema,
  categoryId: IdSchema.optional(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
  createdAt: DateTimeSchema.optional(),
});

export const TradeSchema = z.object({
  id: IdSchema,
  subcategoryId: IdSchema.optional(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  basePrice: z.number().nullable().optional(),
  duration: z.number().int().nullable().optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
  createdAt: DateTimeSchema.optional(),
});

export const ProviderTradeSchema = TradeSchema.extend({
  isPrimary: z.boolean(),
  experience: z.number().int().nullable().optional(),
});

export const CategoryHierarchySchema = CategorySchema.extend({
  subcategories: z.array(
    SubcategorySchema.extend({
      trades: z.array(TradeSchema).default([]),
    }),
  ),
});

export const SkillSchema = z.object({
  id: IdSchema.optional(),
  providerId: IdSchema.optional(),
  name: z.string(),
  level: z.number().int().min(1).max(5).default(1),
  createdAt: DateTimeSchema.optional(),
});

export const ServiceZoneSchema = z.object({
  id: IdSchema.optional(),
  providerId: IdSchema.optional(),
  city: z.string(),
  commune: z.string().nullable().optional(),
  createdAt: DateTimeSchema.optional(),
});

export const ProviderBadgeSchema = z.object({
  id: IdSchema.optional(),
  providerId: IdSchema.optional(),
  badgeType: BadgeType,
  earnedAt: DateTimeSchema.optional(),
  isVisible: z.boolean().optional(),
});

export const TrustScoreSchema = z.object({
  id: IdSchema.optional(),
  providerId: IdSchema.optional(),
  overallScore: z.number(),
  reliability: z.number(),
  quality: z.number(),
  communication: z.number(),
  professionalism: z.number(),
  trustLevel: TrustLevel,
  completedJobs: z.number().int().optional(),
  cancelledJobs: z.number().int().optional(),
  avgResponseTime: z.number().int().optional(),
  updatedAt: DateTimeSchema.optional(),
  badges: z.array(ProviderBadgeSchema).default([]),
});

export const CertificationDocSchema = z.object({
  id: IdSchema.optional(),
  certificationId: IdSchema.optional(),
  type: DocType,
  fileUrl: z.string(),
  fileName: z.string(),
  uploadedAt: DateTimeSchema.optional(),
});

export const CertificationSchema = z.object({
  id: IdSchema,
  providerId: IdSchema.optional(),
  title: z.string(),
  issuingOrg: z.string(),
  certificateNum: z.string().nullable().optional(),
  status: VerificationStatus,
  verifiedAt: NullableDateTimeSchema.optional(),
  verifiedBy: z.string().nullable().optional(),
  rejectionReason: z.string().nullable().optional(),
  issueDate: NullableDateTimeSchema.optional(),
  expiryDate: NullableDateTimeSchema.optional(),
  isLifetime: z.boolean().default(false),
  categoryId: IdSchema.nullable().optional(),
  documents: z.array(CertificationDocSchema).default([]),
  createdAt: DateTimeSchema.optional(),
  updatedAt: DateTimeSchema.optional(),
});

export const PortfolioItemSchema = z.object({
  id: IdSchema,
  providerId: IdSchema.optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
  imageUrl: z.string(),
  order: z.number().int().optional(),
  createdAt: DateTimeSchema.optional(),
});

export const PortfolioImageSchema = z.object({
  id: IdSchema.optional(),
  projectId: IdSchema.optional(),
  imageType: PortfolioImageType.default("GENERAL"),
  imageUrl: z.string(),
  thumbnailUrl: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  displayOrder: z.number().int().optional(),
  uploadedAt: DateTimeSchema.optional(),
});

export const PortfolioProjectSchema = z.object({
  id: IdSchema,
  providerId: IdSchema.optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
  categoryId: IdSchema.nullable().optional(),
  bookingId: IdSchema.nullable().optional(),
  duration: z.number().int().nullable().optional(),
  price: z.number().nullable().optional(),
  images: z.array(PortfolioImageSchema).default([]),
  viewCount: z.number().int().min(0).default(0),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().default(false),
  createdAt: DateTimeSchema.optional(),
  updatedAt: DateTimeSchema.optional(),
});

export const AvailabilityScheduleSchema = z.object({
  id: IdSchema.optional(),
  providerId: IdSchema.optional(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  isAvailable: z.boolean().default(true),
});

export const SubscriptionSchema = z.object({
  id: IdSchema.optional(),
  providerId: IdSchema.optional(),
  plan: SubscriptionPlan,
  startDate: DateTimeSchema,
  endDate: DateTimeSchema,
  isActive: z.boolean(),
  autoRenew: z.boolean().optional(),
  amount: z.number().optional(),
  paymentMethod: z.string().nullable().optional(),
  paymentReference: z.string().nullable().optional(),
  createdAt: DateTimeSchema.optional(),
});

export const ProviderSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  profession: z.string(),
  description: z.string().nullable().optional(),
  experience: z.number().int().nullable().optional(),
  hourlyRate: z.number().nullable().optional(),
  videoUrl: z.string().nullable().optional(),
  rating: z.number().default(0),
  totalReviews: z.number().int().min(0).default(0),
  totalJobs: z.number().int().min(0).default(0),
  responseTime: z.number().int().min(0).optional(),
  isCertified: z.boolean().optional(),
  isPremium: z.boolean(),
  premiumExpiry: NullableDateTimeSchema.optional(),
  isAvailable: z.boolean(),
  verificationStatus: VerificationStatus,
  onboardingCompleteAt: NullableDateTimeSchema.optional(),
  user: UserSchema.pick({
    id: true,
    firstName: true,
    lastName: true,
    avatar: true,
    city: true,
    country: true,
    isVerified: true,
  }),
  categories: z.array(CategorySummarySchema).default([]),
  serviceZones: z.array(ServiceZoneSchema).default([]),
  createdAt: DateTimeSchema.optional(),
  updatedAt: DateTimeSchema.optional(),
});

export const ProviderDetailSchema = ProviderSchema.extend({
  user: UserSchema.pick({
    id: true,
    email: true,
    phone: true,
    firstName: true,
    lastName: true,
    avatar: true,
    city: true,
    country: true,
    address: true,
    latitude: true,
    longitude: true,
    isVerified: true,
  }),
  categories: z.array(CategorySchema).default([]),
  trades: z.array(ProviderTradeSchema).default([]),
  skills: z.array(SkillSchema).default([]),
  serviceZones: z.array(ServiceZoneSchema).default([]),
  trustScore: TrustScoreSchema.nullable().optional(),
  badges: z.array(ProviderBadgeSchema).default([]),
  certifications: z.array(CertificationSchema).default([]),
  portfolio: z.array(PortfolioItemSchema).default([]),
  portfolioProjects: z.array(PortfolioProjectSchema).default([]),
  availabilitySchedules: z.array(AvailabilityScheduleSchema).default([]),
  subscription: SubscriptionSchema.nullable().optional(),
});

export const ServiceSchema = z.object({
  id: IdSchema,
  categoryId: IdSchema.nullable().optional(),
  subcategoryId: IdSchema.nullable().optional(),
  name: z.string(),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
  basePrice: z.number().nullable().optional(),
  duration: z.number().int().nullable().optional(),
  isActive: z.boolean().optional(),
  createdAt: DateTimeSchema.optional(),
});

export const BookingReviewSummarySchema = z.object({
  id: IdSchema,
  bookingId: IdSchema,
  clientId: IdSchema.optional(),
  providerId: IdSchema.optional(),
  rating: z.number().min(1).max(5).optional(),
  overallScore: z.number().optional(),
  comment: z.string().nullable().optional(),
  isPublic: z.boolean().optional(),
  createdAt: DateTimeSchema.optional(),
});

export const BookingSchema = z.object({
  id: IdSchema,
  clientId: IdSchema.optional(),
  providerId: IdSchema.optional(),
  serviceId: IdSchema.nullable().optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
  status: BookingStatus,
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  clientLatitude: z.number().nullable().optional(),
  clientLongitude: z.number().nullable().optional(),
  scheduledDate: NullableDateTimeSchema.optional(),
  duration: z.number().int().nullable().optional(),
  price: z.number().nullable().optional(),
  clientNotes: z.string().nullable().optional(),
  providerNotes: z.string().nullable().optional(),
  paymentMethod: z.string().nullable().optional(),
  isPaid: z.boolean().optional(),
  paidAt: NullableDateTimeSchema.optional(),
  confirmedAt: NullableDateTimeSchema.optional(),
  startedAt: NullableDateTimeSchema.optional(),
  completedAt: NullableDateTimeSchema.optional(),
  cancelledAt: NullableDateTimeSchema.optional(),
  cancelReason: z.string().nullable().optional(),
  cancelledBy: IdSchema.nullable().optional(),
  cancelledByRole: z.enum(["client", "provider", "admin"]).nullable().optional(),
  reviewed: z.boolean().optional(),
  myRating: z.number().nullable().optional(),
  createdAt: DateTimeSchema.optional(),
  updatedAt: DateTimeSchema.optional(),
  client: UserSummarySchema.optional(),
  provider: ProviderSchema.pick({
    id: true,
    userId: true,
    profession: true,
    user: true,
  }).optional(),
  service: ServiceSchema.pick({ id: true, name: true }).nullable().optional(),
  review: BookingReviewSummarySchema.nullable().optional(),
});

export const ReviewSchema = z.object({
  id: IdSchema,
  bookingId: IdSchema,
  clientId: IdSchema.optional(),
  providerId: IdSchema.optional(),
  rating: z.number().min(1).max(5).optional(),
  punctuality: z.number().int().min(1).max(5).nullable().optional(),
  quality: z.number().int().min(1).max(5).nullable().optional(),
  communication: z.number().int().min(1).max(5).nullable().optional(),
  value: z.number().int().min(1).max(5).nullable().optional(),
  professionalism: z.number().int().min(1).max(5).nullable().optional(),
  overallScore: z.number().optional(),
  satisfactionTags: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),
  reply: z.string().nullable().optional(),
  repliedAt: NullableDateTimeSchema.optional(),
  isPublic: z.boolean().default(true),
  isEdited: z.boolean().optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema.optional(),
  client: UserSummarySchema.optional(),
  service: z.string().optional(),
});

export const ClientReviewSchema = z.object({
  id: IdSchema,
  bookingId: IdSchema,
  clientId: IdSchema,
  providerId: IdSchema,
  rating: z.number().min(1).max(5).optional(),
  paymentRating: PaymentRating.optional(),
  paymentTimeliness: PaymentRating.optional(),
  communication: z.number().int().min(1).max(5).nullable().optional(),
  respectfulness: z.number().int().min(1).max(5).nullable().optional(),
  comment: z.string().nullable().optional(),
  tags: z.union([z.string(), z.array(z.string())]).nullable().optional(),
  isPublic: z.boolean().optional(),
  createdAt: DateTimeSchema.optional(),
});

export const MessageSchema = z.object({
  id: IdSchema,
  conversationId: IdSchema.optional(),
  senderId: IdSchema.optional(),
  type: MessageType.default("TEXT"),
  content: z.string(),
  fileUrl: z.string().nullable().optional(),
  isRead: z.boolean().optional(),
  readAt: NullableDateTimeSchema.optional(),
  isDeleted: z.boolean().optional(),
  createdAt: DateTimeSchema,
  sender: UserSummarySchema.optional(),
});

export const ConversationLastMessageSchema = z.object({
  content: z.string(),
  createdAt: DateTimeSchema,
  senderId: IdSchema.optional(),
  senderName: z.string().optional(),
});

export const ConversationSchema = z.object({
  id: IdSchema,
  user1: UserSummarySchema.optional(),
  user2: UserSummarySchema.optional(),
  otherUser: UserSummarySchema.extend({ role: UserRole.optional() }).optional(),
  lastMessage: ConversationLastMessageSchema.nullable().optional(),
  lastMessageAt: DateTimeSchema,
  unreadCount: z.number().int().min(0).default(0),
  createdAt: DateTimeSchema.optional(),
});

export const NotificationSchema = z.object({
  id: IdSchema,
  userId: IdSchema.optional(),
  type: NotificationType,
  title: z.string(),
  message: z.string(),
  data: JsonValueSchema.optional(),
  isRead: z.boolean(),
  readAt: NullableDateTimeSchema.optional(),
  createdAt: DateTimeSchema,
});

export const FavoriteSchema = z.object({
  id: IdSchema,
  userId: IdSchema.optional(),
  providerId: IdSchema.optional(),
  provider: ProviderSchema,
  createdAt: DateTimeSchema.optional(),
});

export const VisibilitySettingsSchema = z.object({
  id: IdSchema.optional(),
  userId: IdSchema.optional(),
  profileVisible: VisibilityLevel.default("PUBLIC"),
  showEmail: z.boolean(),
  showPhone: z.boolean(),
  showExactLocation: z.boolean(),
  showHourlyRate: z.boolean(),
  showPastWork: z.boolean(),
  showReviews: z.boolean(),
  showAvailability: z.boolean(),
  showCertifications: z.boolean(),
  showClientHistory: z.boolean(),
  showClientReviews: z.boolean(),
  allowDirectContact: z.boolean(),
  allowMessages: z.boolean(),
  appearInSearch: z.boolean(),
  appearInCategory: z.boolean(),
  updatedAt: DateTimeSchema.optional(),
});

export const TransactionSchema = z.object({
  id: IdSchema,
  providerId: IdSchema.optional(),
  type: TransactionType,
  bookingId: IdSchema.nullable().optional(),
  payoutId: IdSchema.nullable().optional(),
  amount: z.number().int(),
  feeAmt: z.number().int(),
  netAmt: z.number().int(),
  paymentMethod: z.string().nullable().optional(),
  status: TransactionStatus,
  reference: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  label: z.string(),
  occurredAt: DateTimeSchema,
  createdAt: DateTimeSchema.optional(),
});

export const PayoutSchema = z.object({
  id: IdSchema,
  providerId: IdSchema.optional(),
  operator: PayoutOperator,
  phoneMasked: z.string(),
  amount: z.number().int(),
  feeAmt: z.number().int(),
  netAmt: z.number().int(),
  status: PayoutStatus,
  reference: z.string().nullable().optional(),
  holdReason: z.string().nullable().optional(),
  requestedAt: DateTimeSchema,
  completedAt: NullableDateTimeSchema.optional(),
});

export const EarningsWeekDaySchema = z.object({
  day: z.string(),
  amount: z.number().int(),
  isToday: z.boolean().optional(),
  isFuture: z.boolean().optional(),
});

export const EarningsSummarySchema = z.object({
  balance: z.number().int(),
  pending: z.number().int(),
  lifetime: z.number().int(),
  weekly: z.object({
    days: z.array(EarningsWeekDaySchema),
    total: z.number().int(),
    lastWeekTotal: z.number().int(),
    deltaPct: z.number(),
  }),
});

export type UserSummary = z.infer<typeof UserSummarySchema>;
export type User = z.infer<typeof UserSchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type CategorySummary = z.infer<typeof CategorySummarySchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Subcategory = z.infer<typeof SubcategorySchema>;
export type Trade = z.infer<typeof TradeSchema>;
export type ProviderTrade = z.infer<typeof ProviderTradeSchema>;
export type CategoryHierarchy = z.infer<typeof CategoryHierarchySchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type ServiceZone = z.infer<typeof ServiceZoneSchema>;
export type ProviderBadge = z.infer<typeof ProviderBadgeSchema>;
export type TrustScore = z.infer<typeof TrustScoreSchema>;
export type CertificationDoc = z.infer<typeof CertificationDocSchema>;
export type Certification = z.infer<typeof CertificationSchema>;
export type PortfolioItem = z.infer<typeof PortfolioItemSchema>;
export type PortfolioImage = z.infer<typeof PortfolioImageSchema>;
export type PortfolioProject = z.infer<typeof PortfolioProjectSchema>;
export type AvailabilitySchedule = z.infer<typeof AvailabilityScheduleSchema>;
export type Subscription = z.infer<typeof SubscriptionSchema>;
export type Provider = z.infer<typeof ProviderSchema>;
export type ProviderDetail = z.infer<typeof ProviderDetailSchema>;
export type Service = z.infer<typeof ServiceSchema>;
export type Booking = z.infer<typeof BookingSchema>;
export type Review = z.infer<typeof ReviewSchema>;
export type ClientReview = z.infer<typeof ClientReviewSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type ConversationLastMessage = z.infer<typeof ConversationLastMessageSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type Favorite = z.infer<typeof FavoriteSchema>;
export type VisibilitySettings = z.infer<typeof VisibilitySettingsSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type Payout = z.infer<typeof PayoutSchema>;
export type EarningsWeekDay = z.infer<typeof EarningsWeekDaySchema>;
export type EarningsSummary = z.infer<typeof EarningsSummarySchema>;
