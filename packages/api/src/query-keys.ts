import type {
  ProviderSearchParams,
  BookingSearchParams,
  ReviewSearchParams,
  MessageSearchParams,
  NotificationSearchParams,
  AdminUserSearchParams,
  AdminProviderSearchParams,
  AdminReviewSearchParams,
  EarningsTransactionSearchParams,
} from "@kayu/schemas";

export const queryKeys = {
  identity: {
    me: ["identity", "me"] as const,
  },
  categories: {
    all: ["categories"] as const,
    hierarchy: ["categories", "hierarchy"] as const,
  },
  providers: {
    search: (params?: Partial<ProviderSearchParams>) =>
      ["providers", "search", params] as const,
    detail: (id: string) => ["providers", "detail", id] as const,
  },
  bookings: {
    all: (params?: Partial<BookingSearchParams>) =>
      ["bookings", params] as const,
    detail: (id: string) => ["bookings", "detail", id] as const,
  },
  reviews: {
    byProvider: (providerId: string, params?: Partial<ReviewSearchParams>) =>
      ["reviews", "provider", providerId, params] as const,
  },
  messages: {
    conversations: (params?: Partial<MessageSearchParams>) =>
      ["messages", "conversations", params] as const,
    conversation: (id: string) =>
      ["messages", "conversation", id] as const,
  },
  notifications: {
    all: (params?: Partial<NotificationSearchParams>) =>
      ["notifications", params] as const,
  },
  favorites: {
    all: ["favorites"] as const,
    check: (providerId: string) =>
      ["favorites", "check", providerId] as const,
  },
  settings: {
    visibility: ["settings", "visibility"] as const,
  },
  dashboard: {
    provider: ["dashboard", "provider"] as const,
    client: ["dashboard", "client"] as const,
    admin: ["dashboard", "admin"] as const,
  },
  stats: {
    global: ["stats"] as const,
  },
  geo: {
    geocode: (city: string) => ["geo", "geocode", city] as const,
    distance: (lat: number, lng: number) =>
      ["geo", "distance", lat, lng] as const,
  },
  jobRequests: {
    mine: ["jobRequests", "mine"] as const,
    inboxForPro: ["jobRequests", "inboxForPro"] as const,
    detail: (id: string) => ["jobRequests", "detail", id] as const,
  },
  earnings: {
    summary: ["earnings", "summary"] as const,
    transactions: (params?: Partial<EarningsTransactionSearchParams>) =>
      ["earnings", "transactions", params ?? {}] as const,
    payouts: ["earnings", "payouts"] as const,
  },
  admin: {
    users: (params?: Partial<AdminUserSearchParams>) =>
      ["admin", "users", params] as const,
    providers: (params?: Partial<AdminProviderSearchParams>) =>
      ["admin", "providers", params] as const,
    categories: ["admin", "categories"] as const,
    reviews: (params?: Partial<AdminReviewSearchParams>) =>
      ["admin", "reviews", params] as const,
  },
} as const;
