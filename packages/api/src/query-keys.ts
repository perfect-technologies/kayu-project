import type {
  AddressesQueryParams,
  AdminBookingSearchParams,
  AdminContactSearchParams,
  AdminConversationSearchParams,
  AdminMessagesQueryParams,
  AdminPlaceSearchParams,
  AdminProviderSearchParams,
  AdminReferenceSearchParams,
  AdminReportSearchParams,
  AdminReviewSearchParams,
  AdminSubcategoriesQueryParams,
  AdminSuggestionSearchParams,
  AdminUserSearchParams,
  AdminVerificationQueueSearchParams,
  BlocksQueryParams,
  BookingsQueryParams,
  ConversationsQueryParams,
  DistanceParams,
  EarningsTransactionsQueryParams,
  GeocodeParams,
  MessagesQueryParams,
  NotificationsQueryParams,
  PlacesQueryParams,
  ProviderReviewsQueryParams,
  ProviderSearchParams,
  ReferenceType,
  ReferencesQueryParams,
} from "@kayu/schemas";

// Shape: [group, scope, params]. Invalidate a whole group with its first segment, e.g.
// `queryClient.invalidateQueries({ queryKey: ["bookings"] })`.
export const queryKeys = {
  settings: {
    public: ["settings", "public"] as const,
  },
  stats: {
    global: ["stats", "global"] as const,
  },
  categories: {
    tree: ["categories", "tree"] as const,
  },
  places: {
    list: (params?: PlacesQueryParams) => ["places", "list", params ?? {}] as const,
    byIds: (ids: string[]) => ["places", "byIds", [...ids].sort()] as const,
    ancestors: (placeId: string) => ["places", "ancestors", placeId] as const,
  },
  references: {
    list: (
      type: ReferenceType,
      categoryId?: string,
      params?: Omit<ReferencesQueryParams, "type" | "categoryId">,
    ) => ["references", "list", { ...params, type, categoryId }] as const,
  },
  providers: {
    search: (params?: ProviderSearchParams) => ["providers", "search", params ?? {}] as const,
    detail: (providerId: string) => ["providers", "detail", providerId] as const,
    availability: (providerId: string, date: string) =>
      ["providers", "availability", { providerId, date }] as const,
    reviews: (providerId: string, params?: ProviderReviewsQueryParams) =>
      ["providers", "reviews", { ...params, providerId }] as const,
  },
  identity: {
    me: ["identity", "me"] as const,
  },
  media: {
    signRead: (path: string) => ["media", "signRead", path] as const,
  },
  bookings: {
    list: (params?: BookingsQueryParams) => ["bookings", "list", params ?? {}] as const,
    detail: (bookingId: string) => ["bookings", "detail", bookingId] as const,
  },
  reviews: {
    mine: ["reviews", "mine"] as const,
    clientSummary: (clientId: string) => ["reviews", "clientSummary", clientId] as const,
  },
  conversations: {
    list: (params?: ConversationsQueryParams) => ["conversations", "list", params ?? {}] as const,
    messages: (conversationId: string, params?: MessagesQueryParams) =>
      ["conversations", "messages", { ...params, conversationId }] as const,
  },
  safety: {
    blocks: (params?: BlocksQueryParams) => ["safety", "blocks", params ?? {}] as const,
  },
  addresses: {
    list: (params?: AddressesQueryParams) => ["addresses", "list", params ?? {}] as const,
  },
  notifications: {
    list: (params?: NotificationsQueryParams) => ["notifications", "list", params ?? {}] as const,
  },
  dashboard: {
    provider: ["dashboard", "provider"] as const,
    client: ["dashboard", "client"] as const,
  },
  earnings: {
    summary: ["earnings", "summary"] as const,
    transactions: (params?: EarningsTransactionsQueryParams) =>
      ["earnings", "transactions", params ?? {}] as const,
  },
  verification: {
    state: ["verification", "state"] as const,
  },
  geo: {
    geocode: (params: GeocodeParams) => ["geo", "geocode", params] as const,
    distance: (params: DistanceParams) => ["geo", "distance", params] as const,
  },
  assistant: {
    conversations: ["assistant", "conversations"] as const,
    conversation: (conversationId: string) => ["assistant", "conversation", conversationId] as const,
  },
  admin: {
    overview: ["admin", "overview"] as const,
    users: (params?: AdminUserSearchParams) => ["admin", "users", params ?? {}] as const,
    userCv: (userId: string) => ["admin", "users", { userId, view: "cv" }] as const,
    providers: (params?: AdminProviderSearchParams) =>
      ["admin", "providers", params ?? {}] as const,
    verification: (params?: AdminVerificationQueueSearchParams) =>
      ["admin", "verification", params ?? {}] as const,
    bookings: (params?: AdminBookingSearchParams) => ["admin", "bookings", params ?? {}] as const,
    reviews: (params?: AdminReviewSearchParams) => ["admin", "reviews", params ?? {}] as const,
    conversations: (params?: AdminConversationSearchParams) =>
      ["admin", "conversations", params ?? {}] as const,
    conversationMessages: (conversationId: string, params?: AdminMessagesQueryParams) =>
      ["admin", "conversations", { ...params, conversationId }] as const,
    contacts: (params?: AdminContactSearchParams) => ["admin", "contacts", params ?? {}] as const,
    reports: (params?: AdminReportSearchParams) => ["admin", "reports", params ?? {}] as const,
    settings: ["admin", "settings"] as const,
    audit: ["admin", "audit"] as const,
    health: ["admin", "health"] as const,
    categories: ["admin", "categories"] as const,
    category: (categoryId: string) => ["admin", "categories", { categoryId }] as const,
    subcategories: (params?: AdminSubcategoriesQueryParams) =>
      ["admin", "subcategories", params ?? {}] as const,
    subcategory: (subcategoryId: string) => ["admin", "subcategories", { subcategoryId }] as const,
    places: (params?: AdminPlaceSearchParams) => ["admin", "places", params ?? {}] as const,
    place: (placeId: string) => ["admin", "places", { placeId }] as const,
    suggestions: (params?: AdminSuggestionSearchParams) =>
      ["admin", "suggestions", params ?? {}] as const,
    references: (params?: AdminReferenceSearchParams) =>
      ["admin", "references", params ?? {}] as const,
    reference: (referenceId: string) => ["admin", "references", { referenceId }] as const,
  },
} as const;
