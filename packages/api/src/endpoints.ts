import type {
  AssistantConversationDetailResponse,
  AssistantConversationResponse,
  AssistantConversationsQueryParams,
  AssistantConversationsResponse,
  AssistantSuggestionsResponse,
  AcceptTermsResponse,
  AddressResponse,
  AddressesQueryParams,
  AddressesResponse,
  AdminAuditResponse,
  AdminBookingSearchParams,
  AdminBookingsResponse,
  AdminCancelBookingDto,
  AdminCancelBookingResponse,
  AdminCategoriesResponse,
  AdminCategoryResponse,
  AdminContactResponse,
  AdminContactSearchParams,
  AdminContactsResponse,
  AdminConversationMessagesResponse,
  AdminConversationSearchParams,
  AdminConversationsResponse,
  AdminCreateCategoryDto,
  AdminCreatePlaceDto,
  AdminCreateReferenceDto,
  AdminCreateSubcategoryDto,
  AdminHealthResponse,
  AdminMergeDto,
  AdminMessagesQueryParams,
  AdminOverviewResponse,
  AdminPlaceDetail,
  AdminPlaceMergeResponse,
  AdminPlaceResponse,
  AdminPlaceSearchParams,
  AdminPlacesResponse,
  AdminProviderResponse,
  AdminProviderSearchParams,
  AdminProvidersResponse,
  AdminReferenceMergeResponse,
  AdminReferenceResponse,
  AdminReferenceSearchParams,
  AdminReferencesResponse,
  AdminReportResponse,
  AdminReportSearchParams,
  AdminReportsResponse,
  AdminResolveReportDto,
  AdminReviewResponse,
  AdminReviewSearchParams,
  AdminReviewVerificationDocDto,
  AdminReviewVerificationDocResponse,
  AdminReviewsResponse,
  AdminSettingsResponse,
  AdminSubcategoriesQueryParams,
  AdminSubcategoriesResponse,
  AdminSubcategoryResponse,
  AdminSuggestionSearchParams,
  AdminSuggestionsResponse,
  AdminUpdateCategoryDto,
  AdminUpdateContactDto,
  AdminUpdatePlaceDto,
  AdminUpdateProviderDto,
  AdminUpdateReferenceDto,
  AdminUpdateReviewDto,
  AdminUpdateSettingsDto,
  AdminUpdateSubcategoryDto,
  AdminUpdateUserDto,
  AdminUserCvResponse,
  AdminUserResponse,
  AdminUserSearchParams,
  AdminUsersResponse,
  AdminVerificationQueueResponse,
  AdminVerificationQueueSearchParams,
  AvailabilityResponse,
  BlockResponse,
  BlocksQueryParams,
  BlocksResponse,
  BookingResponse,
  BookingsQueryParams,
  BookingsResponse,
  CancelBookingDto,
  CategoryTreeResponse,
  ClientDashboardResponse,
  ClientRatingSummaryResponse,
  ClientReviewResponse,
  CompleteBookingDto,
  ConfirmAvatarDto,
  ConfirmAvatarResponse,
  ConversationsQueryParams,
  ConversationsResponse,
  CreateAddressDto,
  CreateBookingDto,
  CreateClientLeadDtoType,
  CreateClientReviewDto,
  CreateContactMessageDto,
  CreateContactMessageResponse,
  CreateLaunchFunnelEventDtoType,
  CreateLaunchFunnelEventResponse,
  CreateLaunchLeadResponse,
  CreatePlaceSuggestionDto,
  CreateProviderLeadDtoType,
  CreateReportDto,
  CreateReviewDto,
  DeleteAccountResponse,
  DistanceParams,
  DistanceResponse,
  EarningsSummaryResponse,
  EarningsTransactionsQueryParams,
  EarningsTransactionsResponse,
  GeocodeParams,
  GeocodeResponse,
  MarkAllNotificationsReadResponse,
  MeResponse,
  MessagesQueryParams,
  MessagesResponse,
  MyReviewsResponse,
  NotificationResponse,
  NotificationsQueryParams,
  NotificationsResponse,
  OkResponse,
  PlaceAncestorsResponse,
  PlaceSuggestionResponse,
  PlacesQueryParams,
  PlacesResponse,
  ProviderDashboardResponse,
  ProviderPublicResponse,
  ProviderReviewsQueryParams,
  ProviderReviewsResponse,
  ProviderSearchParams,
  ProviderSearchResponse,
  PublicSettingsResponse,
  PublicStatsResponse,
  PublishProviderDto,
  PublishProviderResponse,
  PutMediaDto,
  PutMediaResponse,
  PutScheduleDto,
  PutScheduleResponse,
  ReferenceType,
  ReferencesQueryParams,
  ReferencesResponse,
  RemoveVerificationDocResponse,
  ReplyReviewDto,
  ReportResponse,
  ReviewResponse,
  SendMessageDto,
  SendMessageResponse,
  SignReadResponse,
  StartConversationDto,
  StartConversationResponse,
  SubmitVerificationResponse,
  UpdateAddressDto,
  UpdateAvailabilityResponse,
  UpdateBookingNotesDto,
  UpdateProfileDto,
  UpdateProfileResponse,
  UpdateProviderDto,
  UpdateProviderResponse,
  UploadSignRequestDto,
  UploadSignResponse,
  UploadVerificationDocDto,
  UploadVerificationDocResponse,
  VerificationStateResponse,
} from "@kayu/schemas";
import type { ApiClient } from "./client.js";

const id = encodeURIComponent;

// ---------- Public discovery ----------

export const settingsApi = (client: ApiClient) => ({
  getPublic: () => client.get<PublicSettingsResponse>("/settings/public"),
});

export const statsApi = (client: ApiClient) => ({
  getGlobal: () => client.get<PublicStatsResponse>("/stats"),
});

export const categoriesApi = (client: ApiClient) => ({
  getTree: () => client.get<CategoryTreeResponse>("/categories/tree"),
});

export const placesApi = (client: ApiClient) => ({
  list: (params?: PlacesQueryParams) => client.get<PlacesResponse>("/places", params),
  byIds: (ids: string[]) =>
    client.get<PlacesResponse>("/places", { ids, limit: Math.min(Math.max(ids.length, 1), 100) }),
  ancestors: (placeId: string) =>
    client.get<PlaceAncestorsResponse>(`/places/${id(placeId)}/ancestors`),
  suggest: (dto: CreatePlaceSuggestionDto) =>
    client.post<PlaceSuggestionResponse>("/places/suggestions", dto),
});

export const referencesApi = (client: ApiClient) => ({
  list: (
    type: ReferenceType,
    categoryId?: string,
    params?: Omit<ReferencesQueryParams, "type" | "categoryId">,
  ) => client.get<ReferencesResponse>("/references", { ...params, type, categoryId }),
});

export const contactApi = (client: ApiClient) => ({
  send: (dto: CreateContactMessageDto) =>
    client.post<CreateContactMessageResponse>("/contact", dto),
});

export const geoApi = (client: ApiClient) => ({
  geocode: (params: GeocodeParams) => client.get<GeocodeResponse>("/geocode", params),
  distance: (params: DistanceParams) => client.get<DistanceResponse>("/distance", params),
});

// ---------- Providers ----------

export const providersApi = (client: ApiClient) => ({
  search: (params?: ProviderSearchParams) =>
    client.get<ProviderSearchResponse>("/providers", params),
  getPublic: (providerId: string) =>
    client.get<ProviderPublicResponse>(`/providers/${id(providerId)}`),
  availability: (providerId: string, date: string) =>
    client.get<AvailabilityResponse>(`/providers/${id(providerId)}/availability`, { date }),
  reviews: (providerId: string, params?: ProviderReviewsQueryParams) =>
    client.get<ProviderReviewsResponse>(`/providers/${id(providerId)}/reviews`, params),
  publish: (dto: PublishProviderDto) => client.post<PublishProviderResponse>("/me/provider", dto),
  updateMe: (dto: UpdateProviderDto) => client.patch<UpdateProviderResponse>("/providers/me", dto),
  putSchedule: (dto: PutScheduleDto) =>
    client.put<PutScheduleResponse>("/providers/me/schedule", dto),
  putMedia: (dto: PutMediaDto) => client.put<PutMediaResponse>("/providers/me/media", dto),
  setAvailability: (isAvailable: boolean) =>
    client.patch<UpdateAvailabilityResponse>("/providers/me/availability", { isAvailable }),
});

// ---------- Identity and media ----------

export const identityApi = (client: ApiClient) => ({
  me: () => client.get<MeResponse>("/me"),
  updateProfile: (dto: UpdateProfileDto) =>
    client.patch<UpdateProfileResponse>("/me/profile", dto),
  acceptTerms: () => client.post<AcceptTermsResponse>("/me/accept-terms"),
  deleteAccount: () => client.delete<DeleteAccountResponse>("/me"),
});

export const mediaApi = (client: ApiClient) => ({
  sign: (dto: UploadSignRequestDto) => client.post<UploadSignResponse>("/me/uploads/sign", dto),
  signRead: (path: string) => client.get<SignReadResponse>("/me/media/sign-read", { path }),
  setAvatar: (dto: ConfirmAvatarDto) => client.post<ConfirmAvatarResponse>("/me/avatar", dto),
});

// ---------- Bookings and reviews ----------

export const bookingsApi = (client: ApiClient) => ({
  create: (dto: CreateBookingDto) => client.post<BookingResponse>("/bookings", dto),
  list: (params?: BookingsQueryParams) => client.get<BookingsResponse>("/bookings", params),
  get: (bookingId: string) => client.get<BookingResponse>(`/bookings/${id(bookingId)}`),
  confirm: (bookingId: string) =>
    client.post<BookingResponse>(`/bookings/${id(bookingId)}/confirm`),
  complete: (bookingId: string, dto: CompleteBookingDto = {}) =>
    client.post<BookingResponse>(`/bookings/${id(bookingId)}/complete`, dto),
  cancel: (bookingId: string, dto: CancelBookingDto = {}) =>
    client.post<BookingResponse>(`/bookings/${id(bookingId)}/cancel`, dto),
  updateNotes: (bookingId: string, dto: UpdateBookingNotesDto) =>
    client.patch<BookingResponse>(`/bookings/${id(bookingId)}/notes`, dto),
});

export const reviewsApi = (client: ApiClient) => ({
  create: (dto: CreateReviewDto) => client.post<ReviewResponse>("/reviews", dto),
  mine: () => client.get<MyReviewsResponse>("/reviews/mine"),
  reply: (reviewId: string, dto: ReplyReviewDto) =>
    client.post<ReviewResponse>(`/reviews/${id(reviewId)}/reply`, dto),
  createClientReview: (dto: CreateClientReviewDto) =>
    client.post<ClientReviewResponse>("/reviews/clients", dto),
  clientSummary: (clientId: string) =>
    client.get<ClientRatingSummaryResponse>(`/reviews/clients/${id(clientId)}/summary`),
});

// ---------- Messaging and safety ----------

export const conversationsApi = (client: ApiClient) => ({
  list: (params?: ConversationsQueryParams) =>
    client.get<ConversationsResponse>("/conversations", params),
  start: (dto: StartConversationDto) =>
    client.post<StartConversationResponse>("/conversations", dto),
  messages: (conversationId: string, params?: MessagesQueryParams) =>
    client.get<MessagesResponse>(`/conversations/${id(conversationId)}/messages`, params),
  send: (conversationId: string, dto: SendMessageDto) =>
    client.post<SendMessageResponse>(`/conversations/${id(conversationId)}/messages`, dto),
  deleteMessage: (conversationId: string, messageId: string) =>
    client.delete<OkResponse>(
      `/conversations/${id(conversationId)}/messages/${id(messageId)}`,
    ),
});

export const safetyApi = (client: ApiClient) => ({
  report: (dto: CreateReportDto) => client.post<ReportResponse>("/reports", dto),
  block: (userId: string) => client.post<BlockResponse>("/blocks", { userId }),
  unblock: (userId: string) => client.delete<OkResponse>(`/blocks/${id(userId)}`),
  blocks: (params?: BlocksQueryParams) => client.get<BlocksResponse>("/blocks", params),
});

// ---------- Client utilities ----------

export const addressesApi = (client: ApiClient) => ({
  list: (params?: AddressesQueryParams) => client.get<AddressesResponse>("/addresses", params),
  create: (dto: CreateAddressDto) => client.post<AddressResponse>("/addresses", dto),
  update: (addressId: string, dto: UpdateAddressDto) =>
    client.patch<AddressResponse>(`/addresses/${id(addressId)}`, dto),
  remove: (addressId: string) => client.delete<OkResponse>(`/addresses/${id(addressId)}`),
});

export const notificationsApi = (client: ApiClient) => ({
  list: (params?: NotificationsQueryParams) =>
    client.get<NotificationsResponse>("/notifications", params),
  markRead: (notificationId: string) =>
    client.patch<NotificationResponse>(`/notifications/${id(notificationId)}/read`),
  markAllRead: () => client.patch<MarkAllNotificationsReadResponse>("/notifications/read-all"),
});

export const dashboardApi = (client: ApiClient) => ({
  provider: () => client.get<ProviderDashboardResponse>("/dashboard/provider"),
  client: () => client.get<ClientDashboardResponse>("/dashboard/client"),
});

// ---------- Provider back office ----------

export const earningsApi = (client: ApiClient) => ({
  summary: () => client.get<EarningsSummaryResponse>("/pro/earnings/summary"),
  transactions: (params?: EarningsTransactionsQueryParams) =>
    client.get<EarningsTransactionsResponse>("/pro/earnings/transactions", params),
});

export const verificationApi = (client: ApiClient) => ({
  state: () => client.get<VerificationStateResponse>("/pro/verification/state"),
  uploadDoc: (dto: UploadVerificationDocDto) =>
    client.post<UploadVerificationDocResponse>("/pro/verification/documents", dto),
  removeDoc: (docId: string) =>
    client.delete<RemoveVerificationDocResponse>(`/pro/verification/documents/${id(docId)}`),
  submit: () => client.post<SubmitVerificationResponse>("/pro/verification/submit"),
});

// ---------- Public launch lead intake ----------

export const launchLeadsApi = (client: ApiClient) => ({
  submitProvider: (data: CreateProviderLeadDtoType) =>
    client.post<CreateLaunchLeadResponse>("/launch/provider-leads", data),
  submitClient: (data: CreateClientLeadDtoType) =>
    client.post<CreateLaunchLeadResponse>("/launch/client-leads", data),
  trackFunnelEvent: (data: CreateLaunchFunnelEventDtoType) =>
    client.post<CreateLaunchFunnelEventResponse>(
      "/launch/funnel-events",
      data,
    ),
});

// ---------- Assistant (agent concierge) ----------

export const assistantApi = (client: ApiClient) => ({
  createConversation: () =>
    client.post<AssistantConversationResponse>("/assistant/conversations"),
  listConversations: (params?: AssistantConversationsQueryParams) =>
    client.get<AssistantConversationsResponse>("/assistant/conversations", params),
  getConversation: (id: string) =>
    client.get<AssistantConversationDetailResponse>(
      `/assistant/conversations/${encodeURIComponent(id)}`,
    ),
  archiveConversation: (id: string) =>
    client.post<AssistantConversationResponse>(
      `/assistant/conversations/${encodeURIComponent(id)}/archive`,
    ),
  unarchiveConversation: (id: string) =>
    client.post<AssistantConversationResponse>(
      `/assistant/conversations/${encodeURIComponent(id)}/unarchive`,
    ),
  renameConversation: (id: string, title: string | null) =>
    client.patch<AssistantConversationResponse>(
      `/assistant/conversations/${encodeURIComponent(id)}`,
      { title },
    ),
  deleteConversation: (id: string) =>
    client.delete<OkResponse>(`/assistant/conversations/${encodeURIComponent(id)}`),
  suggestions: () => client.get<AssistantSuggestionsResponse>("/assistant/suggestions"),
  // The turn itself streams through the AI SDK transport; this is the path it posts to.
  messagesPath: (id: string) => `/assistant/conversations/${encodeURIComponent(id)}/messages`,
});

// ---------- Admin ----------

export const adminApi = (client: ApiClient) => ({
  overview: () => client.get<AdminOverviewResponse>("/admin/overview"),

  users: (params?: AdminUserSearchParams) => client.get<AdminUsersResponse>("/admin/users", params),
  updateUser: (userId: string, dto: AdminUpdateUserDto) =>
    client.patch<AdminUserResponse>(`/admin/users/${id(userId)}`, dto),
  userCv: (userId: string) => client.get<AdminUserCvResponse>(`/admin/users/${id(userId)}/cv`),

  providers: (params?: AdminProviderSearchParams) =>
    client.get<AdminProvidersResponse>("/admin/providers", params),
  updateProvider: (providerId: string, dto: AdminUpdateProviderDto) =>
    client.patch<AdminProviderResponse>(`/admin/providers/${id(providerId)}`, dto),

  verificationQueue: (params?: AdminVerificationQueueSearchParams) =>
    client.get<AdminVerificationQueueResponse>("/admin/verification/submissions", params),
  reviewVerificationDoc: (dto: AdminReviewVerificationDocDto) =>
    client.put<AdminReviewVerificationDocResponse>("/admin/verification/documents", dto),

  bookings: (params?: AdminBookingSearchParams) =>
    client.get<AdminBookingsResponse>("/admin/bookings", params),
  cancelBooking: (bookingId: string, dto: AdminCancelBookingDto) =>
    client.post<AdminCancelBookingResponse>(`/admin/bookings/${id(bookingId)}/cancel`, dto),

  reviews: (params?: AdminReviewSearchParams) =>
    client.get<AdminReviewsResponse>("/admin/reviews", params),
  updateReview: (reviewId: string, dto: AdminUpdateReviewDto) =>
    client.patch<AdminReviewResponse>(`/admin/reviews/${id(reviewId)}`, dto),
  deleteReview: (reviewId: string) => client.delete<OkResponse>(`/admin/reviews/${id(reviewId)}`),

  conversations: (params?: AdminConversationSearchParams) =>
    client.get<AdminConversationsResponse>("/admin/conversations", params),
  conversationMessages: (conversationId: string, params?: AdminMessagesQueryParams) =>
    client.get<AdminConversationMessagesResponse>(
      `/admin/conversations/${id(conversationId)}/messages`,
      params,
    ),
  deleteConversation: (conversationId: string) =>
    client.delete<OkResponse>(`/admin/conversations/${id(conversationId)}`),
  deleteMessage: (messageId: string) =>
    client.delete<OkResponse>(`/admin/messages/${id(messageId)}`),

  contacts: (params?: AdminContactSearchParams) =>
    client.get<AdminContactsResponse>("/admin/contacts", params),
  updateContact: (contactId: string, dto: AdminUpdateContactDto) =>
    client.patch<AdminContactResponse>(`/admin/contacts/${id(contactId)}`, dto),
  deleteContact: (contactId: string) =>
    client.delete<OkResponse>(`/admin/contacts/${id(contactId)}`),

  reports: (params?: AdminReportSearchParams) =>
    client.get<AdminReportsResponse>("/admin/reports", params),
  resolveReport: (reportId: string, dto: AdminResolveReportDto) =>
    client.patch<AdminReportResponse>(`/admin/reports/${id(reportId)}`, dto),

  settings: () => client.get<AdminSettingsResponse>("/admin/settings"),
  updateSettings: (dto: AdminUpdateSettingsDto) =>
    client.put<AdminSettingsResponse>("/admin/settings", dto),
  audit: () => client.get<AdminAuditResponse>("/admin/audit"),
  health: () => client.get<AdminHealthResponse>("/admin/health"),

  categories: () => client.get<AdminCategoriesResponse>("/admin/categories"),
  category: (categoryId: string) =>
    client.get<AdminCategoryResponse>(`/admin/categories/${id(categoryId)}`),
  createCategory: (dto: AdminCreateCategoryDto) =>
    client.post<AdminCategoryResponse>("/admin/categories", dto),
  updateCategory: (categoryId: string, dto: AdminUpdateCategoryDto) =>
    client.patch<AdminCategoryResponse>(`/admin/categories/${id(categoryId)}`, dto),
  deleteCategory: (categoryId: string) =>
    client.delete<OkResponse>(`/admin/categories/${id(categoryId)}`),
  subcategories: (params?: AdminSubcategoriesQueryParams) =>
    client.get<AdminSubcategoriesResponse>("/admin/subcategories", params),
  subcategory: (subcategoryId: string) =>
    client.get<AdminSubcategoryResponse>(`/admin/subcategories/${id(subcategoryId)}`),
  createSubcategory: (dto: AdminCreateSubcategoryDto) =>
    client.post<AdminSubcategoryResponse>("/admin/subcategories", dto),
  updateSubcategory: (subcategoryId: string, dto: AdminUpdateSubcategoryDto) =>
    client.patch<AdminSubcategoryResponse>(`/admin/subcategories/${id(subcategoryId)}`, dto),
  deleteSubcategory: (subcategoryId: string) =>
    client.delete<OkResponse>(`/admin/subcategories/${id(subcategoryId)}`),

  places: (params?: AdminPlaceSearchParams) =>
    client.get<AdminPlacesResponse>("/admin/places", params),
  place: (placeId: string) => client.get<AdminPlaceDetail>(`/admin/places/${id(placeId)}`),
  createPlace: (dto: AdminCreatePlaceDto) => client.post<AdminPlaceResponse>("/admin/places", dto),
  updatePlace: (placeId: string, dto: AdminUpdatePlaceDto) =>
    client.patch<AdminPlaceResponse>(`/admin/places/${id(placeId)}`, dto),
  mergePlaces: (dto: AdminMergeDto) =>
    client.post<AdminPlaceMergeResponse>("/admin/places/merge", dto),
  placeSuggestions: (params?: AdminSuggestionSearchParams) =>
    client.get<AdminSuggestionsResponse>("/admin/places/suggestions", params),
  approveSuggestion: (suggestionId: string) =>
    client.post<PlaceSuggestionResponse>(`/admin/places/suggestions/${id(suggestionId)}/approve`),
  rejectSuggestion: (suggestionId: string) =>
    client.post<PlaceSuggestionResponse>(`/admin/places/suggestions/${id(suggestionId)}/reject`),

  references: (params?: AdminReferenceSearchParams) =>
    client.get<AdminReferencesResponse>("/admin/references", params),
  reference: (referenceId: string) =>
    client.get<AdminReferenceResponse>(`/admin/references/${id(referenceId)}`),
  createReference: (dto: AdminCreateReferenceDto) =>
    client.post<AdminReferenceResponse>("/admin/references", dto),
  updateReference: (referenceId: string, dto: AdminUpdateReferenceDto) =>
    client.patch<AdminReferenceResponse>(`/admin/references/${id(referenceId)}`, dto),
  mergeReferences: (dto: AdminMergeDto) =>
    client.post<AdminReferenceMergeResponse>("/admin/references/merge", dto),
});
