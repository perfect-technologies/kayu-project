import { redirect } from "next/navigation";
import { ApiError, identityApi } from "@kayu/api";
import { SuspendedScreen } from "@/components/layout/SuspendedScreen";
import { createAuthenticatedServerApiClient } from "@/lib/api-server";
import { loginPath } from "@/lib/auth-redirects";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import "./print.css";

export const dynamic = "force-dynamic";

/** Server guard: no session → login, non-admin → home, suspended → the shared suspended screen. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect(loginPath("/admin"));

  const client = await createAuthenticatedServerApiClient();
  try {
    const { user } = await identityApi(client).me();
    if (user.role !== "ADMIN") redirect("/");
  } catch (error) {
    if (error instanceof ApiError && error.code === "ACCOUNT_SUSPENDED") return <SuspendedScreen />;
    if (error instanceof ApiError && error.status === 401) redirect(loginPath("/admin"));
    // Backend unreachable: let the client guard and the API answer once it is back.
  }
  return <>{children}</>;
}
