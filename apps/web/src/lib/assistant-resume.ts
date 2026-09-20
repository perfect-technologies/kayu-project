import type {
  AssistantConversationDetailResponse,
  AssistantConversationListItem,
  AssistantConversationResponse,
  AssistantConversationsResponse,
} from "@kayu/schemas";
import type { AssistantUIMessage } from "@/components/assistant/types";

export type ResumeApi = {
  listConversations: () => Promise<AssistantConversationsResponse>;
  createConversation: () => Promise<AssistantConversationResponse>;
  getConversation: (id: string) => Promise<AssistantConversationDetailResponse>;
};

export type ResolvedConversation = {
  detail: AssistantConversationDetailResponse;
  /** The id asked for in `?c=` was unknown or belongs to someone else, and the normal resolution ran instead. */
  requestedMissing: boolean;
};

export type InitialConversation = {
  conversationId: string;
  title: string | null;
  status: AssistantConversationDetailResponse["status"];
  messages: AssistantUIMessage[];
  locationKnown: boolean;
  full: boolean;
};

export type InitialLoad = { conversation: InitialConversation; requestedMissing: boolean };

export function toInitialConversation(detail: AssistantConversationDetailResponse): InitialConversation {
  return {
    conversationId: detail.id,
    title: detail.title,
    status: detail.status,
    messages: detail.messages as AssistantUIMessage[],
    locationKnown: detail.clientLocation !== null,
    full: detail.full,
  };
}

const HOUR_MS = 60 * 60 * 1000;

export function isResumable(
  latest: Pick<AssistantConversationListItem, "lastMessageAt" | "full"> | undefined,
  resumeWindowHours: number,
  now: Date,
): boolean {
  if (!latest || latest.full || resumeWindowHours <= 0) return false;
  return now.getTime() - new Date(latest.lastMessageAt).getTime() <= resumeWindowHours * HOUR_MS;
}

function isMissing(error: unknown): boolean {
  const status = typeof error === "object" && error !== null ? (error as { status?: unknown }).status : undefined;
  return status === 400 || status === 403 || status === 404;
}

/** The one place that decides which conversation greets the client; the server component and the client boot both call it. */
export async function resolveConversation(
  api: ResumeApi,
  options: { requestedId?: string | null; now?: Date } = {},
): Promise<ResolvedConversation> {
  const requestedId = options.requestedId?.trim() || null;
  if (requestedId) {
    try {
      return { detail: await api.getConversation(requestedId), requestedMissing: false };
    } catch (error) {
      if (!isMissing(error)) throw error;
    }
  }

  const { items, resumeWindowHours } = await api.listConversations();
  const latest = items[0];
  const conversationId = latest && isResumable(latest, resumeWindowHours, options.now ?? new Date()) ? latest.id : (await api.createConversation()).id;
  return { detail: await api.getConversation(conversationId), requestedMissing: requestedId !== null };
}
