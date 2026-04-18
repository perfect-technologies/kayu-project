"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Chip, I } from "@kayu/ui/web";

type ThreadStatus = "active" | "quote" | "completed";
type MsgFrom = "me" | "pro" | "system";

type DemoMsg = {
  id: string;
  from: MsgFrom;
  text: string;
  at: string;
};

type DemoThread = {
  id: string;
  providerId: string;
  providerName: string;
  profession: string;
  avatarBg: string;
  initials: string;
  online: boolean;
  unread: number;
  lastAt: string;
  status: ThreadStatus;
  missionSummary?: string;
  missionBookingId?: string;
  preview: string;
  messages: DemoMsg[];
};

const SUGGESTED_REPLIES = [
  "Merci beaucoup !",
  "Pouvez-vous m'envoyer un devis ?",
  "À quelle heure serez-vous disponible ?",
  "Ça marche pour moi.",
];

const DEMO_THREADS: DemoThread[] = [
  {
    id: "t1",
    providerId: "p1",
    providerName: "Jean Mubake",
    profession: "Plombier",
    avatarBg: "#0EA5E9",
    initials: "JM",
    online: true,
    unread: 2,
    lastAt: "à l'instant",
    status: "active",
    missionSummary: "Mission confirmée · demain 9h00",
    missionBookingId: "b_demo_1",
    preview: "D'accord, je passe demain à 9h. Préparez les clés.",
    messages: [
      { id: "m1", from: "pro", text: "Bonjour ! J'ai vu votre demande. Pouvez-vous me décrire la fuite ?", at: "14:12" },
      { id: "m2", from: "me", text: "Salut Jean. C'est sous l'évier de la cuisine, ça goutte depuis ce matin.", at: "14:15" },
      { id: "m3", from: "me", text: "J'ai mis un seau en dessous pour le moment.", at: "14:15" },
      { id: "m4", from: "pro", text: "Pas de souci. Ce genre de fuite se règle vite, souvent un joint à changer.", at: "14:18" },
      { id: "m5", from: "system", text: "Réservation confirmée · demain 9h00 · 15 000 FC estimé", at: "14:22" },
      { id: "m6", from: "pro", text: "D'accord, je passe demain à 9h. Préparez les clés.", at: "14:22" },
    ],
  },
  {
    id: "t2",
    providerId: "p4",
    providerName: "Lucie Ngalamulume",
    profession: "Coiffeuse",
    avatarBg: "#FB7185",
    initials: "LN",
    online: false,
    unread: 0,
    lastAt: "il y a 2h",
    status: "completed",
    preview: "Merci pour la super coiffure ! À très vite 💛",
    messages: [
      { id: "m1", from: "me", text: "Merci Lucie, tu as fait un travail super.", at: "11:40" },
      { id: "m2", from: "pro", text: "Merci pour la super coiffure ! À très vite 💛", at: "12:05" },
    ],
  },
  {
    id: "t3",
    providerId: "p2",
    providerName: "Patrick Kabongo",
    profession: "Électricien",
    avatarBg: "#F59E0B",
    initials: "PK",
    online: true,
    unread: 0,
    lastAt: "hier",
    status: "quote",
    preview: "Je vous envoie un devis ce soir.",
    messages: [
      { id: "m1", from: "me", text: "Bonjour, j'ai 3 prises à remplacer dans le salon.", at: "hier 18:03" },
      { id: "m2", from: "pro", text: "Bonjour ! Je vous envoie un devis ce soir.", at: "hier 18:10" },
    ],
  },
  {
    id: "t4",
    providerId: "p6",
    providerName: "Sarah Mokonzi",
    profession: "Jardinière",
    avatarBg: "#10B981",
    initials: "SM",
    online: false,
    unread: 0,
    lastAt: "lun.",
    status: "completed",
    preview: "Parfait, à jeudi alors !",
    messages: [
      { id: "m1", from: "me", text: "Parfait, à jeudi alors !", at: "lun. 10:22" },
    ],
  },
];

type FilterKey = "all" | "unread" | "active";

const FILTERS: { k: FilterKey; label: string }[] = [
  { k: "all", label: "Tous" },
  { k: "unread", label: "Non lus" },
  { k: "active", label: "En cours" },
];

export function MessagesClient() {
  const [activeId, setActiveId] = useState<string | null>(DEMO_THREADS[0]?.id ?? null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [threads, setThreads] = useState<DemoThread[]>(DEMO_THREADS);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return threads.filter((t) => {
      if (filter === "unread" && t.unread === 0) return false;
      if (filter === "active" && t.status !== "active") return false;
      if (q && !t.providerName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [threads, filter, query]);

  const active = threads.find((t) => t.id === activeId) ?? null;

  const handleSend = (threadId: string, text: string) => {
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? {
              ...t,
              preview: text,
              lastAt: "maintenant",
              messages: [
                ...t.messages,
                { id: `x${t.messages.length + 1}`, from: "me", text, at: "maintenant" },
              ],
            }
          : t,
      ),
    );
  };

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
          <h1
            className="k-display-m"
            style={{ margin: "0 0 12px", fontSize: 24 }}
          >
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
          {filtered.length === 0 ? (
            <EmptyList />
          ) : (
            filtered.map((t) => (
              <ThreadListItem
                key={t.id}
                thread={t}
                active={t.id === activeId}
                onClick={() => setActiveId(t.id)}
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
          <ThreadView thread={active} onSend={(text) => handleSend(active.id, text)} />
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

function ThreadListItem({
  thread,
  active,
  onClick,
}: {
  thread: DemoThread;
  active: boolean;
  onClick: () => void;
}) {
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
      <Avatar
        name={thread.providerName}
        bg={thread.avatarBg}
        size={44}
        initials={thread.initials}
        online={thread.online}
      />
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
            {thread.providerName}
          </span>
          <span
            className="k-caption"
            style={{ flexShrink: 0, color: "var(--k-text-muted)" }}
          >
            {thread.lastAt}
          </span>
        </div>
        <div
          className="k-caption"
          style={{ color: "var(--k-text-muted)", marginTop: 1 }}
        >
          {thread.profession}
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 13,
            lineHeight: 1.4,
            color: thread.unread
              ? "var(--k-text-primary)"
              : "var(--k-text-muted)",
            fontWeight: thread.unread ? 500 : 400,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
          }}
        >
          {thread.preview}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 6,
          }}
        >
          {thread.status === "active" && (
            <Chip size="sm" variant="success">
              Mission en cours
            </Chip>
          )}
          {thread.status === "quote" && (
            <Chip size="sm" variant="warning">
              Devis en attente
            </Chip>
          )}
          {thread.status === "completed" && (
            <Chip size="sm" variant="neutral">
              Terminé
            </Chip>
          )}
          {thread.unread > 0 && (
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
              {thread.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function EmptyList() {
  return (
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
  );
}

function ThreadView({
  thread,
  onSend,
}: {
  thread: DemoThread;
  onSend: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread.id, thread.messages.length]);

  const trimmed = draft.trim();
  const canSend = trimmed.length > 0;

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
          <Avatar
            name={thread.providerName}
            bg={thread.avatarBg}
            size={40}
            initials={thread.initials}
            online={thread.online}
          />
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
              {thread.providerName}
            </div>
            <div
              className="k-caption"
              style={{
                color: thread.online
                  ? "var(--k-success)"
                  : "var(--k-text-muted)",
              }}
            >
              {thread.online ? "En ligne" : "Vu il y a 20 min"}
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

      {/* Mission banner */}
      {thread.status === "active" && (
        <div
          style={{
            padding: "10px 20px",
            background: "var(--k-surface-primary)",
            borderBottom: "1px solid #BAE6FD",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 13,
            color: "var(--k-primary-hover)",
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          <I.calendar size={14} />
          <span style={{ flex: 1 }}>
            {thread.missionSummary ?? "Mission en cours"}
          </span>
          {thread.missionBookingId && (
            <a
              href={`/bookings/${thread.missionBookingId}`}
              style={{
                color: "var(--k-primary-hover)",
                fontWeight: 600,
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              Voir
            </a>
          )}
        </div>
      )}

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
        {thread.messages.map((m) => (
          <MessageBubble key={m.id} m={m} />
        ))}
      </div>

      {/* Suggested replies */}
      {thread.status === "active" && (
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
              style={{
                flexShrink: 0,
                padding: "8px 14px",
                borderRadius: 999,
                border: "1px solid var(--k-border)",
                background: "var(--k-surface)",
                fontSize: 13,
                color: "var(--k-text-body)",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

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

function MessageBubble({ m }: { m: DemoMsg }) {
  if (m.from === "system") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          margin: "12px 0",
        }}
      >
        <div
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            background: "var(--k-success-subtle)",
            color: "#047857",
            fontSize: 12.5,
            fontWeight: 500,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            border: "1px solid #A7F3D0",
          }}
        >
          <I.check size={13} /> {m.text}
        </div>
      </div>
    );
  }

  const isMe = m.from === "me";
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
          boxShadow: isMe
            ? "0 2px 8px rgba(14,165,233,0.2)"
            : "var(--k-e1)",
        }}
      >
        {m.text}
        <div
          style={{
            fontSize: 11,
            color: isMe ? "rgba(255,255,255,0.7)" : "var(--k-text-subtle)",
            marginTop: 4,
            textAlign: "right",
            fontFamily: "var(--k-font-mono)",
          }}
        >
          {m.at}
        </div>
      </div>
    </div>
  );
}
