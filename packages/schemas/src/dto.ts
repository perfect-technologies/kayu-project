import { z } from "zod";
import { KIN_COMMUNES_TUPLE } from "./communes.js";
import {
  BooleanQueryParamSchema,
  DateTimeSchema,
  IdSchema,
  JsonObjectSchema,
  PaginationMetaSchema,
  PaginationParams,
  createApiSuccessResponseSchema,
} from "./common.js";
import {
  BookingStatus,
  FinalOfferStatus,
  MessageType,
  PayoutOperator,
  TransactionType,
  UserRole,
  VerificationStatus,
} from "./enums.js";
import {
  AuthUserSchema,
  BookingSchema,
  CategoryHierarchySchema,
  CategorySchema,
  ConversationSchema,
  EarningsSummarySchema,
  FavoriteSchema,
  FinalOfferSchema,
  MessageSchema,
  NotificationSchema,
  PayoutSchema,
  ProviderDetailSchema,
  ProviderSchema,
  ProviderSubcategorySchema,
  ReviewSchema,
  ServiceZoneSchema,
  SkillSchema,
  SubcategorySchema,
  TransactionSchema,
  UserSchema,
  VisibilitySettingsSchema,
} from "./models.js";
import {
  DisputeOrigin,
  DisputeSchema,
  DisputeSeverity,
  DisputeStatus,
} from "./verification.js";

const RatingSchema = z.number().int().min(1).max(5);

export const ServiceZoneInputSchema = ServiceZoneSchema.pick({
  city: true,
  commune: true,
});

export const SkillInputSchema = z.object({
  name: z.string().min(1),
  level: z.number().int().min(1).max(5).optional(),
});

export const CompleteProfileDto = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  role: z.enum(["CLIENT", "PROVIDER"]).optional(),
  city: z.string().optional(),
  country: z.string().default("RDC"),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  avatar: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const RegisterDto = CompleteProfileDto.extend({
  email: z.string().email(),
  role: z.enum(["CLIENT", "PROVIDER"]),
  password: z.string().min(6).optional(),
  profession: z.string().optional(),
  categoryIds: z.array(IdSchema).optional(),
  experience: z.number().int().min(0).max(50).optional(),
  description: z.string().max(500).optional(),
  hourlyRate: z.number().min(0).optional(),
  skills: z.array(z.string()).optional(),
  serviceZones: z.array(ServiceZoneInputSchema).optional(),
  subcategoryIds: z.array(IdSchema).max(3).optional(),
});

export const LoginDto = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
  password: z.string().min(1).optional(),
});

export const ForgotPasswordDto = z.object({
  email: z.string().email(),
});

export const ProviderOnboardingDto = z.object({
  profession: z.string().min(2),
  categoryIds: z.array(IdSchema).default([]),
  skills: z.array(z.string().min(1)).default([]),
  serviceZones: z.array(ServiceZoneInputSchema).default([]),
  subcategoryIds: z.array(IdSchema).max(3).default([]),
  experience: z.number().int().min(0).max(50).optional(),
  hourlyRate: z.number().min(0).optional(),
  description: z.string().max(1000).optional(),
});

export const UpdateProviderDto = z.object({
  profession: z.string().min(2).optional(),
  description: z.string().max(1000).nullable().optional(),
  experience: z.number().int().min(0).max(50).nullable().optional(),
  hourlyRate: z.number().min(0).nullable().optional(),
  isAvailable: z.boolean().optional(),
  languages: z.array(z.string()).optional(),
  categoryIds: z.array(IdSchema).max(3).optional(),
  subcategoryIds: z.array(IdSchema).max(3).optional(),
  skills: z.array(SkillInputSchema).optional(),
  serviceZones: z.array(ServiceZoneInputSchema).optional(),
});

export const CreateBookingDto = z.object({
  providerId: IdSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  scheduledDate: z.coerce.date(),
  duration: z.number().int().positive().optional(),
  price: z.number().min(0).optional(),
  clientNotes: z.string().optional(),
  subcategoryId: IdSchema.optional(),
  commune: z.enum(KIN_COMMUNES_TUPLE).optional(),
});

export const UpdateBookingDto = z.object({
  status: BookingStatus.optional(),
  cancelReason: z.string().optional(),
  providerNotes: z.string().optional(),
  isPaid: z.literal(true).optional(),
  paymentMethod: z.literal("cash").optional(),
});

export const CreateFinalOfferDto = z.object({
  providerId: IdSchema,
  clientId: IdSchema,
  conversationId: IdSchema.optional(),
  bookingId: IdSchema.optional(),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  price: z.number().nonnegative(),
  duration: z.number().int().positive().optional(),
  scheduledDate: z.coerce.date(),
  address: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  notes: z.string().trim().min(1).optional(),
  paymentMethod: z.literal("cash").default("cash"),
  expiresAt: z.coerce.date().optional(),
});

export const CreateReviewDto = z.object({
  bookingId: IdSchema,
  providerId: IdSchema,
  rating: RatingSchema,
  punctuality: RatingSchema.optional(),
  quality: RatingSchema.optional(),
  communication: RatingSchema.optional(),
  value: RatingSchema.optional(),
  professionalism: RatingSchema.optional(),
  satisfactionTags: z.array(z.string().min(1)).max(10).default([]),
  comment: z.string().max(2000).optional(),
  isPublic: z.boolean().default(true),
});

export const CreateClientReviewDto = z.object({
  bookingId: IdSchema,
  clientId: IdSchema,
  paymentRating: z
    .enum(["PREPAID", "ONTIME", "LATE", "PARTIAL", "DISPUTED"])
    .default("ONTIME"),
  communication: RatingSchema.optional(),
  respectfulness: RatingSchema.optional(),
  tags: z.array(z.string()).default([]),
  comment: z.string().max(2000).optional(),
  isPublic: z.boolean().default(true),
});

export const CreateMessageDto = z.object({
  recipientId: IdSchema,
  content: z.string().min(1),
  type: MessageType.default("TEXT"),
  fileUrl: z.string().optional(),
});

export const UpdateVisibilityDto = VisibilitySettingsSchema.pick({
  profileVisible: true,
  showEmail: true,
  showPhone: true,
  showExactLocation: true,
  showHourlyRate: true,
  showPastWork: true,
  showReviews: true,
  showAvailability: true,
  showCertifications: true,
  showClientHistory: true,
  showClientReviews: true,
  allowDirectContact: true,
  allowMessages: true,
  appearInSearch: true,
  appearInCategory: true,
}).partial();

export const UpdateUserDto = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
});

export const AdminUpdateUserDto = UpdateUserDto.extend({
  userId: IdSchema,
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  role: UserRole.optional(),
});

export const AdminUpdateProviderDto = z.object({
  providerId: IdSchema,
  verificationStatus: VerificationStatus.optional(),
  isPremium: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  rejectionReason: z.string().optional(),
});

export const CategorySubcategoryInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().int().min(0).optional(),
});

export const CreateCategoryDto = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  color: z.string().optional(),
  order: z.number().int().min(0).optional(),
  subcategories: z.array(CategorySubcategoryInputSchema).optional(),
});

export const UpdateCategoryDto = CreateCategoryDto.partial().extend({
  id: IdSchema.optional(),
  categoryId: IdSchema.optional(),
  isActive: z.boolean().optional(),
});

export const CreateSubcategoryDto = z.object({
  categoryId: IdSchema,
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().int().min(0).optional(),
});

export const UpdateSubcategoryDto = CreateSubcategoryDto.partial().extend({
  id: IdSchema,
  isActive: z.boolean().optional(),
});

export const AdminModerateReviewDto = z.object({
  reviewId: IdSchema,
  isPublic: z.boolean().optional(),
  isEdited: z.boolean().optional(),
  reply: z.string().nullable().optional(),
});

export const FavoriteProviderDto = z.object({
  providerId: IdSchema,
});

export const ProviderSearchParams = PaginationParams.extend({
  q: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  city: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  available: BooleanQueryParamSchema.optional(),
  verified: BooleanQueryParamSchema.optional(),
  // "hourlyRate" sort key is kept for wire compatibility; it sorts on the
  // provider starting price (the underlying column has not been renamed yet).
  sortBy: z.enum(["recommended", "createdAt", "hourlyRate"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
}).extend({
  limit: z.coerce.number().int().min(1).max(100).default(12),
});

export const BookingSearchParams = PaginationParams.extend({
  status: BookingStatus.optional(),
  role: z.enum(["client", "provider"]).default("client"),
});

export const FinalOfferSearchParams = PaginationParams.extend({
  status: FinalOfferStatus.optional(),
  conversationId: IdSchema.optional(),
  bookingId: IdSchema.optional(),
}).extend({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const ReviewSearchParams = PaginationParams.extend({
  providerId: IdSchema,
  sortBy: z.enum(["recent", "highest", "lowest"]).default("recent"),
});

export const MessageSearchParams = PaginationParams.extend({
  conversationId: IdSchema.optional(),
}).extend({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const NotificationSearchParams = PaginationParams.extend({
  unreadOnly: BooleanQueryParamSchema.optional(),
}).extend({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const CategorySearchParams = z.object({
  withSubcategories: BooleanQueryParamSchema.optional(),
  categoryId: IdSchema.optional(),
  categorySlug: z.string().optional(),
});

export const AdminUserSearchParams = PaginationParams.extend({
  role: UserRole.optional(),
  status: z.enum(["active", "inactive", "verified", "unverified"]).optional(),
  search: z.string().optional(),
}).extend({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const AdminProviderSearchParams = PaginationParams.extend({
  status: z.enum(["premium", "available", "unavailable"]).optional(),
  verificationStatus: VerificationStatus.optional(),
  search: z.string().optional(),
}).extend({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const AdminReviewSearchParams = PaginationParams.extend({
  isPublic: BooleanQueryParamSchema.optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  maxRating: z.coerce.number().min(0).max(5).optional(),
  search: z.string().optional(),
}).extend({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const AdminCategorySearchParams = z.object({
  includeInactive: BooleanQueryParamSchema.optional(),
});

export const AdminSupportBookingSearchParams = PaginationParams.extend({
  status: BookingStatus.optional(),
  search: z.string().optional(),
}).extend({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const AdminSupportBookingSummarySchema = z.object({
  id: IdSchema,
  title: z.string(),
  status: BookingStatus,
  scheduledDate: DateTimeSchema.nullable().optional(),
  createdAt: DateTimeSchema,
  price: z.number().nullable().optional(),
  city: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  isPaid: z.boolean(),
  paymentMethod: z.string().nullable().optional(),
  client: z.object({
    id: IdSchema,
    name: z.string(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
  }),
  provider: z.object({
    id: IdSchema,
    userId: IdSchema,
    name: z.string(),
    profession: z.string(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
  }),
  support: z.object({
    disputeCount: z.number().int().min(0),
    activeDisputeId: IdSchema.nullable(),
    activeDisputeStatus: DisputeStatus.nullable(),
    activeDisputeSeverity: DisputeSeverity.nullable(),
    lastDisputeAt: DateTimeSchema.nullable(),
  }),
});

export const AdminSupportBookingsResponseSchema = z.object({
  success: z.literal(true),
  bookings: z.array(AdminSupportBookingSummarySchema),
  pagination: PaginationMetaSchema,
});

export const AdminDisputeSearchParams = PaginationParams.extend({
  status: DisputeStatus.optional(),
  severity: DisputeSeverity.optional(),
  search: z.string().optional(),
}).extend({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const AdminDisputeSummarySchema = DisputeSchema.extend({
  booking: z
    .object({
      id: IdSchema,
      title: z.string(),
      status: BookingStatus,
      price: z.number().nullable().optional(),
      scheduledDate: DateTimeSchema.nullable().optional(),
      client: z.object({
        id: IdSchema,
        name: z.string(),
        email: z.string().nullable(),
        phone: z.string().nullable(),
      }),
      provider: z.object({
        id: IdSchema,
        userId: IdSchema,
        name: z.string(),
        profession: z.string(),
        email: z.string().nullable(),
        phone: z.string().nullable(),
      }),
    })
    .nullable(),
});

export const AdminDisputesResponseSchema = z.object({
  success: z.literal(true),
  disputes: z.array(AdminDisputeSummarySchema),
  pagination: PaginationMetaSchema,
  stats: z.object({
    open: z.number().int().min(0),
    escalated: z.number().int().min(0),
    resolved: z.number().int().min(0),
  }),
});

export const AdminCreateDisputeDto = z.object({
  bookingId: IdSchema,
  reporterRole: DisputeOrigin,
  reason: z.string().trim().min(10).max(500),
  statement: z.string().trim().min(10).max(2000),
  severity: DisputeSeverity.default("MEDIUM"),
});

export const AdminUpdateDisputeDto = z
  .object({
    disputeId: IdSchema,
    status: DisputeStatus.optional(),
    severity: DisputeSeverity.optional(),
    resolution: z.string().trim().min(3).max(2000).nullable().optional(),
    resolutionPct: z.number().int().min(0).max(100).nullable().optional(),
    deadlineAt: DateTimeSchema.nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.status === undefined &&
      value.severity === undefined &&
      value.resolution === undefined &&
      value.resolutionPct === undefined &&
      value.deadlineAt === undefined
    ) {
      ctx.addIssue({
        code: "custom",
        message: "At least one dispute field must be updated",
      });
    }

    if (value.status === "RESOLVED" && !value.resolution?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["resolution"],
        message: "Resolution note is required when resolving a dispute",
      });
    }
  });

export const AdminDisputeMutationResponseSchema = z.object({
  success: z.literal(true),
  dispute: AdminDisputeSummarySchema,
});

export const DistanceParams = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  providerLat: z.coerce.number().optional(),
  providerLng: z.coerce.number().optional(),
});

export const GeocodeParams = z.object({
  city: z.string().min(1),
  commune: z.string().optional(),
  country: z.string().default("RDC"),
});

export const AuthResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  user: AuthUserSchema.optional(),
  userId: IdSchema.optional(),
  role: UserRole.optional(),
  error: z.string().optional(),
});

export const MeResponseSchema = z.object({
  success: z.boolean(),
  user: UserSchema.extend({
    profileComplete: z.boolean(),
    provider: ProviderSchema.optional().nullable(),
  }).optional(),
  error: z.string().optional(),
});

export const ProviderStatsResponseSchema = z.object({
  totalBookings: z.number().int().min(0),
  completedBookings: z.number().int().min(0),
  pendingBookings: z.number().int().min(0),
  totalEarnings: z.number().min(0),
  rating: z.number().min(0),
  totalReviews: z.number().int().min(0),
  totalJobs: z.number().int().min(0).optional(),
});

export const AdminStatsResponseSchema = z.object({
  totalUsers: z.number().int().min(0),
  totalProviders: z.number().int().min(0),
  totalClients: z.number().int().min(0).optional(),
  totalAdmins: z.number().int().min(0).optional(),
  totalBookings: z.number().int().min(0),
  totalReviews: z.number().int().min(0).optional(),
  pendingBookings: z.number().int().min(0).optional(),
  confirmedBookings: z.number().int().min(0).optional(),
  inProgressBookings: z.number().int().min(0).optional(),
  completedBookings: z.number().int().min(0).optional(),
  cancelledBookings: z.number().int().min(0).optional(),
  activeUsers: z.number().int().min(0).optional(),
  verifiedUsers: z.number().int().min(0).optional(),
  verifiedProviders: z.number().int().min(0).optional(),
  premiumProviders: z.number().int().min(0).optional(),
  pendingCertifications: z.number().int().min(0).optional(),
  totalRevenue: z.number().min(0).optional(),
  revenueToday: z.number().min(0).optional(),
  monthlyRevenue: z.number().min(0).optional(),
  newUsersToday: z.number().int().min(0).optional(),
  newUsersThisWeek: z.number().int().min(0).optional(),
  newUsersThisMonth: z.number().int().min(0).optional(),
  newBookingsToday: z.number().int().min(0).optional(),
  bookingsByDay: z.array(JsonObjectSchema).optional(),
  trustLevels: z.record(z.string(), z.number()).optional(),
});

export const DashboardBookingSchema = BookingSchema.extend({
  client: z
    .object({
      id: IdSchema,
      name: z.string(),
      avatar: z.string().nullable().optional(),
    })
    .optional(),
  provider: z
    .object({
      id: IdSchema,
      name: z.string(),
      avatar: z.string().nullable().optional(),
      profession: z.string(),
    })
    .optional(),
});

export const TodayJobClientSchema = z.object({
  id: IdSchema,
  name: z.string(),
  avatar: z.string().nullable().optional(),
});

export const TodayJobSchema = z.object({
  id: IdSchema,
  time: z.string(),
  duration: z.string(),
  kind: z.string(),
  client: TodayJobClientSchema,
  address: z.string(),
  distance: z.number(),
  status: z.enum(["confirmed", "en_route", "completed"]),
  fee: z.number(),
});

export const RequestPreviewClientSchema = TodayJobClientSchema;

export const RequestPreviewSchema = z.object({
  id: IdSchema,
  client: RequestPreviewClientSchema,
  newClient: z.boolean().default(false),
  clientRating: z.number().nullable().optional(),
  clientJobs: z.number().int().min(0).default(0),
  service: z.string(),
  message: z.string(),
  when: z.string(),
  address: z.string(),
  distance: z.number(),
  matchScore: z.number().min(0).max(100),
  receivedAt: z.string(),
  urgent: z.boolean().default(false),
});

export const OnboardingStatusSchema = z.object({
  isComplete: z.boolean(),
  currentStep: z.number().int().min(0).max(5).nullable(),
  totalSteps: z.number().int().min(1).default(6),
  missingForPublish: z.array(z.string()).default([]),
});

export const AvailabilityStatusSchema = z.object({
  isAvailable: z.boolean(),
  zoneCity: z.string().nullable(),
  zoneRadiusKm: z.number().nullable(),
});

export const StatSparklineSchema = z.object({
  value: z.number(),
  deltaPct: z.number(),
  sparkline: z.array(z.number()).default([]),
});

export const StatResponseRateSchema = z.object({
  value: z.number().min(0).max(100),
  label: z.enum(["Excellent", "Bon", "À améliorer"]),
});

export const StatAvgRatingSchema = z.object({
  value: z.number().min(0).max(5),
  delta: z.number(),
});

export const ProviderDashboardStatsSchema = z.object({
  period: z.enum(["month", "week"]).default("month"),
  revenue: StatSparklineSchema,
  missions: StatSparklineSchema,
  responseRate: StatResponseRateSchema,
  avgRating: StatAvgRatingSchema,
});

export const DashboardProviderResponseSchema = z.object({
  provider: ProviderSchema.partial().extend({
    id: IdSchema,
    profession: z.string(),
    totalJobs: z.number().int().min(0).optional(),
    rating: z.number().min(0).optional(),
    isAvailable: z.boolean().optional(),
    completionPercentage: z.number().int().min(0).max(100).optional(),
    completionItems: z.record(z.string(), z.boolean()).optional(),
    categories: z.array(z.string()).optional(),
  }),
  onboarding: OnboardingStatusSchema,
  availability: AvailabilityStatusSchema,
  today: z.object({
    jobs: z.array(TodayJobSchema),
    estimatedRecette: z.number(),
  }),
  newRequests: z.array(RequestPreviewSchema),
  bookingRequests: z.array(DashboardBookingSchema).default([]),
  stats: ProviderDashboardStatsSchema,
  notifications: z.object({
    unreadCount: z.number().int().min(0),
  }),

  // Legacy compatibility fields (still consumed by the v1 `/dashboard/provider`
  // page until its retirement). Optional so new consumers can ignore them.
  user: UserSchema.pick({
    firstName: true,
    lastName: true,
    avatar: true,
    city: true,
  }).optional(),
  recentBookings: z.array(DashboardBookingSchema).optional(),
  upcomingBookings: z.array(DashboardBookingSchema).optional(),
  recentReviews: z.array(ReviewSchema).optional(),
  viewsData: z
    .array(z.object({ name: z.string(), views: z.number().int().min(0) }))
    .optional(),
});

export const UpdateProviderAvailabilityDto = z.object({
  isAvailable: z.boolean(),
});

const ClientDashboardProviderShortSchema = z.object({
  id: IdSchema,
  firstName: z.string(),
  lastName: z.string(),
  profession: z.string(),
  avatar: z.string().nullable(),
  rating: z.number().min(0).max(5),
  verified: z.boolean(),
});

export const ClientDashboardUpcomingBookingSchema = z.object({
  id: IdSchema,
  status: z.enum(["PENDING", "CONFIRMED", "IN_PROGRESS"]),
  title: z.string(),
  scheduledDate: z.string(),
  durationMinutes: z.number().int().min(0).nullable(),
  price: z.number().min(0),
  hasOffer: z.boolean(),
  commune: z.string().nullable(),
  ref: z.string(),
  provider: ClientDashboardProviderShortSchema,
});

export const ClientDashboardCompletedBookingSchema = z.object({
  id: IdSchema,
  title: z.string(),
  completedAt: z.string(),
  price: z.number().min(0),
  provider: z.object({
    id: IdSchema,
    firstName: z.string(),
    lastName: z.string(),
  }),
  hasReview: z.boolean(),
  reviewScore: z.number().int().min(1).max(5).nullable(),
});

export const ClientDashboardProviderRowSchema = z.object({
  id: IdSchema,
  firstName: z.string(),
  lastName: z.string(),
  profession: z.string(),
  avatar: z.string().nullable(),
  rating: z.number().min(0).max(5),
  verified: z.boolean(),
  isFavorite: z.boolean(),
  bookingCount: z.number().int().min(0),
});

export const ClientDashboardReviewTodoSchema = z.object({
  bookingId: IdSchema,
  title: z.string(),
  completedAt: z.string(),
  price: z.number().min(0),
  provider: z.object({ firstName: z.string() }),
});

export const ClientDashboardMessageTodoSchema = z.object({
  conversationId: IdSchema,
  unreadCount: z.number().int().min(1),
  lastMessageAt: z.string(),
  lastMessagePreview: z.string().nullable(),
  provider: z.object({
    id: IdSchema,
    firstName: z.string(),
    lastName: z.string(),
  }),
});

export const DashboardClientResponseSchema = z.object({
  // Legacy fields — kept for backward-compat with non-web callers
  stats: z.object({
    totalBookings: z.number().int().min(0),
    completedBookings: z.number().int().min(0),
    pendingBookings: z.number().int().min(0),
    favoritesCount: z.number().int().min(0),
    reviewsCount: z.number().int().min(0),
  }),
  recentBookings: z.array(DashboardBookingSchema),
  favoriteProviders: z.array(ProviderSchema).optional(),
  favorites: z.array(ProviderSchema.partial()).optional(),
  notifications: z.array(NotificationSchema),
  user: UserSchema.pick({ firstName: true, lastName: true }).optional(),

  // New fields consumed by the redesigned client dashboard
  upcoming: z.array(ClientDashboardUpcomingBookingSchema),
  completed: z.array(ClientDashboardCompletedBookingSchema),
  providers: z.array(ClientDashboardProviderRowSchema),
  todos: z.object({
    reviews: z.array(ClientDashboardReviewTodoSchema),
    unreadMessages: z.array(ClientDashboardMessageTodoSchema),
  }),
  hasAnyBookingEver: z.boolean(),
});

export const DashboardAdminResponseSchema = z.object({
  stats: AdminStatsResponseSchema,
  providers: z.array(
    ProviderSchema.partial().extend({
      id: IdSchema,
      userId: IdSchema.optional(),
      firstName: z.string().nullable().optional(),
      lastName: z.string().nullable().optional(),
      email: z.string().email().nullable().optional(),
      phone: z.string().nullable().optional(),
      city: z.string().nullable().optional(),
      avatar: z.string().nullable().optional(),
      categories: z.array(z.string()).optional(),
      totalBookings: z.number().int().min(0).optional(),
    }),
  ),
  recentBookings: z.array(
    BookingSchema.partial().extend({
      id: IdSchema,
      clientName: z.string().optional(),
      clientAvatar: z.string().nullable().optional(),
      providerName: z.string().optional(),
      providerAvatar: z.string().nullable().optional(),
    }),
  ),
  topCategories: z.array(
    CategorySchema.pick({ id: true, name: true, slug: true }).extend({
      providerCount: z.number().int().min(0),
      subcategoryCount: z.number().int().min(0),
      icon: z.string().nullable().optional(),
      color: z.string().nullable().optional(),
    }),
  ),
  topCities: z.array(z.object({ name: z.string(), count: z.number().int().min(0) })),
  allCategories: z.array(
    CategorySchema.pick({ id: true, name: true, slug: true }).extend({
      providerCount: z.number().int().min(0),
    }),
  ),
});

export const DistanceResponseSchema = z.object({
  distance: z.number(),
  formatted: z.string(),
  status: z.enum(["close", "medium", "far"]),
});

export const GeocodeResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  city: z.string(),
  commune: z.string().nullable().optional(),
  country: z.string(),
  display_name: z.string().optional(),
  source: z.enum(["local", "nominatim", "default"]).optional(),
});

export const PublicStatsResponseSchema = z.object({
  totalProviders: z.number().int().min(0),
  totalClients: z.number().int().min(0),
  totalUsers: z.number().int().min(0),
  totalCategories: z.number().int().min(0),
  totalBookings: z.number().int().min(0),
  totalReviews: z.number().int().min(0),
  verifiedProviders: z.number().int().min(0),
  premiumProviders: z.number().int().min(0),
  averageRating: z.union([z.string(), z.number()]),
  providersByCity: z.array(z.object({ city: z.string(), count: z.number() })),
  topCategories: z.array(
    CategorySchema.pick({ id: true, name: true, slug: true }).extend({
      providersCount: z.number().int().min(0).optional(),
      providerCount: z.number().int().min(0).optional(),
    }),
  ),
});

export const TrendingBadgeSchema = z.union([
  z.object({
    kind: z.literal("growth"),
    pct: z.number().int(),
  }),
  z.object({
    kind: z.literal("top"),
    rank: z.number().int().min(1),
  }),
]);

export const TrendingServiceItemSchema = z.object({
  categoryId: IdSchema,
  categorySlug: z.string(),
  categoryName: z.string(),
  categoryImage: z.string(),
  categoryColor: z.string().nullable(),
  description: z.string().nullable(),
  startingPrice: z.number().int().nullable(),
  trendBadge: TrendingBadgeSchema.nullable(),
});

export const TrendingServicesResponseSchema = z.object({
  mode: z.enum(["trending", "discovery"]),
  items: z.array(TrendingServiceItemSchema),
});

export const CategoriesResponseSchema = z.object({
  categories: z.array(
    CategorySchema.extend({
      subcategories: z.array(SubcategorySchema).optional(),
    }),
  ).optional().default([]),
  subcategories: z.array(SubcategorySchema).optional(),
});

export const CategoryHierarchyResponseSchema = z.array(CategoryHierarchySchema);

export const ProvidersResponseSchema = z.object({
  providers: z.array(ProviderSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasMore: z.boolean().optional(),
  }),
});

export const ProviderRatingBreakdownSchema = z.object({
  "1": z.number().int().min(0),
  "2": z.number().int().min(0),
  "3": z.number().int().min(0),
  "4": z.number().int().min(0),
  "5": z.number().int().min(0),
});

export const ProviderRatingAveragesSchema = z.object({
  overall: z.number().min(0),
  punctuality: z.number().min(0),
  quality: z.number().min(0),
  communication: z.number().min(0),
  value: z.number().min(0),
  professionalism: z.number().min(0),
});

export const ProviderProfileStatsSchema = z.object({
  totalReviews: z.number().int().min(0),
  totalBookings: z.number().int().min(0),
  ratingBreakdown: ProviderRatingBreakdownSchema,
  ratingAverages: ProviderRatingAveragesSchema,
});

export const ProviderProfileResponseSchema = ProviderDetailSchema.extend({
  subcategories: z.array(ProviderSubcategorySchema).default([]),
  recentReviews: z.array(ReviewSchema).default([]),
  stats: ProviderProfileStatsSchema,
  hasAccess: z.boolean(),
  accessDeniedReason: z.string().nullable().optional(),
});

export const BookingsResponseSchema = z.object({
  bookings: z.array(BookingSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasMore: z.boolean().optional(),
  }),
});

export const FinalOffersResponseSchema = z.object({
  success: z.literal(true),
  finalOffers: z.array(FinalOfferSchema),
  pagination: PaginationMetaSchema,
});

export const FinalOfferResponseSchema = z.object({
  success: z.literal(true),
  finalOffer: FinalOfferSchema,
});

export const FinalOfferAcceptResponseSchema = z.object({
  success: z.literal(true),
  finalOffer: FinalOfferSchema,
  booking: BookingSchema,
});

export const ReviewsResponseSchema = z.object({
  reviews: z.array(ReviewSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasMore: z.boolean().optional(),
  }),
});

export const ConversationsResponseSchema = z.object({
  conversations: z.array(ConversationSchema),
});

export const MessagesResponseSchema = z.object({
  messages: z.array(
    z.object({
      id: IdSchema,
      conversationId: IdSchema.optional(),
      senderId: IdSchema.optional(),
      content: z.string(),
      type: MessageType.optional(),
      fileUrl: z.string().nullable().optional(),
      isRead: z.boolean().optional(),
      createdAt: DateTimeSchema,
      sender: AuthUserSchema.pick({
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
      }).optional(),
    }),
  ),
  pagination: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
      hasMore: z.boolean().optional(),
    })
    .optional(),
});

export const SendMessageResponseSchema = z.object({
  success: z.boolean(),
  conversationId: IdSchema,
  message: MessageSchema,
});

export const NotificationsResponseSchema = z.object({
  notifications: z.array(NotificationSchema),
  unreadCount: z.number().int().min(0),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasMore: z.boolean().optional(),
  }),
});

export const FavoritesResponseSchema = z.object({
  favorites: z.array(FavoriteSchema),
});
export const VisibilitySettingsResponseSchema = z.object({
  settings: VisibilitySettingsSchema,
});

// ---------- Earnings / Payouts (I06) ----------

export const EarningsTransactionSearchParams = PaginationParams.extend({
  type: TransactionType.optional(),
}).extend({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const CreatePayoutDto = z.object({
  operator: PayoutOperator,
  amount: z.number().int().positive(),
  phone: z.string().min(8),
});

export const EarningsSummaryResponseSchema = z.object({
  summary: EarningsSummarySchema,
});

export const EarningsTransactionsResponseSchema = z.object({
  transactions: z.array(TransactionSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasMore: z.boolean().optional(),
  }),
});

export const PayoutsResponseSchema = z.object({
  payouts: z.array(PayoutSchema),
});

export const CreatePayoutResponseSchema = z.object({
  success: z.boolean(),
  payout: PayoutSchema,
  transaction: TransactionSchema,
});

// ---------- Provider onboarding draft (I07) ----------

export const ProviderDraftSkillSchema = z.object({
  name: z.string().min(1),
  level: z.number().int().min(1).max(5).default(3),
});

export const ProviderDraftDto = z.object({
  onboardingStep: z.number().int().min(0).max(5).optional(),

  // Step 1 — Identité
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  idFrontUploaded: z.boolean().optional(),
  idBackUploaded: z.boolean().optional(),

  // Step 2 — Activité
  primaryCategoryId: IdSchema.optional(),
  categoryIds: z.array(IdSchema).max(3).optional(),
  subcategoryIds: z.array(IdSchema).optional(),
  profession: z.string().min(2).optional(),
  skills: z.array(ProviderDraftSkillSchema).optional(),
  yearsOfExperience: z.number().int().min(0).max(60).optional(),
  description: z.string().max(1000).optional(),

  // Step 3 — Zones
  serviceZones: z.array(ServiceZoneInputSchema).optional(),
  zoneRadiusKm: z.number().min(1).max(50).optional(),

  // Step 4 — Tarifs
  hourlyRate: z.number().int().positive().optional(),
  visitFee: z.number().int().nonnegative().optional(),

  // Step 5 — Profil
  avatar: z.string().optional(),
  bio: z.string().max(500).optional(),
  languages: z.array(z.string()).optional(),
});

export const DraftResponseSchema = z.object({
  draft: ProviderDraftDto,
  step: z.number().int().min(0).max(5).nullable(),
  isComplete: z.boolean(),
  missingForPublish: z.array(z.string()).default([]),
});

export const ProviderPublishResponseSchema = z.object({
  success: z.boolean(),
  provider: ProviderDetailSchema,
});

export const UnknownApiSuccessResponseSchema = createApiSuccessResponseSchema(z.unknown());

export type ServiceZoneInput = z.infer<typeof ServiceZoneInputSchema>;
export type CompleteProfileDto = z.infer<typeof CompleteProfileDto>;
export type RegisterDto = z.infer<typeof RegisterDto>;
export type LoginDto = z.infer<typeof LoginDto>;
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordDto>;
export type ProviderOnboardingDto = z.infer<typeof ProviderOnboardingDto>;
export type UpdateProviderDto = z.infer<typeof UpdateProviderDto>;
export type CreateBookingDto = z.infer<typeof CreateBookingDto>;
export type UpdateBookingDto = z.infer<typeof UpdateBookingDto>;
export type CreateFinalOfferDtoType = z.infer<typeof CreateFinalOfferDto>;
export type CreateReviewDto = z.infer<typeof CreateReviewDto>;
export type CreateClientReviewDto = z.infer<typeof CreateClientReviewDto>;
export type CreateMessageDto = z.infer<typeof CreateMessageDto>;
export type UpdateVisibilityDto = z.infer<typeof UpdateVisibilityDto>;
export type UpdateUserDto = z.infer<typeof UpdateUserDto>;
export type AdminUpdateUserDto = z.infer<typeof AdminUpdateUserDto>;
export type AdminUpdateProviderDto = z.infer<typeof AdminUpdateProviderDto>;
export type CategorySubcategoryInput = z.infer<typeof CategorySubcategoryInputSchema>;
export type CreateCategoryDto = z.infer<typeof CreateCategoryDto>;
export type UpdateCategoryDto = z.infer<typeof UpdateCategoryDto>;
export type CreateSubcategoryDto = z.infer<typeof CreateSubcategoryDto>;
export type UpdateSubcategoryDto = z.infer<typeof UpdateSubcategoryDto>;
export type AdminModerateReviewDto = z.infer<typeof AdminModerateReviewDto>;
export type FavoriteProviderDto = z.infer<typeof FavoriteProviderDto>;
export type ProviderSearchParams = z.infer<typeof ProviderSearchParams>;
export type BookingSearchParams = z.infer<typeof BookingSearchParams>;
export type FinalOfferSearchParams = z.infer<typeof FinalOfferSearchParams>;
export type ReviewSearchParams = z.infer<typeof ReviewSearchParams>;
export type MessageSearchParams = z.infer<typeof MessageSearchParams>;
export type NotificationSearchParams = z.infer<typeof NotificationSearchParams>;
export type CategorySearchParams = z.infer<typeof CategorySearchParams>;
export type AdminUserSearchParams = z.infer<typeof AdminUserSearchParams>;
export type AdminProviderSearchParams = z.infer<typeof AdminProviderSearchParams>;
export type AdminReviewSearchParams = z.infer<typeof AdminReviewSearchParams>;
export type AdminCategorySearchParams = z.infer<typeof AdminCategorySearchParams>;
export type AdminSupportBookingSearchParams = z.infer<
  typeof AdminSupportBookingSearchParams
>;
export type AdminSupportBookingSummary = z.infer<
  typeof AdminSupportBookingSummarySchema
>;
export type AdminSupportBookingsResponse = z.infer<
  typeof AdminSupportBookingsResponseSchema
>;
export type AdminDisputeSearchParams = z.infer<typeof AdminDisputeSearchParams>;
export type AdminDisputeSummary = z.infer<typeof AdminDisputeSummarySchema>;
export type AdminDisputesResponse = z.infer<typeof AdminDisputesResponseSchema>;
export type AdminCreateDisputeDto = z.infer<typeof AdminCreateDisputeDto>;
export type AdminUpdateDisputeDto = z.infer<typeof AdminUpdateDisputeDto>;
export type AdminDisputeMutationResponse = z.infer<
  typeof AdminDisputeMutationResponseSchema
>;
export type DistanceParams = z.infer<typeof DistanceParams>;
export type GeocodeParams = z.infer<typeof GeocodeParams>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type MeResponse = z.infer<typeof MeResponseSchema>;
export type ProviderStatsResponse = z.infer<typeof ProviderStatsResponseSchema>;
export type AdminStatsResponse = z.infer<typeof AdminStatsResponseSchema>;
export type DashboardBooking = z.infer<typeof DashboardBookingSchema>;
export type DashboardProviderResponse = z.infer<typeof DashboardProviderResponseSchema>;
export type TodayJob = z.infer<typeof TodayJobSchema>;
export type RequestPreview = z.infer<typeof RequestPreviewSchema>;
export type OnboardingStatus = z.infer<typeof OnboardingStatusSchema>;
export type AvailabilityStatus = z.infer<typeof AvailabilityStatusSchema>;
export type ProviderDashboardStats = z.infer<typeof ProviderDashboardStatsSchema>;
export type UpdateProviderAvailabilityDto = z.infer<typeof UpdateProviderAvailabilityDto>;
export type ClientDashboardUpcomingBooking = z.infer<typeof ClientDashboardUpcomingBookingSchema>;
export type ClientDashboardCompletedBooking = z.infer<typeof ClientDashboardCompletedBookingSchema>;
export type ClientDashboardProviderRow = z.infer<typeof ClientDashboardProviderRowSchema>;
export type ClientDashboardReviewTodo = z.infer<typeof ClientDashboardReviewTodoSchema>;
export type ClientDashboardMessageTodo = z.infer<typeof ClientDashboardMessageTodoSchema>;
export type DashboardClientResponse = z.infer<typeof DashboardClientResponseSchema>;
export type DashboardAdminResponse = z.infer<typeof DashboardAdminResponseSchema>;
export type DistanceResponse = z.infer<typeof DistanceResponseSchema>;
export type GeocodeResponse = z.infer<typeof GeocodeResponseSchema>;
export type PublicStatsResponse = z.infer<typeof PublicStatsResponseSchema>;
export type TrendingBadge = z.infer<typeof TrendingBadgeSchema>;
export type TrendingServiceItem = z.infer<typeof TrendingServiceItemSchema>;
export type TrendingServicesResponse = z.infer<typeof TrendingServicesResponseSchema>;
export type CategoriesResponse = z.infer<typeof CategoriesResponseSchema>;
export type CategoryHierarchyResponse = z.infer<typeof CategoryHierarchyResponseSchema>;
export type ProvidersResponse = z.infer<typeof ProvidersResponseSchema>;
export type ProviderProfileResponse = z.infer<typeof ProviderProfileResponseSchema>;
export type BookingsResponse = z.infer<typeof BookingsResponseSchema>;
export type FinalOffersResponse = z.infer<typeof FinalOffersResponseSchema>;
export type FinalOfferResponse = z.infer<typeof FinalOfferResponseSchema>;
export type FinalOfferAcceptResponse = z.infer<
  typeof FinalOfferAcceptResponseSchema
>;
export type ReviewsResponse = z.infer<typeof ReviewsResponseSchema>;
export type ConversationsResponse = z.infer<typeof ConversationsResponseSchema>;
export type MessagesResponse = z.infer<typeof MessagesResponseSchema>;
export type SendMessageResponse = z.infer<typeof SendMessageResponseSchema>;
export type NotificationsResponse = z.infer<typeof NotificationsResponseSchema>;
export type FavoritesResponse = z.infer<typeof FavoritesResponseSchema>;
export type VisibilitySettingsResponse = z.infer<typeof VisibilitySettingsResponseSchema>;
export type UnknownApiSuccessResponse = z.infer<typeof UnknownApiSuccessResponseSchema>;
export type EarningsTransactionSearchParams = z.infer<typeof EarningsTransactionSearchParams>;
export type CreatePayoutDto = z.infer<typeof CreatePayoutDto>;
export type EarningsSummaryResponse = z.infer<typeof EarningsSummaryResponseSchema>;
export type EarningsTransactionsResponse = z.infer<typeof EarningsTransactionsResponseSchema>;
export type PayoutsResponse = z.infer<typeof PayoutsResponseSchema>;
export type CreatePayoutResponse = z.infer<typeof CreatePayoutResponseSchema>;
export type ProviderDraftSkill = z.infer<typeof ProviderDraftSkillSchema>;
export type ProviderDraftDto = z.infer<typeof ProviderDraftDto>;
export type DraftResponse = z.infer<typeof DraftResponseSchema>;
export type ProviderPublishResponse = z.infer<typeof ProviderPublishResponseSchema>;

export const AvailabilityQuery = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "from must be YYYY-MM-DD"),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "to must be YYYY-MM-DD"),
});

export const AvailabilityDay = z.object({
  date: z.string(),
  status: z.enum(["available", "off", "full", "past"]),
  slots: z.array(z.string()),
});

export const AvailabilityResponse = z.object({
  days: z.array(AvailabilityDay),
  workWindow: z.object({ start: z.string(), end: z.string() }).nullable(),
});

export const RecentAddressItem = z.object({
  commune: z.string().nullable(),
  street: z.string().nullable(),
  raw: z.string(),
  lastUsedAt: z.string(),
});

export const RecentAddressesResponse = z.array(RecentAddressItem);

export type AvailabilityQuery = z.infer<typeof AvailabilityQuery>;
export type AvailabilityDay = z.infer<typeof AvailabilityDay>;
export type AvailabilityResponse = z.infer<typeof AvailabilityResponse>;
export type RecentAddressItem = z.infer<typeof RecentAddressItem>;
