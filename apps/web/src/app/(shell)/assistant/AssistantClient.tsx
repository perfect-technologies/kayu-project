"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
import { Archive, ArchiveRestore, MessageSquarePlus, RotateCcw, SearchX, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { assistantApi, queryKeys } from "@kayu/api";
import type { Address } from "@kayu/schemas";
import { AssistantComposer, COMPOSER_INPUT_ID } from "@/components/assistant/AssistantComposer";
import { AssistantMessage } from "@/components/assistant/AssistantMessage";
import { ConversationHeader } from "@/components/assistant/ConversationHeader";
import { ConversationDrawer } from "@/components/assistant/ConversationDrawer";
import { ConversationList, type ConversationActions } from "@/components/assistant/ConversationList";
import { useIsDesktop } from "@/components/assistant/useIsDesktop";
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
import { resolveConversation, toInitialConversation, type InitialConversation, type InitialLoad } from "@/lib/assistant-resume";

const copy = assistantCopy;
// Above the backend's own 45 s chunk timeout: a proxy can keep the connection open after the upstream died.
const STALL_MS = 90_000;

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

async function resolve(requestedId: string | null): Promise<InitialLoad> {
  const { detail, requestedMissing } = await resolveConversation(assistantApi(apiClient), { requestedId });
  return { conversation: toInitialConversation(detail), requestedMissing };
}

function firstUserText(messages: AssistantUIMessage[]): string | null {
  const first = messages.find((message) => message.role === "user");
  const text = first?.parts.map((part) => (part.type === "text" ? part.text : "")).join(" ").trim();
  return text || null;
}

type ChatControls = {
  switching: boolean;
  onNewConversation: () => void;
  onOpenList: () => void;
  onArchive: () => void;
  onReactivate: () => void;
  onArchivedDetected: () => void;
  onTurnFinished: () => void;
  onEmptyChange: (empty: boolean) => void;
};

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
  title,
  status: conversationStatus,
  messages: initialMessages,
  locationKnown: initialLocationKnown,
  full: initialFull,
  switching,
  onNewConversation,
  onOpenList,
  onArchive,
  onReactivate,
  onArchivedDetected,
  onTurnFinished,
  onEmptyChange,
}: InitialConversation & ChatControls) {
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
      onTurnFinished();
    },
  });

  const busy = status === "submitted" || status === "streaming";
  const failure = apiFailure(error);
  const failed = (status === "error" || Boolean(error) || interrupted) && !failure;
  const { chosenIds, slot } = lastChoices(messages);
  const known = useMemo(() => knownProviders(messages), [messages]);
  const lastMessage = messages[messages.length - 1];
  const lastMetadata = lastMessage?.role === "assistant" ? (lastMessage.metadata as { conversationFull?: boolean } | undefined) : undefined;
  const refusedAsArchived = failure?.code === "INVALID_TRANSITION";
  const archived = conversationStatus === "ARCHIVED" || refusedAsArchived;
  const full = !archived && (initialFull || lastMetadata?.conversationFull === true || failure?.code === "LIMIT_REACHED");
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

  const empty = messages.length === 0;
  useEffect(() => onEmptyChange(empty), [empty, onEmptyChange]);

  // Archived elsewhere (another tab, the automatic sweep): the refused turn becomes the read-only state, not an error.
  useEffect(() => {
    if (refusedAsArchived && conversationStatus !== "ARCHIVED") onArchivedDetected();
  }, [refusedAsArchived, conversationStatus, onArchivedDetected]);

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
      <ConversationHeader
        title={title ?? firstUserText(messages)}
        archived={archived}
        empty={empty}
        busy={switching || busy}
        onOpenList={onOpenList}
        onNew={onNewConversation}
        onArchive={onArchive}
      />

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
        {failure && !full && !archived && (
          <div role="alert" className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800">{failure.code === "RATE_LIMITED" ? copy.caps.daily : copy.error.title}</p>
            <p className="mt-1 text-xs text-amber-800/80">{failure.message}</p>
          </div>
        )}
        {full && (
          <div role="status" className="mt-4 rounded-3xl border border-border bg-secondary/60 p-4">
            <p className="text-sm font-semibold text-foreground">{copy.caps.fullTitle}</p>
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
        {archived ? (
          <div role="status" className="flex flex-wrap items-center gap-3 rounded-3xl border border-border bg-secondary/60 p-4">
            <Archive size={18} aria-hidden className="shrink-0 text-primary" />
            <div className="min-w-0 flex-1 basis-40">
              <p className="text-sm font-semibold text-foreground">{copy.conversations.readOnly.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{copy.conversations.readOnly.body}</p>
            </div>
            <button
              type="button"
              onClick={onReactivate}
              disabled={switching}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground active:scale-[.975] disabled:opacity-55"
            >
              <ArchiveRestore size={15} aria-hidden /> {copy.conversations.readOnly.action}
            </button>
          </div>
        ) : (
          <>
            <AssistantComposer onSend={(text) => send(text)} disabled={busy || full || switching} autoFocus={messages.length === 0} />
            <p className="mt-2 text-center text-[11px] text-muted-foreground">{copy.composer.hint}</p>
          </>
        )}
      </div>
    </div>
  );
}

/** Runs the same resolution as the server component when the server could not do it with the cookie. */
function AssistantBootstrap({ requestedId, onLoaded }: { requestedId: string | null; onLoaded: (load: InitialLoad) => void }) {
  const { status } = useAuth();
  const boot = useQuery({
    queryKey: [...queryKeys.assistant.boot, requestedId],
    enabled: status === "ready",
    retry: 1,
    staleTime: Infinity,
    gcTime: 0,
    queryFn: () => resolve(requestedId),
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

type Change = { kind: "archive" | "unarchive" | "remove"; id: string } | { kind: "rename"; id: string; title: string | null };

const CHANGE_TOAST = {
  archive: copy.conversations.toasts.archived,
  unarchive: copy.conversations.toasts.unarchived,
  rename: copy.conversations.toasts.renamed,
  remove: copy.conversations.toasts.deleted,
} as const;

const conversationUrl = (id: string | null) => (id ? `/assistant?c=${encodeURIComponent(id)}` : "/assistant");

export function AssistantClient({ initial }: { initial: InitialLoad | null }) {
  const queryClient = useQueryClient();
  const requestedId = useSearchParams().get("c");
  const [current, setCurrent] = useState<InitialConversation | null>(initial?.conversation ?? null);
  // The conversation the bare /assistant URL stands for, so the back button returns to it rather than resolving again.
  const [defaultId, setDefaultId] = useState<string | null>(
    initial && (!requestedId || initial.requestedMissing) ? initial.conversation.conversationId : null,
  );
  // Ids the URL may still carry for a render after they proved missing or were deleted; the router catches up a tick later.
  const [deadIds, setDeadIds] = useState<string[]>(initial?.requestedMissing && requestedId ? [requestedId] : []);
  const { status: authStatus } = useAuth();
  const desktop = useIsDesktop();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [currentEmpty, setCurrentEmpty] = useState((initial?.conversation.messages.length ?? 0) === 0);
  const [loading, setLoading] = useState(false);
  const currentId = current?.conversationId ?? null;
  const liveRequestedId = requestedId && !deadIds.includes(requestedId) ? requestedId : null;
  const targetId = liveRequestedId ?? defaultId;

  const accept = useCallback((load: InitialLoad, requested: string | null) => {
    setCurrent(load.conversation);
    if (!requested || load.requestedMissing) setDefaultId(load.conversation.conversationId);
    if (requested && load.requestedMissing) {
      setDeadIds((ids) => [...ids, requested]);
      toast.error(copy.conversations.toasts.notFound);
      window.history.replaceState(null, "", conversationUrl(null));
    }
  }, []);

  const announcedMissing = useRef(false);
  useEffect(() => {
    if (!initial?.requestedMissing || announcedMissing.current) return;
    announcedMissing.current = true;
    toast.error(copy.conversations.toasts.notFound);
    window.history.replaceState(null, "", conversationUrl(null));
  }, [initial]);

  // The URL drives switching: the sheet and "Nouvelle conversation" push ?c=, the back button pops it.
  useEffect(() => {
    if (!currentId || targetId === currentId) return;
    let cancelled = false;
    setLoading(true);
    resolve(targetId)
      .then((load) => {
        if (!cancelled) accept(load, liveRequestedId);
      })
      .catch(() => {
        if (!cancelled) toast.error(copy.conversations.toasts.failed);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      setLoading(false);
    };
  }, [targetId, currentId, liveRequestedId, accept]);

  const invalidateLists = useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKeys.assistant.conversations }),
    [queryClient],
  );

  const startNew = useMutation({
    mutationFn: () => assistantApi(apiClient).createConversation(),
    onSuccess: (created) => {
      setSheetOpen(false);
      window.history.pushState(null, "", conversationUrl(created.id));
    },
    onError: () => toast.error(copy.conversations.toasts.failed),
  });

  const change = useMutation({
    mutationFn: async (input: Change) => {
      const api = assistantApi(apiClient);
      if (input.kind === "archive") return api.archiveConversation(input.id);
      if (input.kind === "unarchive") return api.unarchiveConversation(input.id);
      if (input.kind === "rename") return api.renameConversation(input.id, input.title);
      await api.deleteConversation(input.id);
      return null;
    },
    onSuccess: (summary, input) => {
      void invalidateLists();
      void queryClient.invalidateQueries({ queryKey: queryKeys.assistant.conversation(input.id) });
      toast.success(CHANGE_TOAST[input.kind]);
      if (input.id !== currentId) return;
      if (summary) {
        setCurrent((value) => (value ? { ...value, title: summary.title, status: summary.status } : value));
        return;
      }
      setDeadIds((ids) => [...ids, input.id]);
      setDefaultId((id) => (id === input.id ? null : id));
      if (requestedId === input.id) window.history.replaceState(null, "", conversationUrl(null));
    },
    onError: () => toast.error(copy.conversations.toasts.failed),
  });

  const actions: ConversationActions = {
    archive: (id) => change.mutate({ kind: "archive", id }),
    unarchive: (id) => change.mutate({ kind: "unarchive", id }),
    rename: (id, title) => change.mutate({ kind: "rename", id, title }),
    remove: (id) => change.mutate({ kind: "remove", id }),
    busy: change.isPending,
  };

  // useChat keeps the callbacks of its first render, so the latest conversation is read through a ref.
  const latest = useRef(current);
  useEffect(() => {
    latest.current = current;
  }, [current]);

  const onTurnFinished = useCallback(() => {
    void invalidateLists();
    const open = latest.current;
    if (!open || open.title) return;
    void assistantApi(apiClient)
      .getConversation(open.conversationId)
      .then((detail) => setCurrent((value) => (value?.conversationId === detail.id ? { ...value, title: detail.title } : value)))
      .catch(() => undefined);
  }, [invalidateLists]);

  const onArchivedDetected = useCallback(() => {
    setCurrent((value) => (value ? { ...value, status: "ARCHIVED" } : value));
    void invalidateLists();
  }, [invalidateLists]);

  useEffect(() => {
    if (desktop) setSheetOpen(false);
  }, [desktop]);

  const switching = loading || startNew.isPending || change.isPending;
  const list = (
    <ConversationList
      enabled={authStatus === "ready"}
      currentId={currentId}
      actions={actions}
      newDisabled={switching || currentEmpty || !currentId}
      onNew={() => startNew.mutate()}
      onOpenConversation={(id) => {
        setSheetOpen(false);
        if (id !== currentId) window.history.pushState(null, "", conversationUrl(id));
      }}
      onCompose={() => {
        setSheetOpen(false);
        requestAnimationFrame(() => document.getElementById(COMPOSER_INPUT_ID)?.focus());
      }}
    />
  );

  const onLoaded = useCallback((load: InitialLoad) => accept(load, liveRequestedId), [accept, liveRequestedId]);

  return (
    <div className="mobile-page max-w-6xl lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-8">
      <aside
        aria-label={copy.conversations.sheetTitle}
        className="sticky top-[88px] hidden max-h-[calc(100dvh-112px)] overflow-y-auto overscroll-contain rounded-3xl border border-border bg-white p-3 shadow-soft lg:block"
      >
        {desktop && list}
      </aside>
      <div className="mx-auto w-full max-w-3xl min-w-0">
        {current && currentId ? (
          <AssistantChat
            key={currentId}
            {...current}
            switching={switching}
            onNewConversation={() => startNew.mutate()}
            onOpenList={() => setSheetOpen(true)}
            onArchive={() => actions.archive(currentId)}
            onReactivate={() => actions.unarchive(currentId)}
            onArchivedDetected={onArchivedDetected}
            onTurnFinished={onTurnFinished}
            onEmptyChange={setCurrentEmpty}
          />
        ) : (
          <AssistantBootstrap requestedId={liveRequestedId} onLoaded={onLoaded} />
        )}
      </div>
      {!desktop && (
        <ConversationDrawer open={sheetOpen} onClose={() => setSheetOpen(false)}>
          {list}
        </ConversationDrawer>
      )}
    </div>
  );
}
