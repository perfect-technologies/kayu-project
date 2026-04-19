import {
  ApiClient,
  identityApi,
  categoriesApi,
  providersApi,
  bookingsApi,
  reviewsApi,
  messagesApi,
  notificationsApi,
  favoritesApi,
  settingsApi,
  dashboardApi,
  statsApi,
  geoApi,
  jobRequestsApi,
  earningsApi,
  quotesApi,
  onboardingApi,
} from '@kayu/api';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

export const apiClient = new ApiClient(API_URL);

export const api = {
  identity: identityApi(apiClient),
  categories: categoriesApi(apiClient),
  providers: providersApi(apiClient),
  bookings: bookingsApi(apiClient),
  reviews: reviewsApi(apiClient),
  messages: messagesApi(apiClient),
  notifications: notificationsApi(apiClient),
  favorites: favoritesApi(apiClient),
  settings: settingsApi(apiClient),
  dashboard: dashboardApi(apiClient),
  stats: statsApi(apiClient),
  geo: geoApi(apiClient),
  jobRequests: jobRequestsApi(apiClient),
  earnings: earningsApi(apiClient),
  quotes: quotesApi(apiClient),
  onboarding: onboardingApi(apiClient),
};
