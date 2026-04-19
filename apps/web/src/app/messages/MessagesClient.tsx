"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { messagesApi, queryKeys } from "@kayu/api";
import type { Conversation, Message, UserSummary } from "@kayu/schemas";
import { Avatar, EmptyState, ErrorState, I } from "@kayu/ui/web";
import { Inbox as InboxIcon } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const SUGGESTED_REPLIES = [
  "Merci beaucoup !",
  "Pouvez-vous m'envoyer un devis ?",
  "À quelle heure serez-vous disponible ?",
  "Ça marche pour moi.",
];

type FilterKey = "all" | "unread" | "active";

const FILTERS: { k: FilterKey; label: string }[] = [
  { k: "all", label: "Tous" },
  { k: "unread", label: "Non lus" },
  { k: "active", label: "En cours" },
];

type ConversationsQueryData = { success?: boolean; conversations: Conversation[] };
type MessagesQueryData = { success?: boolean; messages: Message[] };

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

export function MessagesClient() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
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

  useEffect(() => {
    if (!activeId && conversations.length > 0) {
      setActiveId(conversations[0]!.id);
    }
  }, [conversations, activeId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations.filter((c) => {
      const name = getOtherName(c.otherUser).toLowerCase();
      if (filter === "unread" && (c.unreadCount ?? 0) === 0) return false;
      // "En cours" pill: without a backend status, fall back to unread-bearing threads
      if (filter === "active" && (c.unreadCount ?? 0) === 0) return false;
      if (q && !name.includes(q)) return false;
      return true;
    });
  }, [conversations, filter, query]);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  const {
    data: msgData,
    isLoading: msgLoading,
    error: msgError,
    refetch: refetchMsgs,
  } = useQuery<MessagesQueryData>({
    queryKey: queryKeys.messages.conversation(activeId ?? ""),
    queryFn: () =>
      messagesApi(apiClient).getMessages(activeId!) as Promise<MessagesQueryData>,
    enabled: !!activeId,
    refetchInterval: 5_000,
  });

  const messages = msgData?.messages ?? [];

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
        height: "calc(100vh - 4rem)",
        background: "var(--k-bg)",
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
        <div className="k-scroll" style={{ flex: 1, overflowY: "auto" }}>
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
          ) : conversations.length === 0 ? (
            <EmptyState
              icon={InboxIcon}
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
        }}
      >
        {active ? (
          <ThreadView
            conversation={active}
            messages={messages}
            isLoading={msgLoading}
            error={msgError}
            onRetry={() => refetchMsgs()}
            myId={user?.id ?? null}
            onSend={(text) => sendMut.mutate(text)}
            sending={sendMut.isPending}
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
  isLoading,
  error,
  onRetry,
  myId,
  onSend,
  sending,
}: {
  conversation: Conversation;
  messages: Message[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  myId: string | null;
  onSend: (text: string) => void;
  sending: boolean;
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conversation.id, messages.length]);

  const trimmed = draft.trim();
  const canSend = trimmed.length > 0 && !sending;
  const name = getOtherName(conversation.otherUser);

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
        <button
          title="Appeler"
          aria-label="Appeler"
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            border: "1px solid var(--k-border)",
            background: "var(--k-surface)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--k-primary-hover)",
            flexShrink: 0,
          }}
        >
          <I.phone size={18} />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="k-scroll"
        style={{
          flex: 1,
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
        ) : messages.length === 0 ? (
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
          messages.map((m) => <MessageBubble key={m.id} m={m} myId={myId} />)
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
