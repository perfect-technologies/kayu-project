import { z } from "zod";
import {
  BooleanQueryParamSchema,
  DateTimeSchema,
  IdSchema,
  JsonObjectSchema,
  PaginationParams,
  createApiSuccessResponseSchema,
} from "./common.js";
import {
  BookingStatus,
  MessageType,
  UserRole,
  VerificationStatus,
} from "./enums.js";
import {
  AuthUserSchema,
  BookingSchema,
  CategoryHierarchySchema,
  CategorySchema,
  ConversationSchema,
  FavoriteSchema,
  NotificationSchema,
  ProviderDetailSchema,
  ProviderSchema,
  ProviderTradeSchema,
  ReviewSchema,
  ServiceZoneSchema,
  SkillSchema,
  SubcategorySchema,
  UserSchema,
  VisibilitySettingsSchema,
} from "./models.js";

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
  role: z.enum(["CLIENT", "PROVIDER"]),
  city: z.string().optional(),
  country: z.string().default("RDC"),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const RegisterDto = CompleteProfileDto.extend({
  email: z.string().email(),
  password: z.string().min(6).optional(),
  profession: z.string().optional(),
  categoryIds: z.array(IdSchema).optional(),
  experience: z.number().int().min(0).max(50).optional(),
  description: z.string().max(500).optional(),
  hourlyRate: z.number().min(0).optional(),
  skills: z.array(z.string()).optional(),
  serviceZones: z.array(ServiceZoneInputSchema).optional(),
  tradeIds: z.array(IdSchema).max(3).optional(),
  primaryTradeId: IdSchema.optional(),
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
  tradeIds: z.array(IdSchema).max(3).default([]),
  primaryTradeId: IdSchema.optional(),
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
  categoryIds: z.array(IdSchema).optional(),
  skills: z.array(SkillInputSchema).optional(),
  serviceZones: z.array(ServiceZoneInputSchema).optional(),
  tradeIds: z.array(IdSchema).max(3).optional(),
  primaryTradeId: IdSchema.nullable().optional(),
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
});

export const UpdateBookingDto = z.object({
  status: BookingStatus.optional(),
  cancelReason: z.string().optional(),
  providerNotes: z.string().optional(),
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
  isActive: z.boolean().optional(),
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
}).extend({
  limit: z.coerce.number().int().min(1).max(100).default(12),
});

export const BookingSearchParams = PaginationParams.extend({
  status: BookingStatus.optional(),
  role: z.enum(["client", "provider"]).default("client"),
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

export const DashboardProviderResponseSchema = z.object({
  stats: ProviderStatsResponseSchema,
  provider: ProviderSchema.partial().extend({
    id: IdSchema,
    profession: z.string(),
    completionPercentage: z.number().int().min(0).max(100).optional(),
    completionItems: z.record(z.string(), z.boolean()).optional(),
    categories: z.array(z.string()).optional(),
  }),
  user: UserSchema.pick({
    firstName: true,
    lastName: true,
    avatar: true,
    city: true,
  }),
  recentBookings: z.array(DashboardBookingSchema),
  upcomingBookings: z.array(DashboardBookingSchema),
  recentReviews: z.array(ReviewSchema),
  notifications: z.array(NotificationSchema),
  viewsData: z
    .array(z.object({ name: z.string(), views: z.number().int().min(0) }))
    .optional(),
});

export const DashboardClientResponseSchema = z.object({
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

export const CategoriesResponseSchema = z.object({
  categories: z.array(
    CategorySchema.extend({
      subcategories: z.array(SubcategorySchema).optional(),
    }),
  ),
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
  trades: z.array(ProviderTradeSchema).default([]),
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
  pagination: z.object({ page: z.number(), limit: z.number() }).optional(),
});

export const FavoritesResponseSchema = z.array(FavoriteSchema);
export const VisibilitySettingsResponseSchema = z.object({
  settings: VisibilitySettingsSchema,
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
export type FavoriteProviderDto = z.infer<typeof FavoriteProviderDto>;
export type ProviderSearchParams = z.infer<typeof ProviderSearchParams>;
export type BookingSearchParams = z.infer<typeof BookingSearchParams>;
export type ReviewSearchParams = z.infer<typeof ReviewSearchParams>;
export type MessageSearchParams = z.infer<typeof MessageSearchParams>;
export type CategorySearchParams = z.infer<typeof CategorySearchParams>;
export type AdminUserSearchParams = z.infer<typeof AdminUserSearchParams>;
export type AdminProviderSearchParams = z.infer<typeof AdminProviderSearchParams>;
export type AdminReviewSearchParams = z.infer<typeof AdminReviewSearchParams>;
export type DistanceParams = z.infer<typeof DistanceParams>;
export type GeocodeParams = z.infer<typeof GeocodeParams>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type MeResponse = z.infer<typeof MeResponseSchema>;
export type ProviderStatsResponse = z.infer<typeof ProviderStatsResponseSchema>;
export type AdminStatsResponse = z.infer<typeof AdminStatsResponseSchema>;
export type DashboardBooking = z.infer<typeof DashboardBookingSchema>;
export type DashboardProviderResponse = z.infer<typeof DashboardProviderResponseSchema>;
export type DashboardClientResponse = z.infer<typeof DashboardClientResponseSchema>;
export type DistanceResponse = z.infer<typeof DistanceResponseSchema>;
export type GeocodeResponse = z.infer<typeof GeocodeResponseSchema>;
export type PublicStatsResponse = z.infer<typeof PublicStatsResponseSchema>;
export type CategoriesResponse = z.infer<typeof CategoriesResponseSchema>;
export type CategoryHierarchyResponse = z.infer<typeof CategoryHierarchyResponseSchema>;
export type ProvidersResponse = z.infer<typeof ProvidersResponseSchema>;
export type ProviderProfileResponse = z.infer<typeof ProviderProfileResponseSchema>;
export type BookingsResponse = z.infer<typeof BookingsResponseSchema>;
export type ReviewsResponse = z.infer<typeof ReviewsResponseSchema>;
export type ConversationsResponse = z.infer<typeof ConversationsResponseSchema>;
export type MessagesResponse = z.infer<typeof MessagesResponseSchema>;
export type FavoritesResponse = z.infer<typeof FavoritesResponseSchema>;
export type VisibilitySettingsResponse = z.infer<typeof VisibilitySettingsResponseSchema>;
export type UnknownApiSuccessResponse = z.infer<typeof UnknownApiSuccessResponseSchema>;
