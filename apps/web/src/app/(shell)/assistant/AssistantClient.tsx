"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { RotateCcw, SearchX, Sparkles } from "lucide-react";
import { assistantApi, queryKeys } from "@kayu/api";
import { AssistantComposer } from "@/components/assistant/AssistantComposer";
import { AssistantMessage } from "@/components/assistant/AssistantMessage";
import { SuggestionChips } from "@/components/assistant/SuggestionChips";
import { formatDayLabel, lastChoices, type AssistantUIMessage } from "@/components/assistant/types";
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

export type InitialConversation = { conversationId: string; messages: AssistantUIMessage[]; locationKnown: boolean };

function bearerHeaders(): Record<string, string> {
  const token = apiClient.getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
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

function AssistantChat({ conversationId, messages: initialMessages, locationKnown }: InitialConversation) {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const bottomRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<AssistantUIMessage>({
        api: `/api${assistantApi(apiClient).messagesPath(conversationId)}`,
        headers: bearerHeaders,
        prepareSendMessagesRequest: ({ messages }) => ({ body: { message: messages[messages.length - 1] } }),
      }),
    [conversationId],
  );

  const [interrupted, setInterrupted] = useState(false);
  const { messages, sendMessage, status, error, regenerate, clearError, stop } = useChat<AssistantUIMessage>({
    id: conversationId,
    messages: initialMessages,
    transport,
    onFinish: ({ isDisconnect, isError }) => {
      if (isDisconnect || isError) setInterrupted(true);
    },
  });

  const busy = status === "submitted" || status === "streaming";
  const failed = status === "error" || Boolean(error) || interrupted;
  const { chosenIds, slot } = lastChoices(messages);
  const lastActivity = useRef(Date.now());

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
    if (failed) clearError();
    setInterrupted(false);
    void sendMessage({ text, metadata });
  };

  const actions = {
    onChoose: (provider: { id: string; displayName: string }) =>
      send(copy.pick.chooseMessage(provider.displayName), { providerId: provider.id }),
    onSlots: (provider: { id: string; displayName: string }) =>
      send(copy.detail.slotsMessage(provider.displayName), { providerId: provider.id }),
    onPickSlot: (providerId: string, date: string, time: string) =>
      send(copy.availability.pickMessage(formatDayLabel(date), time), { providerId, date, time }),
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
            <SuggestionChips onPick={(text) => send(text)} disabled={busy} locationKnown={locationKnown} />
          </section>
        ) : (
          <div className="flex flex-col gap-5">
            {messages.map((message) => (
              <AssistantMessage
                key={message.id}
                message={message}
                busy={busy}
                chosenIds={chosenIds}
                picked={slot}
                whatsappEnabled={settings.feat_whatsapp}
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
        <AssistantComposer onSend={(text) => send(text)} disabled={busy} autoFocus={messages.length === 0} />
        <p className="mt-2 text-center text-[11px] text-muted-foreground">{copy.composer.hint}</p>
      </div>
    </div>
  );
}

/** Resumes the latest active conversation, or creates one, when the server could not do it with the cookie. */
function AssistantBootstrap() {
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
      const detail = await api.getConversation(conversationId);
      return { conversationId, messages: detail.messages as AssistantUIMessage[], locationKnown: detail.clientLocation !== null };
    },
  });

  if (boot.data) return <AssistantChat key={boot.data.conversationId} {...boot.data} />;
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
  return (
    <div className="mobile-page max-w-3xl">
      {initial ? <AssistantChat key={initial.conversationId} {...initial} /> : <AssistantBootstrap />}
    </div>
  );
}
