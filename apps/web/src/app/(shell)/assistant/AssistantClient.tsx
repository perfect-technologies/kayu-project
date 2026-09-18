"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
import { MessageSquarePlus, RotateCcw, SearchX, Sparkles } from "lucide-react";
import { assistantApi, queryKeys } from "@kayu/api";
import type { Address } from "@kayu/schemas";
import { AssistantComposer } from "@/components/assistant/AssistantComposer";
import { AssistantMessage } from "@/components/assistant/AssistantMessage";
import { SuggestionChips } from "@/components/assistant/SuggestionChips";
import type { AddressCardMode } from "@/components/assistant/AddressCard";
import {
  formatDayLabel,
  knownProviders,
  lastChoices,
  lastResolvedPlace,
  messageAsksAddress,
  pendingAnswers,
  type AssistantUIMessage,
} from "@/components/assistant/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton, SkeletonLines } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { assistantCopy } from "@/copy/assistant";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { apiClient } from "@/lib/api";

const copy = assistantCopy;
// Above the backend's own 45 s chunk timeout: a proxy can keep the connection open after the upstream died.
const STALL_MS = 90_000;

export type InitialConversation = { conversationId: string; messages: AssistantUIMessage[]; locationKnown: boolean; full: boolean };

function bearerHeaders(): Record<string, string> {
  const token = apiClient.getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// The transport throws with the response body as message; the backend answers caps with a JSON error envelope.
function apiFailure(error: unknown): { code: string; message: string } | null {
  if (!(error instanceof Error)) return null;
  try {
    const body = JSON.parse(error.message) as { code?: unknown; message?: unknown };
    if (typeof body.code === "string" && typeof body.message === "string") return { code: body.code, message: body.message };
  } catch {}
  return null;
}

async function loadConversation(conversationId: string): Promise<InitialConversation> {
  const detail = await assistantApi(apiClient).getConversation(conversationId);
  return { conversationId, messages: detail.messages as AssistantUIMessage[], locationKnown: detail.clientLocation !== null, full: detail.full };
}

function ChatSkeleton() {
  return (
    <div role="status" aria-label={copy.thinking} className="mt-6 space-y-4">
      <Skeleton className="h-7 w-2/3" />
      <SkeletonLines lines={2} />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-11 w-40 rounded-full" />
        <Skeleton className="h-11 w-32 rounded-full" />
        <Skeleton className="h-11 w-44 rounded-full" />
      </div>
    </div>
  );
}

function AssistantChat({
  conversationId,
  messages: initialMessages,
  locationKnown: initialLocationKnown,
  full: initialFull,
  onNewConversation,
  switching,
}: InitialConversation & { onNewConversation: () => void; switching: boolean }) {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [locationKnown, setLocationKnown] = useState(initialLocationKnown);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<AssistantUIMessage>({
        api: `/api${assistantApi(apiClient).messagesPath(conversationId)}`,
        headers: bearerHeaders,
        prepareSendMessagesRequest: ({ messages }) => {
          const last = messages[messages.length - 1];
          const answers = pendingAnswers(messages);
          return { body: last?.role === "assistant" && answers.length > 0 ? { approvals: answers } : { message: last } };
        },
      }),
    [conversationId],
  );

  const [interrupted, setInterrupted] = useState(false);
  const { messages, sendMessage, status, error, regenerate, clearError, stop, addToolApprovalResponse } = useChat<AssistantUIMessage>({
    id: conversationId,
    messages: initialMessages,
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    onFinish: ({ isDisconnect, isError }) => {
      if (isDisconnect || isError) setInterrupted(true);
    },
  });

  const busy = status === "submitted" || status === "streaming";
  const failure = apiFailure(error);
  const failed = (status === "error" || Boolean(error) || interrupted) && !failure;
  const { chosenIds, slot } = lastChoices(messages);
  const known = useMemo(() => knownProviders(messages), [messages]);
  const lastMessage = messages[messages.length - 1];
  const lastMetadata = lastMessage?.role === "assistant" ? (lastMessage.metadata as { conversationFull?: boolean } | undefined) : undefined;
  const full = initialFull || lastMetadata?.conversationFull === true || failure?.code === "LIMIT_REACHED" || failure?.code === "INVALID_TRANSITION";
  const lastActivity = useRef(Date.now());

  const suggestions = useQuery({
    queryKey: queryKeys.assistant.suggestions,
    queryFn: () => assistantApi(apiClient).suggestions(),
    enabled: messages.length === 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    lastActivity.current = Date.now();
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status]);

  useEffect(() => {
    if (!busy) return;
    const timer = setInterval(() => {
      if (Date.now() - lastActivity.current > STALL_MS) {
        void stop();
        setInterrupted(true);
      }
    }, 5_000);
    return () => clearInterval(timer);
  }, [busy, stop]);

  const send = (text: string, metadata?: AssistantUIMessage["metadata"]) => {
    if (failed || failure) clearError();
    setInterrupted(false);
    void sendMessage({ text, metadata });
  };

  const addressCard: AddressCardMode | null = (() => {
    if (!lastMessage || lastMessage.role !== "assistant" || busy) return null;
    if (messageAsksAddress(lastMessage)) return { kind: "pick" };
    if (!locationKnown) {
      const place = lastResolvedPlace(messages);
      if (place) return { kind: "saveDefault", place };
    }
    return null;
  })();

  const actions = {
    onChoose: (provider: { id: string; displayName: string }) =>
      send(copy.pick.chooseMessage(provider.displayName), { providerId: provider.id }),
    onSlots: (provider: { id: string; displayName: string }) =>
      send(copy.detail.slotsMessage(provider.displayName), { providerId: provider.id }),
    onPickSlot: (providerId: string, date: string, time: string) =>
      send(copy.availability.pickMessage(formatDayLabel(date), time), { providerId, date, time }),
    onApprove: (approvalId: string) => {
      setInterrupted(false);
      void addToolApprovalResponse({ id: approvalId, approved: true });
    },
    onDeny: (approvalId: string) => {
      setInterrupted(false);
      void addToolApprovalResponse({ id: approvalId, approved: false, reason: copy.approval.cancelReason });
    },
    onRevise: (approvalId: string, text: string) => send(copy.approval.revisedMessage(text), { revisedFor: approvalId }),
    onPickAddress: (address: Address) =>
      send(copy.addressCard.pick(copy.addressCard.labels[address.label] ?? address.label, address.addressLine), { addressId: address.id }),
    onAddressCreated: (address: Address, asDefault: boolean) => {
      if (asDefault) setLocationKnown(true);
      send(asDefault ? copy.addressCard.saved(address.addressLine) : copy.addressCard.newMessage(address.addressLine), { addressId: address.id });
    },
  };

  return (
    <div className="flex min-h-[calc(100dvh-64px)] flex-col">
      <PageHeader title={copy.header.title} subtitle={copy.header.subtitle} icon={<Sparkles size={20} aria-hidden />} />

      <div className="flex-1 pt-6 pb-4">
        {messages.length === 0 ? (
          <section>
            <p className="text-[10px] font-extrabold tracking-[0.19em] text-muted-foreground uppercase">{copy.header.eyebrow}</p>
            <h2 className="mt-2 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">{copy.greeting.title(user?.firstName ?? null)}</h2>
            <p className="mt-2 mb-5 max-w-md text-sm leading-relaxed text-muted-foreground">{copy.greeting.body}</p>
            <SuggestionChips
              onPick={(text, providerId) => send(text, providerId ? { providerId } : undefined)}
              disabled={busy}
              locationKnown={locationKnown}
              personal={suggestions.data?.items ?? []}
            />
          </section>
        ) : (
          <div className="flex flex-col gap-5">
            {messages.map((message, index) => (
              <AssistantMessage
                key={message.id}
                message={message}
                busy={busy}
                isLast={index === messages.length - 1}
                chosenIds={chosenIds}
                picked={slot}
                known={known}
                whatsappEnabled={settings.feat_whatsapp}
                addressCard={index === messages.length - 1 ? addressCard : null}
                actions={actions}
              />
            ))}
            {status === "submitted" && (
              <div role="status" aria-label={copy.thinking} className="max-w-sm">
                <SkeletonLines lines={2} />
              </div>
            )}
          </div>
        )}
        {failure && !full && (
          <div role="alert" className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800">{failure.code === "RATE_LIMITED" ? copy.caps.daily : copy.error.title}</p>
            <p className="mt-1 text-xs text-amber-800/80">{failure.message}</p>
          </div>
        )}
        {full && (
          <div role="status" className="mt-4 rounded-3xl border border-border bg-secondary/60 p-4">
            <p className="text-sm font-semibold text-foreground">{failure?.code === "INVALID_TRANSITION" ? copy.caps.archivedTitle : copy.caps.fullTitle}</p>
            <p className="mt-1 text-xs text-muted-foreground">{copy.caps.fullBody}</p>
            <button type="button" onClick={onNewConversation} disabled={switching} className="primary-action mt-3 min-h-11 text-sm">
              <MessageSquarePlus size={15} aria-hidden /> {copy.caps.newConversation}
            </button>
          </div>
        )}
        {failed && (
          <div role="alert" className="mt-4 rounded-3xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-700">{copy.error.title}</p>
            <p className="mt-1 text-xs text-red-700/80">{copy.error.body}</p>
            <button
              type="button"
              onClick={() => {
                clearError();
                setInterrupted(false);
                void regenerate();
              }}
              className="secondary-action mt-3"
            >
              <RotateCcw size={15} aria-hidden /> {copy.error.retry}
            </button>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-[calc(80px+env(safe-area-inset-bottom))] z-10 -mx-4 bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:bottom-0">
        <AssistantComposer onSend={(text) => send(text)} disabled={busy || full} autoFocus={messages.length === 0} />
        <p className="mt-2 text-center text-[11px] text-muted-foreground">{copy.composer.hint}</p>
      </div>
    </div>
  );
}

/** Resumes the latest active conversation, or creates one, when the server could not do it with the cookie. */
function AssistantBootstrap({ onLoaded }: { onLoaded: (conversation: InitialConversation) => void }) {
  const { status } = useAuth();
  const boot = useQuery({
    queryKey: queryKeys.assistant.conversations,
    enabled: status === "ready",
    retry: 1,
    staleTime: Infinity,
    queryFn: async (): Promise<InitialConversation> => {
      const api = assistantApi(apiClient);
      const { items } = await api.listConversations();
      const conversationId = items[0]?.id ?? (await api.createConversation()).id;
      return loadConversation(conversationId);
    },
  });

  useEffect(() => {
    if (boot.data) onLoaded(boot.data);
  }, [boot.data, onLoaded]);

  if (boot.isError) {
    return (
      <div className="pt-6">
        <EmptyState
          icon={SearchX}
          title={copy.unavailable.title}
          description={copy.unavailable.body}
          action={
            <button type="button" onClick={() => void boot.refetch()} className="secondary-action">
              <RotateCcw size={15} aria-hidden /> {copy.unavailable.retry}
            </button>
          }
        />
      </div>
    );
  }
  return <ChatSkeleton />;
}

export function AssistantClient({ initial }: { initial: InitialConversation | null }) {
  const [current, setCurrent] = useState<InitialConversation | null>(initial);

  // "Nouvelle conversation": archive the full one, then start fresh so the cap never blocks the client.
  const renew = useMutation({
    mutationFn: async (previousId: string) => {
      const api = assistantApi(apiClient);
      await api.archiveConversation(previousId).catch(() => undefined);
      return loadConversation((await api.createConversation()).id);
    },
    onSuccess: (conversation) => setCurrent(conversation),
  });

  return (
    <div className="mobile-page max-w-3xl">
      {current ? (
        <AssistantChat key={current.conversationId} {...current} switching={renew.isPending} onNewConversation={() => renew.mutate(current.conversationId)} />
      ) : (
        <AssistantBootstrap onLoaded={setCurrent} />
      )}
    </div>
  );
}
