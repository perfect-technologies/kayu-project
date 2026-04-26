"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardApi, finalOffersApi, messagesApi, queryKeys } from "@kayu/api";
import type { Conversation, FinalOffer, Message, UserSummary } from "@kayu/schemas";
import { formatMoneyFc } from "@kayu/ui";
import { Avatar, EmptyState, ErrorState, I } from "@kayu/ui/web";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const SUGGESTED_REPLIES = [
  "Merci beaucoup !",
  "Pouvez-vous confirmer les détails ?",
  "À quelle heure serez-vous disponible ?",
  "Ça marche pour moi.",
];

type FilterKey = "all" | "unread" | "active";

const FILTERS: { k: FilterKey; label: string }[] = [
  { k: "all", label: "Tous" },
  { k: "unread", label: "Non lus" },
  { k: "active", label: "Actives" },
];

type ConversationsQueryData = { success?: boolean; conversations: Conversation[] };
type MessagesQueryData = { success?: boolean; messages: Message[] };
type FinalOffersQueryData = { success?: boolean; finalOffers: FinalOffer[] };

function getOtherName(u?: UserSummary | null) {
  if (!u) return "Utilisateur";
  const full = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
  return full || "Utilisateur";
}

function formatListTime(iso?: string | Date | null) {
  if (!iso) return "";
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYesterday) return "hier";
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays < 7) return d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "");
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function formatBubbleTime(iso?: string | Date | null) {
  if (!iso) return "";
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })} ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}

function defaultOfferDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d;
}

function toDateTimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDurationMinutes(minutes: number | null | undefined) {
  if (!minutes || minutes <= 0) return "À confirmer";
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours > 0 && remainder > 0) return `${hours}h${String(remainder).padStart(2, "0")}`;
  if (hours > 0) return `${hours} h`;
  return `${remainder} min`;
}

export function MessagesClient() {
  return (
    <Suspense fallback={null}>
      <MessagesClientInner />
    </Suspense>
  );
}

function MessagesClientInner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedConversationId = searchParams.get("conversationId");
  const requestedRecipientId = searchParams.get("recipientId");
  const requestedRecipientName = searchParams.get("recipientName");
  const [activeId, setActiveId] = useState<string | null>(
    requestedConversationId,
  );
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");

  const {
    data: convData,
    isLoading: convLoading,
    error: convError,
    refetch: refetchConvs,
  } = useQuery<ConversationsQueryData>({
    queryKey: queryKeys.messages.conversations(),
    queryFn: () => messagesApi(apiClient).getConversations() as Promise<ConversationsQueryData>,
    refetchInterval: 15_000,
  });

  const conversations = useMemo(() => convData?.conversations ?? [], [convData]);
  const requestedRecipientConversation = useMemo(() => {
    if (!requestedRecipientId) return null;
    return conversations.find((c) => c.otherUser?.id === requestedRecipientId) ?? null;
  }, [conversations, requestedRecipientId]);
  const pendingRecipientConversation = useMemo<Conversation | null>(() => {
    if (!requestedRecipientId || requestedRecipientConversation) return null;
    const name = requestedRecipientName || "Client";
    const [firstName, ...rest] = name.split(/\s+/).filter(Boolean);
    const now = new Date().toISOString();
    return {
      id: `pending:${requestedRecipientId}`,
      otherUser: {
        id: requestedRecipientId,
        firstName: firstName ?? name,
        lastName: rest.join(" ") || null,
      },
      lastMessage: null,
      lastMessageAt: now,
      unreadCount: 0,
      createdAt: now,
    };
  }, [requestedRecipientConversation, requestedRecipientId, requestedRecipientName]);
  const visibleConversations = useMemo(
    () =>
      pendingRecipientConversation
        ? [pendingRecipientConversation, ...conversations]
        : conversations,
    [conversations, pendingRecipientConversation],
  );

  // If caller landed here with ?conversationId=... via ContactDialog or a deep
  // link, select that conversation as soon as it shows up in the inbox.
  useEffect(() => {
    if (!requestedConversationId) return;
    if (visibleConversations.some((c) => c.id === requestedConversationId)) {
      setActiveId(requestedConversationId);
      return;
    }
    // Conversation may not have propagated to the list yet; keep the id pinned
    // so the thread query can still load its messages.
    setActiveId(requestedConversationId);
  }, [requestedConversationId, visibleConversations]);

  useEffect(() => {
    if (!requestedRecipientId) return;
    setActiveId(requestedRecipientConversation?.id ?? `pending:${requestedRecipientId}`);
  }, [requestedRecipientConversation, requestedRecipientId]);

  useEffect(() => {
    if (!activeId && visibleConversations.length > 0) {
      setActiveId(visibleConversations[0]!.id);
    }
  }, [visibleConversations, activeId]);

  // Strip the conversationId query param once we've selected it so reloads
  // don't fight client-side state.
  useEffect(() => {
    if (!requestedConversationId) return;
    if (requestedConversationId && activeId !== requestedConversationId) return;
    router.replace("/messages", { scroll: false });
  }, [activeId, requestedConversationId, router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visibleConversations.filter((c) => {
      const name = getOtherName(c.otherUser).toLowerCase();
      if (filter === "unread" && (c.unreadCount ?? 0) === 0) return false;
      // "En cours" pill: without a backend status, fall back to unread-bearing threads
      if (filter === "active" && (c.unreadCount ?? 0) === 0) return false;
      if (q && !name.includes(q)) return false;
      return true;
    });
  }, [visibleConversations, filter, query]);

  const active = visibleConversations.find((c) => c.id === activeId) ?? null;
  const activeIsPendingRecipient = Boolean(activeId?.startsWith("pending:"));

  const {
    data: msgData,
    isLoading: msgLoading,
    error: msgError,
    refetch: refetchMsgs,
  } = useQuery<MessagesQueryData>({
    queryKey: queryKeys.messages.conversation(activeId ?? ""),
    queryFn: () =>
      messagesApi(apiClient).getMessages(activeId!) as Promise<MessagesQueryData>,
    enabled: !!activeId && !activeIsPendingRecipient,
    refetchInterval: 5_000,
  });

  const messages = activeIsPendingRecipient ? [] : (msgData?.messages ?? []);

  const { data: providerDashboard } = useQuery({
    queryKey: queryKeys.dashboard.provider,
    queryFn: () => dashboardApi(apiClient).getProviderDashboard(),
    enabled: user?.role === "PROVIDER",
    staleTime: 60_000,
  });

  const finalOfferParams = useMemo(
    () => (activeId && !activeIsPendingRecipient ? { conversationId: activeId } : undefined),
    [activeId, activeIsPendingRecipient],
  );

  const { data: finalOfferData } = useQuery<FinalOffersQueryData>({
    queryKey: queryKeys.finalOffers.all(finalOfferParams),
    queryFn: () =>
      finalOffersApi(apiClient).getAll(finalOfferParams) as Promise<FinalOffersQueryData>,
    enabled: !!activeId && !activeIsPendingRecipient,
    refetchInterval: 10_000,
  });

  const finalOffers = finalOfferData?.finalOffers ?? [];

  const acceptOffer = useMutation({
    mutationFn: (id: string) => finalOffersApi(apiClient).accept(id),
    onSuccess: (result) => {
      if (activeId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.finalOffers.all(finalOfferParams),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.messages.conversation(activeId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.detail(result.booking.id),
      });
      router.push(`/bookings/${result.booking.id}`);
    },
  });

  const declineOffer = useMutation({
    mutationFn: (id: string) => finalOffersApi(apiClient).decline(id),
    onSuccess: () => {
      if (activeId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.finalOffers.all(finalOfferParams),
        });
      }
    },
  });

  const createOffer = useMutation({
    mutationFn: (data: Parameters<ReturnType<typeof finalOffersApi>["create"]>[0]) =>
      finalOffersApi(apiClient).create(data),
    onSuccess: () => {
      if (activeId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.finalOffers.all(finalOfferParams),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.conversations() });
    },
  });

  const sendMut = useMutation({
    mutationFn: (text: string) => {
      if (!active?.otherUser?.id) throw new Error("Aucun destinataire");
      return messagesApi(apiClient).send({
        recipientId: active.otherUser.id,
        content: text,
        type: "TEXT",
      });
    },
    onMutate: async (text: string) => {
      if (!activeId || !user) return {};
      if (activeIsPendingRecipient) return {};
      const key = queryKeys.messages.conversation(activeId);
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<MessagesQueryData>(key);
      const optimistic: Message = {
        id: `optimistic-${Date.now()}`,
        conversationId: activeId,
        senderId: user.id,
        type: "TEXT",
        content: text,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<MessagesQueryData>(key, (old) => {
        if (!old) return { success: true, messages: [optimistic] };
        return { ...old, messages: [...old.messages, optimistic] };
      });
      return { prev, key };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.key && ctx.prev) {
        queryClient.setQueryData(ctx.key, ctx.prev);
      }
    },
    onSuccess: (result) => {
      const nextConversationId = result.conversationId ?? result.message?.conversationId;
      if (nextConversationId) {
        setActiveId(nextConversationId);
        router.replace(`/messages?conversationId=${encodeURIComponent(nextConversationId)}`, {
          scroll: false,
        });
      }
    },
    onSettled: () => {
      if (activeId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.messages.conversation(activeId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.conversations() });
    },
  });

  return (
    <div
      className="-mx-4 -my-4 sm:-mx-6 sm:-my-6"
      style={{
        display: "grid",
        gridTemplateColumns: "360px 1fr",
        height: "calc(100dvh - 4rem)",
        maxHeight: "calc(100dvh - 4rem)",
        background: "var(--k-bg)",
        overflow: "hidden",
        minHeight: 0,
      }}
    >
      {/* List */}
      <div
        style={{
          borderRight: "1px solid var(--k-border)",
          background: "var(--k-surface)",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 16px 12px",
            borderBottom: "1px solid var(--k-border-subtle)",
          }}
        >
          <h1 className="k-display-m" style={{ margin: "0 0 12px", fontSize: 24 }}>
            Messages
          </h1>
          <div style={{ position: "relative" }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher…"
              className="k-input"
              style={{ paddingLeft: 40, height: 40, width: "100%" }}
            />
            <div
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--k-text-muted)",
                pointerEvents: "none",
              }}
            >
              <I.search size={16} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            {FILTERS.map((f) => {
              const is = filter === f.k;
              return (
                <button
                  key={f.k}
                  onClick={() => setFilter(f.k)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: `1px solid ${is ? "var(--k-primary)" : "var(--k-border)"}`,
                    background: is ? "var(--k-primary-subtle)" : "transparent",
                    color: is ? "var(--k-primary-hover)" : "var(--k-text-body)",
                    fontSize: 12.5,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="k-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          {convLoading ? (
            <ConversationListSkeleton />
          ) : convError ? (
            <div style={{ padding: 20 }}>
              <ErrorState
                title="Erreur de chargement"
                subtitle="Impossible de récupérer vos conversations."
                cta={{ label: "Réessayer", onClick: () => refetchConvs() }}
              />
            </div>
          ) : visibleConversations.length === 0 ? (
            <EmptyState
              icon={I.inbox}
              title="Aucun message"
              subtitle="Tes échanges avec les pros apparaîtront ici."
            />
          ) : filtered.length === 0 ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "var(--k-text-muted)",
                fontSize: 13,
              }}
            >
              Aucune conversation ne correspond.
            </div>
          ) : (
            filtered.map((c) => (
              <ThreadListItem
                key={c.id}
                conversation={c}
                active={c.id === activeId}
                onClick={() => setActiveId(c.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Thread */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minWidth: 0,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {active ? (
          <ThreadView
            conversation={active}
            messages={messages}
            finalOffers={finalOffers}
            isLoading={msgLoading}
            error={msgError}
            onRetry={() => refetchMsgs()}
            myId={user?.id ?? null}
            myRole={user?.role ?? null}
            providerId={providerDashboard?.provider?.id ?? null}
            onSend={(text) => sendMut.mutate(text)}
            onCreateOffer={(offer) => createOffer.mutateAsync(offer)}
            onAcceptOffer={(id) => acceptOffer.mutate(id)}
            onDeclineOffer={(id) => declineOffer.mutate(id)}
            sending={sendMut.isPending}
            offerBusy={
              createOffer.isPending || acceptOffer.isPending || declineOffer.isPending
            }
          />
        ) : convLoading ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--k-text-muted)",
              fontSize: 14,
            }}
          >
            Chargement…
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--k-text-muted)",
              fontSize: 14,
            }}
          >
            Sélectionnez une conversation
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationListSkeleton() {
  return (
    <div>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 12,
            padding: "14px 16px",
            borderBottom: "1px solid var(--k-border-subtle)",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "var(--k-surface-muted)",
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                height: 12,
                background: "var(--k-surface-muted)",
                borderRadius: 4,
                width: "60%",
                marginBottom: 8,
              }}
            />
            <div
              style={{
                height: 10,
                background: "var(--k-surface-muted)",
                borderRadius: 4,
                width: "90%",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ThreadListItem({
  conversation,
  active,
  onClick,
}: {
  conversation: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  const name = getOtherName(conversation.otherUser);
  const unread = conversation.unreadCount ?? 0;
  const preview = conversation.lastMessage?.content ?? "";
  const lastAt = formatListTime(conversation.lastMessageAt);

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        border: 0,
        background: active ? "var(--k-surface-primary)" : "transparent",
        padding: "14px 16px",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        cursor: "pointer",
        borderLeft: `3px solid ${active ? "var(--k-primary)" : "transparent"}`,
        textAlign: "left",
        borderBottom: "1px solid var(--k-border-subtle)",
      }}
    >
      <Avatar name={name} size={44} src={conversation.otherUser?.avatar ?? undefined} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 8,
          }}
        >
          <span
            style={{
              fontFamily: "var(--k-font-display)",
              fontWeight: 600,
              fontSize: 14.5,
              color: "var(--k-text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </span>
          <span
            className="k-caption"
            style={{ flexShrink: 0, color: "var(--k-text-muted)" }}
          >
            {lastAt}
          </span>
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 13,
            lineHeight: 1.4,
            color: unread > 0 ? "var(--k-text-primary)" : "var(--k-text-muted)",
            fontWeight: unread > 0 ? 500 : 400,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
          }}
        >
          {preview || "—"}
        </div>
        {unread > 0 && (
          <div style={{ display: "flex", marginTop: 6 }}>
            <span
              style={{
                marginLeft: "auto",
                background: "var(--k-primary)",
                color: "white",
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "var(--k-font-mono)",
                padding: "2px 8px",
                borderRadius: 999,
                minWidth: 20,
                textAlign: "center",
              }}
            >
              {unread}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

function ThreadView({
  conversation,
  messages,
  finalOffers,
  isLoading,
  error,
  onRetry,
  myId,
  myRole,
  providerId,
  onSend,
  onCreateOffer,
  onAcceptOffer,
  onDeclineOffer,
  sending,
  offerBusy,
}: {
  conversation: Conversation;
  messages: Message[];
  finalOffers: FinalOffer[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  myId: string | null;
  myRole: "CLIENT" | "PROVIDER" | "ADMIN" | null;
  providerId: string | null;
  onSend: (text: string) => void;
  onCreateOffer: (
    offer: Parameters<ReturnType<typeof finalOffersApi>["create"]>[0],
  ) => Promise<unknown>;
  onAcceptOffer: (id: string) => void;
  onDeclineOffer: (id: string) => void;
  sending: boolean;
  offerBusy: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [offerOpen, setOfferOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conversation.id, messages.length]);

  const trimmed = draft.trim();
  const canSend = trimmed.length > 0 && !sending;
  const name = getOtherName(conversation.otherUser);
  const canSendOffer =
    myRole === "PROVIDER" &&
    conversation.otherUser?.role === "CLIENT" &&
    !!providerId &&
    !!conversation.otherUser?.id;

  const submit = (text: string) => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setDraft("");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--k-bg)",
        minWidth: 0,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 20px",
          background: "var(--k-surface)",
          borderBottom: "1px solid var(--k-border-subtle)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flex: 1,
            minWidth: 0,
          }}
        >
          <Avatar name={name} size={40} src={conversation.otherUser?.avatar ?? undefined} />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--k-font-display)",
                fontWeight: 600,
                fontSize: 15,
                color: "var(--k-text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {name}
            </div>
          </div>
        </div>
        {myRole === "PROVIDER" && (
          <button
            title="Envoyer une offre finale"
            aria-label="Envoyer une offre finale"
            onClick={() => setOfferOpen(true)}
            disabled={!canSendOffer}
            className="k-btn k-btn-primary k-btn-sm"
            style={{
              flexShrink: 0,
              opacity: canSendOffer ? 1 : 0.55,
              cursor: canSendOffer ? "pointer" : "not-allowed",
            }}
          >
            <I.coins size={15} />
            Envoyer une offre finale
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="k-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "20px 24px",
          background: "var(--k-bg)",
        }}
      >
        {isLoading && messages.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--k-text-muted)",
              fontSize: 13,
            }}
          >
            Chargement des messages…
          </div>
        ) : error ? (
          <ErrorState
            title="Erreur de chargement"
            subtitle="Impossible de récupérer les messages."
            cta={{ label: "Réessayer", onClick: onRetry }}
          />
        ) : messages.length === 0 && finalOffers.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--k-text-muted)",
              fontSize: 14,
              textAlign: "center",
              padding: "0 24px",
            }}
          >
            Envoyez le premier message pour démarrer la conversation.
          </div>
        ) : (
          <>
            {messages.map((m) => <MessageBubble key={m.id} m={m} myId={myId} />)}
            {finalOffers.length > 0 && (
              <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
                {finalOffers.map((offer) => (
                  <FinalOfferCard
                    key={offer.id}
                    offer={offer}
                    myRole={myRole}
                    busy={offerBusy}
                    onAccept={() => onAcceptOffer(offer.id)}
                    onDecline={() => onDeclineOffer(offer.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Suggested replies */}
      <div
        className="k-scroll"
        style={{
          padding: "8px 20px 0",
          background: "var(--k-bg)",
          display: "flex",
          gap: 8,
          overflowX: "auto",
          flexShrink: 0,
        }}
      >
        {SUGGESTED_REPLIES.map((s) => (
          <button
            key={s}
            onClick={() => submit(s)}
            disabled={sending}
            style={{
              flexShrink: 0,
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid var(--k-border)",
              background: "var(--k-surface)",
              fontSize: 13,
              color: "var(--k-text-body)",
              cursor: sending ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
              opacity: sending ? 0.6 : 1,
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Composer */}
      <div
        style={{
          padding: "12px 20px 16px",
          background: "var(--k-bg)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <button
          aria-label="Joindre"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "1px solid var(--k-border)",
            background: "var(--k-surface)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--k-text-muted)",
            flexShrink: 0,
          }}
        >
          <I.plus size={18} />
        </button>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(draft);
            }
          }}
          placeholder="Écrire un message…"
          style={{
            flex: 1,
            height: 42,
            padding: "0 16px",
            borderRadius: 999,
            border: "1px solid var(--k-border)",
            background: "var(--k-surface)",
            fontSize: 14.5,
            outline: "none",
            color: "var(--k-text-primary)",
          }}
        />
        <button
          onClick={() => submit(draft)}
          aria-label="Envoyer"
          disabled={!canSend}
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            background: canSend ? "var(--k-primary)" : "var(--k-border)",
            color: "white",
            border: 0,
            cursor: canSend ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: canSend ? "0 4px 12px rgba(14,165,233,0.3)" : "none",
            transition: "background 120ms, box-shadow 120ms",
          }}
        >
          <I.send size={17} />
        </button>
      </div>
      {canSendOffer && (
        <FinalOfferDialog
          open={offerOpen}
          onOpenChange={setOfferOpen}
          providerId={providerId}
          clientId={conversation.otherUser!.id}
          conversationId={conversation.id}
          onSubmit={onCreateOffer}
          busy={offerBusy}
        />
      )}
    </div>
  );
}

function FinalOfferCard({
  offer,
  myRole,
  busy,
  onAccept,
  onDecline,
}: {
  offer: FinalOffer;
  myRole: "CLIENT" | "PROVIDER" | "ADMIN" | null;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const canAct = myRole === "CLIENT" && offer.status === "PENDING";
  const scheduled = new Date(offer.scheduledDate);
  const dateLabel = Number.isNaN(scheduled.getTime())
    ? "Date à confirmer"
    : scheduled.toLocaleString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
  const statusLabel: Record<FinalOffer["status"], string> = {
    PENDING: "En attente",
    ACCEPTED: "Acceptée",
    DECLINED: "Refusée",
    CANCELLED: "Annulée",
    EXPIRED: "Expirée",
  };

  return (
    <div
      style={{
        border: "1px solid var(--k-border)",
        borderRadius: 14,
        background: "var(--k-surface)",
        padding: 16,
        boxShadow: "var(--k-e1)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div className="k-overline" style={{ color: "var(--k-primary)" }}>
            Offre finale
          </div>
          <div
            style={{
              marginTop: 4,
              fontFamily: "var(--k-font-display)",
              fontSize: 17,
              fontWeight: 700,
              color: "var(--k-text-primary)",
            }}
          >
            {offer.title}
          </div>
        </div>
        <span className="k-chip k-chip-sm k-chip-primary">
          {statusLabel[offer.status]}
        </span>
      </div>
      {offer.description && (
        <p className="k-body-m" style={{ margin: "8px 0 0", color: "var(--k-text-body)" }}>
          {offer.description}
        </p>
      )}
      <div style={{ display: "grid", gap: 8, marginTop: 12, fontSize: 13 }}>
        <OfferMeta icon="coins" label="Prix convenu" value={formatMoneyFc(offer.price)} />
        <OfferMeta icon="calendar" label="Date" value={dateLabel} />
        <OfferMeta
          icon="clock"
          label="Durée"
          value={formatDurationMinutes(offer.duration)}
        />
        <OfferMeta
          icon="mapPin"
          label="Adresse"
          value={[offer.address, offer.city].filter(Boolean).join(", ") || "À confirmer"}
        />
      </div>
      <div
        className="k-caption"
        style={{
          marginTop: 12,
          padding: "10px 12px",
          borderRadius: 10,
          background: "var(--k-surface-primary)",
          color: "var(--k-text-body)",
        }}
      >
        Paiement en espèces à la fin de la mission.
      </div>
      {canAct && (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            className="k-btn k-btn-primary"
            style={{ flex: 1 }}
            disabled={busy}
            onClick={onAccept}
          >
            <I.check size={14} /> Accepter
          </button>
          <button
            className="k-btn k-btn-secondary"
            style={{ flex: 1 }}
            disabled={busy}
            onClick={onDecline}
          >
            <I.x size={14} /> Décliner
          </button>
        </div>
      )}
      {canAct && (
        <div className="k-caption" style={{ marginTop: 8, color: "var(--k-text-muted)" }}>
          Pour continuer la discussion, répondez simplement dans le fil.
        </div>
      )}
    </div>
  );
}

function OfferMeta({
  icon,
  label,
  value,
}: {
  icon: keyof typeof I;
  label: string;
  value: string;
}) {
  const Icon = I[icon] ?? I.check;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Icon size={14} strokeColor="var(--k-text-muted)" />
      <span style={{ color: "var(--k-text-muted)", minWidth: 86 }}>{label}</span>
      <span style={{ color: "var(--k-text-primary)", fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function FinalOfferDialog({
  open,
  onOpenChange,
  providerId,
  clientId,
  conversationId,
  onSubmit,
  busy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  clientId: string;
  conversationId: string;
  onSubmit: (
    offer: Parameters<ReturnType<typeof finalOffersApi>["create"]>[0],
  ) => Promise<unknown>;
  busy: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [durationHours, setDurationHours] = useState("2");
  const [scheduledDate, setScheduledDate] = useState(
    toDateTimeLocalValue(defaultOfferDate()),
  );
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Kinshasa");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  if (!open) return null;

  const submit = async () => {
    const parsedPrice = Number(price);
    const parsedDuration = Number(durationHours.replace(",", "."));
    const parsedScheduledDate = new Date(scheduledDate);
    if (!title.trim()) {
      setFormError("Indiquez le service convenu.");
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setFormError("Indiquez un prix valide en FC.");
      return;
    }
    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      setFormError("Indiquez une durée valide, par exemple 1,5 ou 2.");
      return;
    }
    if (!scheduledDate || Number.isNaN(parsedScheduledDate.getTime())) {
      setFormError("Choisissez une date et une heure valides.");
      return;
    }
    setFormError(null);
    await onSubmit({
      providerId,
      clientId,
      conversationId,
      title: title.trim(),
      description: description.trim() || undefined,
      price: parsedPrice,
      duration: Math.max(1, Math.round(parsedDuration * 60)),
      scheduledDate: parsedScheduledDate,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      notes: notes.trim() || undefined,
      paymentMethod: "cash",
    });
    setTitle("");
    setDescription("");
    setPrice("");
    setNotes("");
    setFormError(null);
    onOpenChange(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "rgba(15,23,42,0.42)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={() => onOpenChange(false)}
    >
      <div
        style={{
          width: "min(520px, 100%)",
          borderRadius: 16,
          background: "var(--k-surface)",
          border: "1px solid var(--k-border)",
          boxShadow: "var(--k-e3)",
          padding: 20,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 className="k-display-m" style={{ margin: 0, fontSize: 22 }}>
              Envoyer une offre finale
            </h2>
            <p className="k-body-m" style={{ color: "var(--k-text-muted)", margin: "4px 0 0" }}>
              À utiliser après discussion avec le client.
            </p>
          </div>
          <button
            aria-label="Fermer"
            onClick={() => onOpenChange(false)}
            style={{ border: 0, background: "transparent", cursor: "pointer" }}
          >
            <I.x size={20} />
          </button>
        </div>
        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <input
            className="k-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Service convenu"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description courte"
            rows={3}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: "1px solid var(--k-border)",
              background: "var(--k-surface)",
              color: "var(--k-text-primary)",
              font: "inherit",
              resize: "vertical",
            }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input
              className="k-input"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Prix en FC"
            />
            <input
              className="k-input"
              inputMode="decimal"
              value={durationHours}
              onChange={(e) => {
                setDurationHours(e.target.value);
                setFormError(null);
              }}
              placeholder="Durée en heures"
            />
          </div>
          <input
            className="k-input"
            type="datetime-local"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 150px", gap: 10 }}>
            <input
              className="k-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Adresse"
            />
            <input
              className="k-input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ville"
            />
          </div>
          <input
            className="k-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes internes ou précision"
          />
        </div>
        {formError && (
          <div
            role="alert"
            className="k-caption"
            style={{
              marginTop: 12,
              color: "#BE123C",
              background: "var(--k-danger-subtle)",
              borderRadius: 10,
              padding: "9px 12px",
            }}
          >
            {formError}
          </div>
        )}
        <div
          className="k-caption"
          style={{
            marginTop: 14,
            padding: "10px 12px",
            borderRadius: 10,
            background: "var(--k-surface-primary)",
            color: "var(--k-text-body)",
          }}
        >
          Paiement en espèces à la fin de la mission.
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button
            className="k-btn k-btn-secondary"
            style={{ flex: 1 }}
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </button>
          <button
            className="k-btn k-btn-primary"
            style={{ flex: 1 }}
            disabled={busy || !title.trim() || !price.trim()}
            onClick={submit}
          >
            Envoyer l'offre
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ m, myId }: { m: Message; myId: string | null }) {
  const isMe = !!myId && m.senderId === myId;
  const at = formatBubbleTime(m.createdAt);
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isMe ? "flex-end" : "flex-start",
        marginBottom: 6,
      }}
    >
      <div
        style={{
          maxWidth: "78%",
          background: isMe ? "var(--k-primary)" : "var(--k-surface)",
          color: isMe ? "white" : "var(--k-text-primary)",
          border: isMe ? 0 : "1px solid var(--k-border)",
          borderRadius: 18,
          borderBottomRightRadius: isMe ? 6 : 18,
          borderBottomLeftRadius: isMe ? 18 : 6,
          padding: "10px 14px",
          fontSize: 14.5,
          lineHeight: 1.45,
          boxShadow: isMe ? "0 2px 8px rgba(14,165,233,0.2)" : "var(--k-e1)",
        }}
      >
        {m.content}
        <div
          style={{
            fontSize: 11,
            color: isMe ? "rgba(255,255,255,0.7)" : "var(--k-text-subtle)",
            marginTop: 4,
            textAlign: "right",
            fontFamily: "var(--k-font-mono)",
          }}
        >
          {at}
        </div>
      </div>
    </div>
  );
}
