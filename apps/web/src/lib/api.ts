import { ApiClient } from "@kayu/api";

const BACKEND_API_URL = `${process.env.BACKEND_URL || "http://localhost:3001"}/api`;

// Browser-side API client: /api prefix is proxied by Next.js rewrites to the backend
// Server-side: use the full backend URL
export const apiClient = new ApiClient(
  typeof window !== "undefined" ? "/api" : BACKEND_API_URL
);

// Server-side API client factory — creates a fresh client with the given token
export function createServerApiClient(accessToken?: string) {
  const client = new ApiClient(BACKEND_API_URL);
  if (accessToken) {
    client.setAccessToken(accessToken);
  }
  return client;
}
