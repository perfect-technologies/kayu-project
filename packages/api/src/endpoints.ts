import type {
  // DTOs
  CompleteProfileDto,
  ProviderOnboardingDto,
  UpdateProviderDto,
  CreateBookingDto,
  UpdateBookingDto,
  CreateReviewDto,
  CreateMessageDto,
  UpdateVisibilityDto,
  AdminUpdateUserDto,
  AdminUpdateProviderDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  AdminModerateReviewDto,
  FavoriteProviderDto,
  // Search params
  ProviderSearchParams,
  BookingSearchParams,
  ReviewSearchParams,
  MessageSearchParams,
  NotificationSearchParams,
  CategorySearchParams,
  AdminUserSearchParams,
  AdminProviderSearchParams,
  AdminReviewSearchParams,
  AdminCategorySearchParams,
  DistanceParams,
  GeocodeParams,
  // Response types
  MeResponse,
  CategoriesResponse,
  CategoryHierarchyResponse,
  ProvidersResponse,
  ProviderProfileResponse,
  BookingsResponse,
  ReviewsResponse,
  ConversationsResponse,
  MessagesResponse,
  NotificationsResponse,
  FavoritesResponse,
  VisibilitySettingsResponse,
  DashboardProviderResponse,
  DashboardClientResponse,
  DashboardAdminResponse,
  PublicStatsResponse,
  DistanceResponse,
  GeocodeResponse,
  CreateJobRequestDtoType,
  JobRequestResponse,
  JobRequestsListResponse,
  JobRequestForProResponse,
  JobRequestsInboxResponse,
  JobRequestMutationResponse,
  // Earnings (I06)
  CreatePayoutDto,
  EarningsTransactionSearchParams,
  EarningsSummaryResponse,
  EarningsTransactionsResponse,
  PayoutsResponse,
  CreatePayoutResponse,
} from "@kayu/schemas";
import type { ApiClient } from "./client.js";

// ---------- Identity ----------

export const identityApi = (client: ApiClient) => ({
  me: () => client.get<MeResponse>("/me"),
  completeProfile: (data: CompleteProfileDto) =>
    client.patch<MeResponse>("/me/profile", data),
  setRole: (data: { role: string }) =>
    client.patch<MeResponse>("/me/role", data),
  providerOnboarding: (data: ProviderOnboardingDto) =>
    client.post<MeResponse>("/me/provider-onboarding", data),
});

// ---------- Categories ----------

export const categoriesApi = (client: ApiClient) => ({
  getAll: (params?: CategorySearchParams) =>
    client.get<CategoriesResponse>("/categories", params as Record<string, string | number | boolean | undefined>),
  getHierarchy: () =>
    client.get<CategoryHierarchyResponse>("/categories/hierarchy"),
});

// ---------- Providers ----------

export const providersApi = (client: ApiClient) => ({
  search: (params?: Partial<ProviderSearchParams>) =>
    client.get<ProvidersResponse>("/providers", params as Record<string, string | number | boolean | undefined>),
  getById: (id: string) =>
    client.get<ProviderProfileResponse>(`/providers/${id}`),
  updateMe: (data: UpdateProviderDto) =>
    client.patch<{ success: boolean }>("/providers/me", data),
  updateAvailability: (data: { isAvailable: boolean }) =>
    client.patch<{ success: boolean; isAvailable: boolean }>(
      "/providers/me/availability",
      data,
    ),
});

// ---------- Bookings ----------

export const bookingsApi = (client: ApiClient) => ({
  getAll: (params?: Partial<BookingSearchParams>) =>
    client.get<BookingsResponse>("/bookings", params as Record<string, string | number | boolean | undefined>),
  create: (data: CreateBookingDto) =>
    client.post<{ success: boolean; booking: unknown }>("/bookings", data),
  getById: (id: string) =>
    client.get<{ booking: unknown }>(`/bookings/${id}`),
  update: (id: string, data: UpdateBookingDto) =>
    client.patch<{ success: boolean }>(`/bookings/${id}`, data),
  cancel: (id: string) =>
    client.delete<{ success: boolean }>(`/bookings/${id}`),
});

// ---------- Reviews ----------

export const reviewsApi = (client: ApiClient) => ({
  getByProvider: (providerId: string, params?: Partial<Omit<ReviewSearchParams, "providerId">>) =>
    client.get<ReviewsResponse>("/reviews", {
      providerId,
      ...params,
    } as Record<string, string | number | boolean | undefined>),
  create: (data: CreateReviewDto) =>
    client.post<{ success: boolean }>("/reviews", data),
});

// ---------- Messages ----------

export const messagesApi = (client: ApiClient) => ({
  getConversations: (params?: Partial<MessageSearchParams>) =>
    client.get<ConversationsResponse>("/messages", params as Record<string, string | number | boolean | undefined>),
  getMessages: (conversationId: string, params?: { page?: number; limit?: number }) =>
    client.get<MessagesResponse>("/messages", {
      conversationId,
      ...params,
    } as Record<string, string | number | boolean | undefined>),
  send: (data: CreateMessageDto) =>
    client.post<{ success: boolean }>("/messages", data),
});

// ---------- Notifications ----------

export const notificationsApi = (client: ApiClient) => ({
  getAll: (params?: Partial<NotificationSearchParams>) =>
    client.get<NotificationsResponse>("/notifications", params as Record<string, string | number | boolean | undefined>),
  markRead: (id: string) =>
    client.patch<{ success: boolean }>(`/notifications/${id}/read`),
  markAllRead: () =>
    client.patch<{ success: boolean }>("/notifications/read-all"),
});

// ---------- Favorites ----------

export const favoritesApi = (client: ApiClient) => ({
  getAll: () => client.get<FavoritesResponse>("/favorites"),
  check: (providerId: string) =>
    client.get<FavoritesResponse>("/favorites", { providerId }),
  add: (data: FavoriteProviderDto) =>
    client.post<{ success: boolean }>("/favorites", data),
  remove: (providerId: string) =>
    client.delete<{ success: boolean }>("/favorites", { providerId }),
});

// ---------- Settings ----------

export const settingsApi = (client: ApiClient) => ({
  getVisibility: () =>
    client.get<VisibilitySettingsResponse>("/settings/visibility"),
  updateVisibility: (data: UpdateVisibilityDto) =>
    client.put<{ success: boolean }>("/settings/visibility", data),
});

// ---------- Dashboard ----------

export const dashboardApi = (client: ApiClient) => ({
  getProviderDashboard: () =>
    client.get<DashboardProviderResponse>("/dashboard/provider"),
  getClientDashboard: () =>
    client.get<DashboardClientResponse>("/dashboard/client"),
  getAdminDashboard: () =>
    client.get<DashboardAdminResponse>("/dashboard/admin"),
});

// ---------- Stats ----------

export const statsApi = (client: ApiClient) => ({
  getGlobal: () => client.get<PublicStatsResponse>("/stats"),
});

// ---------- Geo ----------

export const geoApi = (client: ApiClient) => ({
  geocode: (params: GeocodeParams) =>
    client.get<GeocodeResponse>("/geocode", params as Record<string, string | number | boolean | undefined>),
  distance: (params: DistanceParams) =>
    client.get<DistanceResponse>("/distance", params as Record<string, string | number | boolean | undefined>),
});

// ---------- Earnings ----------

export const earningsApi = (client: ApiClient) => ({
  summary: () => client.get<EarningsSummaryResponse>("/pro/earnings/summary"),
  transactions: (params?: Partial<EarningsTransactionSearchParams>) =>
    client.get<EarningsTransactionsResponse>(
      "/pro/earnings/transactions",
      params as Record<string, string | number | boolean | undefined>,
    ),
  createPayout: (data: CreatePayoutDto) =>
    client.post<CreatePayoutResponse>("/pro/earnings/payouts", data),
  payouts: () => client.get<PayoutsResponse>("/pro/earnings/payouts"),
});

// ---------- Job Requests ----------

export const jobRequestsApi = (client: ApiClient) => ({
  // Client side
  create: (data: CreateJobRequestDtoType) =>
    client.post<JobRequestResponse>("/job-requests", data),
  mine: () => client.get<JobRequestsListResponse>("/job-requests/mine"),
  cancel: (id: string) =>
    client.post<JobRequestMutationResponse>(`/job-requests/${id}/cancel`),

  // Pro side
  inbox: () => client.get<JobRequestsInboxResponse>("/pro/requests"),
  getById: (id: string) =>
    client.get<JobRequestForProResponse>(`/pro/requests/${id}`),
  dismiss: (id: string) =>
    client.post<JobRequestMutationResponse>(`/pro/requests/${id}/dismiss`),
});

// ---------- Admin ----------

export const adminApi = (client: ApiClient) => ({
  // Users
  getUsers: (params?: Partial<AdminUserSearchParams>) =>
    client.get<{ users: unknown[]; pagination: unknown }>("/admin/users", params as Record<string, string | number | boolean | undefined>),
  updateUser: (data: AdminUpdateUserDto) =>
    client.put<{ success: boolean }>("/admin/users", data),

  // Providers
  getProviders: (params?: Partial<AdminProviderSearchParams>) =>
    client.get<{ providers: unknown[]; pagination: unknown }>("/admin/providers", params as Record<string, string | number | boolean | undefined>),
  updateProvider: (data: AdminUpdateProviderDto) =>
    client.put<{ success: boolean }>("/admin/providers", data),

  // Categories
  getCategories: (params?: Partial<AdminCategorySearchParams>) =>
    client.get<{ categories: unknown[] }>("/admin/categories", params as Record<string, string | number | boolean | undefined>),
  createCategory: (data: CreateCategoryDto) =>
    client.post<{ success: boolean }>("/admin/categories", data),
  updateCategory: (data: UpdateCategoryDto) =>
    client.put<{ success: boolean }>("/admin/categories", data),
  deleteCategory: (id: string) =>
    client.delete<{ success: boolean }>("/admin/categories", { id }),

  // Reviews
  getReviews: (params?: Partial<AdminReviewSearchParams>) =>
    client.get<{ reviews: unknown[]; pagination: unknown }>("/admin/reviews", params as Record<string, string | number | boolean | undefined>),
  moderateReview: (data: AdminModerateReviewDto) =>
    client.put<{ success: boolean }>("/admin/reviews", data),
  deleteReview: (id: string) =>
    client.delete<{ success: boolean }>("/admin/reviews", { reviewId: id }),
});
