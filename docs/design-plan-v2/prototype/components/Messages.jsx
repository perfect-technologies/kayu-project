// Messages — inbox + thread view. Web has split layout, mobile uses two screens.

const THREADS = [
  {
    id: "t1", providerId: "p1", unread: 2, lastAt: "à l'instant",
    status: "active", // active booking with this pro
    preview: "D'accord, je passe demain à 9h. Préparez les clés.",
    messages: [
      { id: "m1", from: "pro", text: "Bonjour ! J'ai vu votre demande. Pouvez-vous me décrire la fuite ?", at: "14:12" },
      { id: "m2", from: "me",  text: "Salut Jean. C'est sous l'évier de la cuisine, ça goutte depuis ce matin.", at: "14:15" },
      { id: "m3", from: "me",  text: "J'ai mis un seau en dessous pour le moment.", at: "14:15" },
      { id: "m4", from: "pro", text: "Pas de souci. Ce genre de fuite se règle vite, souvent un joint à changer.", at: "14:18" },
      { id: "m5", from: "system", text: "Réservation confirmée · demain 9h00 · 15 000 FC estimé", at: "14:22" },
      { id: "m6", from: "pro", text: "D'accord, je passe demain à 9h. Préparez les clés.", at: "14:22" },
    ],
  },
  {
    id: "t2", providerId: "p4", unread: 0, lastAt: "il y a 2h",
    status: "completed",
    preview: "Merci pour la super coiffure ! À très vite 💛",
    messages: [
      { id: "m1", from: "me", text: "Merci Lucie, tu as fait un travail super.", at: "11:40" },
      { id: "m2", from: "pro", text: "Merci pour la super coiffure ! À très vite 💛", at: "12:05" },
    ],
  },
  {
    id: "t3", providerId: "p2", unread: 0, lastAt: "hier",
    status: "quote",
    preview: "Je vous envoie un devis ce soir.",
    messages: [
      { id: "m1", from: "me", text: "Bonjour, j'ai 3 prises à remplacer dans le salon.", at: "hier 18:03" },
      { id: "m2", from: "pro", text: "Bonjour ! Je vous envoie un devis ce soir.", at: "hier 18:10" },
    ],
  },
  {
    id: "t4", providerId: "p6", unread: 0, lastAt: "lun.",
    status: "completed",
    preview: "Vous : Parfait, à jeudi alors !",
    messages: [
      { id: "m1", from: "me", text: "Parfait, à jeudi alors !", at: "lun. 10:22" },
    ],
  },
];

const SUGGESTED_REPLIES = [
  "Merci beaucoup !",
  "Pouvez-vous m'envoyer un devis ?",
  "À quelle heure serez-vous disponible ?",
  "Ça marche pour moi.",
];

function ThreadListItem({ thread, active, onClick, mobile }) {
  const p = PROVIDERS.find(x => x.id === thread.providerId);
  if (!p) return null;
  return (
    <button onClick={onClick}
      style={{
        width: "100%", border: 0, background: active ? "var(--k-surface-primary)" : "transparent",
        padding: mobile ? "14px 20px" : "14px 16px",
        display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer",
        borderLeft: active ? "3px solid var(--k-primary)" : "3px solid transparent",
        textAlign: "left",
        borderBottom: "1px solid var(--k-border-subtle)",
      }}>
      <div style={{ position: "relative" }}>
        <Avatar name={`${p.firstName} ${p.lastName}`} bg={p.avatarBg} size={44} initials={p.initials} online={p.online}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 14.5, color: "var(--k-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.firstName} {p.lastName}
          </span>
          <span className="k-caption" style={{ flexShrink: 0, color: "var(--k-text-muted)" }}>{thread.lastAt}</span>
        </div>
        <div className="k-caption" style={{ color: "var(--k-text-muted)", marginTop: 1 }}>{p.profession}</div>
        <div style={{
          marginTop: 4, fontSize: 13, lineHeight: 1.4,
          color: thread.unread ? "var(--k-text-primary)" : "var(--k-text-muted)",
          fontWeight: thread.unread ? 500 : 400,
          display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden",
        }}>
          {thread.preview}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
          {thread.status === "active" && <span className="k-chip k-chip-sm k-chip-success">Mission en cours</span>}
          {thread.status === "quote" && <span className="k-chip k-chip-sm k-chip-warning">Devis en attente</span>}
          {thread.status === "completed" && <span className="k-chip k-chip-sm">Terminé</span>}
          {thread.unread > 0 && (
            <span style={{
              marginLeft: "auto",
              background: "var(--k-primary)", color: "white",
              fontSize: 11, fontWeight: 700, fontFamily: "var(--k-font-mono)",
              padding: "2px 8px", borderRadius: 999, minWidth: 20, textAlign: "center",
            }}>{thread.unread}</span>
          )}
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ m }) {
  if (m.from === "system") {
    return (
      <div style={{ display: "flex", justifyContent: "center", margin: "12px 0" }}>
        <div style={{
          padding: "8px 14px", borderRadius: 999,
          background: "var(--k-success-subtle)", color: "#047857",
          fontSize: 12.5, fontWeight: 500,
          display: "inline-flex", alignItems: "center", gap: 6,
          border: "1px solid #A7F3D0",
        }}>
          <I.check size={13}/> {m.text}
        </div>
      </div>
    );
  }
  const isMe = m.from === "me";
  return (
    <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 6 }}>
      <div style={{
        maxWidth: "78%",
        background: isMe ? "var(--k-primary)" : "var(--k-surface)",
        color: isMe ? "white" : "var(--k-text-primary)",
        border: isMe ? 0 : "1px solid var(--k-border)",
        borderRadius: 18,
        borderBottomRightRadius: isMe ? 6 : 18,
        borderBottomLeftRadius: isMe ? 18 : 6,
        padding: "10px 14px",
        fontSize: 14.5, lineHeight: 1.45,
        boxShadow: isMe ? "0 2px 8px rgba(14,165,233,0.2)" : "var(--k-e1)",
      }}>
        {m.text}
        <div style={{
          fontSize: 11, color: isMe ? "rgba(255,255,255,0.7)" : "var(--k-text-subtle)",
          marginTop: 4, textAlign: "right",
          fontFamily: "var(--k-font-mono)",
        }}>{m.at}</div>
      </div>
    </div>
  );
}

function ThreadView({ thread, mobile, onBack, nav }) {
  const p = PROVIDERS.find(x => x.id === thread.providerId);
  const [draft, setDraft] = React.useState("");
  const [msgs, setMsgs] = React.useState(thread.messages);

  const send = (text) => {
    if (!text.trim()) return;
    setMsgs([...msgs, { id: `x${msgs.length}`, from: "me", text, at: "maintenant" }]);
    setDraft("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--k-bg)" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: mobile ? "12px 14px" : "14px 20px",
        background: "var(--k-surface)",
        borderBottom: "1px solid var(--k-border-subtle)",
        flexShrink: 0,
      }}>
        {mobile && (
          <button onClick={onBack}
            style={{ border: 0, background: "transparent", padding: 6, marginLeft: -4, cursor: "pointer", color: "var(--k-text-body)" }}>
            <I.arrowLeft size={20}/>
          </button>
        )}
        <button onClick={() => nav("profile", p.id)}
          style={{ display: "flex", alignItems: "center", gap: 10, border: 0, background: "transparent", padding: 0, cursor: "pointer", flex: 1, textAlign: "left" }}>
          <Avatar name={`${p.firstName} ${p.lastName}`} bg={p.avatarBg} size={40} initials={p.initials} online={p.online}/>
          <div>
            <div style={{ fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 15, color: "var(--k-text-primary)" }}>
              {p.firstName} {p.lastName}
            </div>
            <div className="k-caption" style={{ color: p.online ? "var(--k-success)" : "var(--k-text-muted)" }}>
              {p.online ? "En ligne" : "Vu il y a 20 min"}
            </div>
          </div>
        </button>
        <button aria-label="Appeler" style={{ width: 38, height: 38, borderRadius: "50%", border: "1px solid var(--k-border)", background: "var(--k-surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--k-primary-hover)" }}>
          <I.phone size={18}/>
        </button>
      </div>

      {/* Mission banner */}
      {thread.status === "active" && (
        <div style={{
          padding: "10px 20px", background: "var(--k-surface-primary)",
          borderBottom: "1px solid #BAE6FD",
          display: "flex", alignItems: "center", gap: 10,
          fontSize: 13, color: "var(--k-primary-hover)", fontWeight: 500,
        }}>
          <I.calendar size={14}/>
          <span style={{ flex: 1 }}>Mission confirmée · demain 9h00</span>
          <button style={{ border: 0, background: "transparent", color: "var(--k-primary-hover)", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
            Voir
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="k-scroll" style={{ flex: 1, overflowY: "auto", padding: mobile ? "16px 14px" : "20px 24px", background: "var(--k-bg)" }}>
        {msgs.map(m => <MessageBubble key={m.id} m={m}/>)}
      </div>

      {/* Suggested replies */}
      {thread.status === "active" && (
        <div style={{ padding: "8px 14px 0", background: "var(--k-bg)", display: "flex", gap: 8, overflowX: "auto" }} className="k-scroll">
          {SUGGESTED_REPLIES.map(s => (
            <button key={s} onClick={() => send(s)}
              style={{
                flexShrink: 0, padding: "8px 14px", borderRadius: 999,
                border: "1px solid var(--k-border)", background: "var(--k-surface)",
                fontSize: 13, color: "var(--k-text-body)", cursor: "pointer",
                whiteSpace: "nowrap",
              }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <div style={{
        padding: mobile ? "10px 14px 14px" : "12px 20px 16px",
        background: "var(--k-bg)",
        display: "flex", alignItems: "center", gap: 8,
        flexShrink: 0,
      }}>
        <button aria-label="Joindre"
          style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid var(--k-border)", background: "var(--k-surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--k-text-muted)", flexShrink: 0 }}>
          <I.plus size={18}/>
        </button>
        <input value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") send(draft); }}
          placeholder="Écrire un message…"
          style={{
            flex: 1, height: 42, padding: "0 16px",
            borderRadius: 999, border: "1px solid var(--k-border)",
            background: "var(--k-surface)", fontSize: 14.5, outline: "none",
            color: "var(--k-text-primary)",
          }}/>
        <button onClick={() => send(draft)} aria-label="Envoyer"
          disabled={!draft.trim()}
          style={{
            width: 42, height: 42, borderRadius: "50%",
            background: draft.trim() ? "var(--k-primary)" : "var(--k-border)",
            color: "white", border: 0, cursor: draft.trim() ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            boxShadow: draft.trim() ? "0 4px 12px rgba(14,165,233,0.3)" : "none",
          }}>
          <I.send size={17}/>
        </button>
      </div>
    </div>
  );
}

function Messages({ nav, mobile }) {
  const [activeId, setActiveId] = React.useState(mobile ? null : THREADS[0].id);
  const [filter, setFilter] = React.useState("all");
  const threads = THREADS.filter(t => filter === "all" || (filter === "unread" && t.unread > 0) || (filter === "active" && t.status === "active"));
  const active = THREADS.find(t => t.id === activeId);

  // ── Mobile: single-screen (list OR thread) ───────────────────────────
  if (mobile) {
    if (active) {
      return <ThreadView thread={active} mobile onBack={() => setActiveId(null)} nav={nav}/>;
    }
    return (
      <div style={{ paddingBottom: 100 }}>
        <div style={{ padding: "18px 20px 12px", background: "var(--k-bg)" }}>
          <h1 className="k-display-m" style={{ margin: 0 }}>Messages</h1>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {[
              { k: "all", label: "Tous" },
              { k: "unread", label: "Non lus" },
              { k: "active", label: "En cours" },
            ].map(f => (
              <button key={f.k} onClick={() => setFilter(f.k)}
                style={{
                  padding: "8px 14px", borderRadius: 999,
                  border: "1px solid " + (filter === f.k ? "var(--k-text-primary)" : "var(--k-border)"),
                  background: filter === f.k ? "var(--k-text-primary)" : "var(--k-surface)",
                  color: filter === f.k ? "white" : "var(--k-text-body)",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ background: "var(--k-surface)" }}>
          {threads.map(t => (
            <ThreadListItem key={t.id} thread={t} onClick={() => setActiveId(t.id)} mobile/>
          ))}
        </div>
      </div>
    );
  }

  // ── Web: split layout ────────────────────────────────────────────────
  return (
    <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", height: "100%", background: "var(--k-bg)" }}>
      {/* List */}
      <div style={{ borderRight: "1px solid var(--k-border)", background: "var(--k-surface)", display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ padding: "18px 16px 12px", borderBottom: "1px solid var(--k-border-subtle)" }}>
          <h1 className="k-display-m" style={{ margin: "0 0 12px", fontSize: 24 }}>Messages</h1>
          <div style={{ position: "relative" }}>
            <input placeholder="Rechercher…" className="k-input" style={{ paddingLeft: 40, height: 40 }}/>
            <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--k-text-muted)" }}>
              <I.search size={16}/>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            {[
              { k: "all", label: "Tous" },
              { k: "unread", label: "Non lus" },
              { k: "active", label: "En cours" },
            ].map(f => (
              <button key={f.k} onClick={() => setFilter(f.k)}
                style={{
                  padding: "6px 12px", borderRadius: 999,
                  border: "1px solid " + (filter === f.k ? "var(--k-primary)" : "var(--k-border)"),
                  background: filter === f.k ? "var(--k-primary-subtle)" : "transparent",
                  color: filter === f.k ? "var(--k-primary-hover)" : "var(--k-text-body)",
                  fontSize: 12.5, fontWeight: 500, cursor: "pointer",
                }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="k-scroll" style={{ flex: 1, overflowY: "auto" }}>
          {threads.map(t => (
            <ThreadListItem key={t.id} thread={t} active={t.id === activeId} onClick={() => setActiveId(t.id)}/>
          ))}
        </div>
      </div>

      {/* Thread */}
      <div style={{ display: "flex", flexDirection: "column", height: "100%", minWidth: 0 }}>
        {active ? (
          <ThreadView thread={active} nav={nav}/>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--k-text-muted)" }}>
            Sélectionnez une conversation
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { Messages });
