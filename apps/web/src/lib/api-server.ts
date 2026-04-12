import "server-only";

import { ApiClient } from "@kayu/api";
import { createSupabaseServerClient } from "./supabase-server";

const BACKEND_API_URL = `${process.env.BACKEND_URL || "http://localhost:3001"}/api`;

/**
 * Creates an API client that carries the current user's Supabase session token.
 * Only usable in Server Components / Route Handlers (reads cookies via next/headers).
 */
export async function createAuthenticatedServerApiClient() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const client = new ApiClient(BACKEND_API_URL);
  if (session?.access_token) {
    client.setAccessToken(session.access_token);
  }
  return client;
}
