import type { Metadata } from "next";
import { assistantApi } from "@kayu/api";
import { RequireClientOnly } from "@/components/guards";
import { assistantCopy } from "@/copy/assistant";
import { createAuthenticatedServerApiClient } from "@/lib/api-server";
import { resolveConversation, toInitialConversation, type InitialLoad } from "@/lib/assistant-resume";
import { AssistantClient } from "./AssistantClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: assistantCopy.meta.title, description: assistantCopy.meta.description };

// Resolves the conversation with the cookie session; on any failure (no cookie, wrong role, backend down)
// the client component runs the same resolution, so the guard's redirect matrix decides what the user sees.
async function loadInitial(requestedId: string | null): Promise<InitialLoad | null> {
  try {
    const client = await createAuthenticatedServerApiClient();
    if (!client.getAccessToken()) return null;
    const { detail, requestedMissing } = await resolveConversation(assistantApi(client), { requestedId });
    return { conversation: toInitialConversation(detail), requestedMissing };
  } catch {
    return null;
  }
}

/** CLIENT only: providers go to /mon-espace, admins to /admin, anonymous visitors to /login?returnTo=. */
export default async function Page({ searchParams }: { searchParams: Promise<{ c?: string | string[] }> }) {
  const { c } = await searchParams;
  const initial = await loadInitial(typeof c === "string" ? c : null);
  return (
    <RequireClientOnly>
      <AssistantClient initial={initial} />
    </RequireClientOnly>
  );
}
