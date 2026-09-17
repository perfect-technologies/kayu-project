import type { Metadata } from "next";
import { assistantApi } from "@kayu/api";
import type { AssistantUIMessage } from "@/components/assistant/types";
import { RequireClientOnly } from "@/components/guards";
import { assistantCopy } from "@/copy/assistant";
import { createAuthenticatedServerApiClient } from "@/lib/api-server";
import { AssistantClient, type InitialConversation } from "./AssistantClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: assistantCopy.meta.title, description: assistantCopy.meta.description };

// Resumes the latest active conversation with the cookie session; on any failure (no cookie, wrong role,
// backend down) the client component takes over, so the guard's redirect matrix decides what the user sees.
async function loadInitial(): Promise<InitialConversation | null> {
  try {
    const client = await createAuthenticatedServerApiClient();
    if (!client.getAccessToken()) return null;
    const api = assistantApi(client);
    const { items } = await api.listConversations();
    const conversationId = items[0]?.id ?? (await api.createConversation()).id;
    const detail = await api.getConversation(conversationId);
    return { conversationId, messages: detail.messages as AssistantUIMessage[], locationKnown: detail.clientLocation !== null };
  } catch {
    return null;
  }
}

/** CLIENT only: providers go to /mon-espace, admins to /admin, anonymous visitors to /login?returnTo=. */
export default async function Page() {
  const initial = await loadInitial();
  return (
    <RequireClientOnly>
      <AssistantClient initial={initial} />
    </RequireClientOnly>
  );
}
