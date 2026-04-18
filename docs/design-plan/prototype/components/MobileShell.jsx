// Airbnb-inspired mobile helpers — keeps the KAYOU visual language, just
// borrows the information architecture (bottom tabs, photo-forward cards,
// sticky search, sticky price bar, shrinking headers).

// Bottom tab bar — floating pill style, always visible.
// Routes "bookings"/"messages"/"profile" tabs back to "home" since they're
// placeholders for a wider product.
function MobileTabBar({ activeScreen, nav }) {
  const tabs = [
    { id: "home",     label: "Accueil",   icon: I.home,        target: "home" },
    { id: "search",   label: "Rechercher", icon: I.search,      target: "search" },
    { id: "bookings", label: "Réservations", icon: I.calendar,    target: "home" },
    { id: "messages", label: "Messages",  icon: I.inbox,       target: "home" },
    { id: "profile",  label: "Moi",       icon: I.user,        target: "home" },
  ];
  // Treat "profile" screen as visually belonging to the search tab; "booking" → none.
  const bookingLike = activeScreen === "booking";
  const computed = activeScreen === "profile" ? "search" : activeScreen;

  return (
    <div style={{
      position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 30,
      padding: "8px 10px 14px",
      background: "linear-gradient(to top, var(--k-bg) 70%, rgba(250,250,249,0))",
      pointerEvents: "none",
    }}>
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "white", borderRadius: 999, padding: "6px 8px",
        boxShadow: "0 10px 32px -10px rgba(15,23,42,0.28), 0 2px 6px -2px rgba(15,23,42,0.08)",
        pointerEvents: "auto",
      }}>
        {tabs.map(t => {
          const active = !bookingLike && t.id === computed;
          return (
            <button
              key={t.id}
              onClick={() => nav(t.target)}
              aria-label={t.label}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                padding: "10px 6px",
                borderRadius: 999, border: 0, cursor: "pointer",
                background: active ? "var(--k-primary)" : "transparent",
                color: active ? "white" : "var(--k-text-muted)",
                transition: "all 240ms var(--k-ease-std)",
                minWidth: 0,
              }}
            >
              <t.icon size={20} stroke={active ? 2 : 1.75}/>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// Photo-forward featured card (Airbnb listing style).
// Uses an abstract "work" tile instead of a real photo (no placeholder image dep).
function FeaturedProviderCard({ p, onClick, favorited, onFavorite }) {
  const portfolio = PORTFOLIO_BG[(p.categories[0]) || "plomberie"];
  return (
    <article onClick={onClick} style={{
      display: "flex", flexDirection: "column",
      cursor: "pointer", scrollSnapAlign: "start", flexShrink: 0,
      width: "78%", maxWidth: 320,
      background: "white",
      borderRadius: 20, overflow: "hidden",
      boxShadow: "0 8px 28px -10px rgba(15,23,42,0.16), 0 2px 6px -2px rgba(15,23,42,0.06)",
    }}>
      {/* Photo area */}
      <div style={{
        position: "relative", aspectRatio: "4 / 5",
        background: portfolio.bg,
        backgroundImage: `radial-gradient(circle at 20% 15%, ${portfolio.accent}22 0%, transparent 55%), radial-gradient(circle at 80% 85%, ${portfolio.accent}18 0%, transparent 50%), repeating-linear-gradient(135deg, transparent 0, transparent 18px, ${portfolio.accent}14 18px, ${portfolio.accent}14 19px)`,
      }}>
        {/* Specialty label pinned top-left */}
        <div style={{
          position: "absolute", top: 12, left: 12,
          background: "rgba(255,255,255,0.92)", backdropFilter: "blur(6px)",
          borderRadius: 999, padding: "5px 10px",
          fontFamily: "var(--k-font-mono)", fontSize: 10, fontWeight: 600,
          color: portfolio.accent, letterSpacing: "0.04em",
          display: "inline-flex", alignItems: "center", gap: 4,
        }}>
          <portfolio.icon size={11}/> {portfolio.label}
        </div>

        {/* Heart top-right */}
        {onFavorite && (
          <button onClick={(e) => { e.stopPropagation(); onFavorite(p.id); }} style={{
            position: "absolute", top: 10, right: 10,
            border: 0, background: "transparent", padding: 6, cursor: "pointer",
            color: favorited ? "var(--k-accent)" : "white",
            filter: favorited ? "none" : "drop-shadow(0 1px 2px rgba(0,0,0,0.35))",
          }}>
            <I.heart size={22} fill={favorited ? "currentColor" : "rgba(15,23,42,0.25)"} stroke={2}/>
          </button>
        )}

        {/* Top-rated pill bottom-left */}
        {p.topRated && (
          <div style={{
            position: "absolute", left: 12, bottom: 12,
            background: "rgba(15,23,42,0.88)", color: "white",
            padding: "5px 10px", borderRadius: 999,
            fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5,
          }}>
            <I.award size={11}/> Top rated
          </div>
        )}

        {/* Avatar overlap bottom-right */}
        <div style={{ position: "absolute", right: 12, bottom: 12 }}>
          <Avatar name={`${p.firstName} ${p.lastName}`} bg={p.avatarBg} size={42} initials={p.initials} online={p.online}/>
        </div>
      </div>

      {/* Meta */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
            <span style={{
              fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 16,
              color: "var(--k-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{p.firstName} {p.lastName}</span>
            {p.verified && <I.badgeCheck size={14} color="var(--k-success)"/>}
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "var(--k-warning)", flexShrink: 0 }}>
            <I.star size={13}/>
            <span className="k-num" style={{ color: "var(--k-text-primary)", fontWeight: 600, fontSize: 13 }}>{p.rating.toFixed(1)}</span>
          </span>
        </div>
        <div className="k-body-m" style={{ color: "var(--k-text-muted)", marginTop: 1 }}>
          {p.profession} · {p.commune}
        </div>
        <div className="k-caption" style={{ color: "var(--k-text-muted)", marginTop: 4 }}>
          Répond en ~{p.response}
        </div>
        <div style={{ marginTop: 8 }}>
          <span className="k-price" style={{ fontSize: 15, color: "var(--k-text-primary)" }}>
            {p.hourly.toLocaleString("fr-FR")} FC
          </span>
          <span style={{ color: "var(--k-text-muted)", fontSize: 14 }}> /h</span>
        </div>
      </div>
    </article>
  );
}

// List-style nearby row — photo left, meta right.
function NearbyRow({ p, onClick, favorited, onFavorite, last }) {
  const portfolio = PORTFOLIO_BG[(p.categories[0]) || "plomberie"];
  return (
    <button onClick={onClick} style={{
      display: "flex", gap: 12, padding: "12px 0",
      borderBottom: last ? 0 : "1px solid var(--k-border-subtle)",
      background: "transparent", border: 0, cursor: "pointer",
      textAlign: "left", width: "100%", alignItems: "center",
    }}>
      <div style={{
        width: 84, height: 84, borderRadius: 14, overflow: "hidden",
        background: portfolio.bg, flexShrink: 0, position: "relative",
        backgroundImage: `radial-gradient(circle at 25% 25%, ${portfolio.accent}2a 0%, transparent 60%), repeating-linear-gradient(135deg, transparent 0, transparent 12px, ${portfolio.accent}18 12px, ${portfolio.accent}18 13px)`,
        boxShadow: "0 3px 10px -4px rgba(15,23,42,0.14), 0 1px 3px -1px rgba(15,23,42,0.06)",
      }}>
        <div style={{ position: "absolute", left: 6, top: 6, color: portfolio.accent }}>
          <portfolio.icon size={14}/>
        </div>
        <div style={{ position: "absolute", right: 6, bottom: 6 }}>
          <Avatar name={`${p.firstName} ${p.lastName}`} bg={p.avatarBg} size={28} initials={p.initials}/>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{
            fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 15,
          }}>{p.firstName} {p.lastName}</span>
          {p.verified && <I.badgeCheck size={13} color="var(--k-success)"/>}
        </div>
        <div className="k-body-m" style={{ color: "var(--k-text-muted)", marginTop: 1, fontSize: 13 }}>
          {p.profession} · {p.distance} km
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 5 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "var(--k-warning)" }}>
            <I.star size={11}/>
            <span className="k-num" style={{ color: "var(--k-text-primary)", fontWeight: 600, fontSize: 12 }}>{p.rating.toFixed(1)}</span>
            <span className="k-caption" style={{ color: "var(--k-text-muted)" }}>({p.reviews})</span>
          </span>
          <span className="k-caption" style={{ color: p.response.includes("min") ? "var(--k-success)" : "var(--k-text-muted)" }}>~{p.response}</span>
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div className="k-price" style={{ fontSize: 14 }}>{(p.hourly/1000).toFixed(0)}k FC</div>
        <div className="k-caption" style={{ color: "var(--k-text-muted)" }}>/heure</div>
      </div>
    </button>
  );
}

// Category icon scroll row — Airbnb explore header pattern.
function CategoryStrip({ nav, active }) {
  return (
    <div className="k-scroll" style={{
      display: "flex", gap: 28, overflowX: "auto",
      padding: "0 20px 12px", scrollSnapType: "x mandatory",
    }}>
      {CATEGORIES.map(c => {
        const isActive = active === c.slug;
        return (
          <button key={c.slug} onClick={() => nav("search", c.slug)} style={{
            scrollSnapAlign: "start", flexShrink: 0,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            border: 0, background: "transparent", cursor: "pointer", padding: "10px 0 8px",
            borderBottom: `2px solid ${isActive ? "var(--k-text-primary)" : "transparent"}`,
            opacity: isActive ? 1 : 0.64, transition: "opacity 160ms, border-color 160ms",
            minWidth: 52,
          }}>
            <c.icon size={22} stroke={1.75}/>
            <span style={{
              fontFamily: "var(--k-font-body)", fontSize: 11, fontWeight: isActive ? 600 : 500,
              color: "var(--k-text-primary)", whiteSpace: "nowrap",
            }}>{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Data for the abstract "work" backgrounds per category
const PORTFOLIO_BG = {
  plomberie:    { bg: "#EFF6FF", accent: "#0EA5E9", icon: I.wrench,     label: "Plomberie" },
  electricite:  { bg: "#FEF3C7", accent: "#D97706", icon: I.zap,        label: "Électricité" },
  peinture:     { bg: "#EEF2FF", accent: "#4F46E5", icon: I.paintbrush, label: "Peinture" },
  coiffure:     { bg: "#FCE7F3", accent: "#BE185D", icon: I.scissors,   label: "Coiffure" },
  informatique: { bg: "#EDE9FE", accent: "#7C3AED", icon: I.laptop,     label: "Informatique" },
  menage:       { bg: "#FFE4E6", accent: "#E11D48", icon: I.sparkles,   label: "Ménage" },
  jardinage:    { bg: "#D1FAE5", accent: "#059669", icon: I.leaf,       label: "Jardinage" },
  transport:    { bg: "#E2E8F0", accent: "#475569", icon: I.car,        label: "Transport" },
  menuiserie:   { bg: "#FEF3C7", accent: "#B45309", icon: I.hammer,     label: "Menuiserie" },
};

Object.assign(window, { MobileTabBar, FeaturedProviderCard, NearbyRow, CategoryStrip, PORTFOLIO_BG });

// Full-width photo-forward card — for the mobile search results page.
function WideProviderCard({ p, onClick, favorited, onFavorite }) {
  const portfolio = PORTFOLIO_BG[(p.categories[0]) || "plomberie"];
  return (
    <article onClick={onClick} style={{
      display: "flex", flexDirection: "column",
      cursor: "pointer",
      background: "white",
      borderRadius: 20, overflow: "hidden",
      boxShadow: "0 8px 28px -10px rgba(15,23,42,0.16), 0 2px 6px -2px rgba(15,23,42,0.06)",
    }}>
      <div style={{
        position: "relative", aspectRatio: "16 / 11",
        background: portfolio.bg,
        backgroundImage: `radial-gradient(circle at 25% 20%, ${portfolio.accent}26 0%, transparent 55%), radial-gradient(circle at 80% 80%, ${portfolio.accent}1a 0%, transparent 50%), repeating-linear-gradient(135deg, transparent 0, transparent 20px, ${portfolio.accent}12 20px, ${portfolio.accent}12 21px)`,
      }}>
        <div style={{
          position: "absolute", top: 12, left: 12,
          background: "rgba(255,255,255,0.92)", backdropFilter: "blur(6px)",
          borderRadius: 999, padding: "5px 10px",
          fontFamily: "var(--k-font-mono)", fontSize: 10, fontWeight: 600,
          color: portfolio.accent, letterSpacing: "0.04em",
          display: "inline-flex", alignItems: "center", gap: 4,
        }}>
          <portfolio.icon size={11}/> {portfolio.label}
        </div>

        {onFavorite && (
          <button onClick={(e) => { e.stopPropagation(); onFavorite(p.id); }} style={{
            position: "absolute", top: 10, right: 10,
            border: 0, background: "transparent", padding: 6, cursor: "pointer",
            color: favorited ? "var(--k-accent)" : "white",
            filter: favorited ? "none" : "drop-shadow(0 1px 2px rgba(0,0,0,0.35))",
          }}>
            <I.heart size={22} fill={favorited ? "currentColor" : "rgba(15,23,42,0.25)"} stroke={2}/>
          </button>
        )}

        {p.topRated && (
          <div style={{
            position: "absolute", left: 12, bottom: 12,
            background: "rgba(15,23,42,0.88)", color: "white",
            padding: "5px 10px", borderRadius: 999,
            fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5,
          }}>
            <I.award size={11}/> Top rated
          </div>
        )}

        <div style={{ position: "absolute", right: 12, bottom: 12 }}>
          <Avatar name={`${p.firstName} ${p.lastName}`} bg={p.avatarBg} size={44} initials={p.initials} online={p.online}/>
        </div>
      </div>

      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
            <span style={{
              fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 16,
              color: "var(--k-text-primary)",
            }}>{p.firstName} {p.lastName}</span>
            {p.verified && <I.badgeCheck size={14} color="var(--k-success)"/>}
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "var(--k-warning)" }}>
            <I.star size={13}/>
            <span className="k-num" style={{ color: "var(--k-text-primary)", fontWeight: 600, fontSize: 13 }}>{p.rating.toFixed(1)}</span>
            <span className="k-caption" style={{ color: "var(--k-text-muted)" }}>({p.reviews})</span>
          </span>
        </div>
        <div className="k-body-m" style={{ color: "var(--k-text-muted)", marginTop: 1 }}>
          {p.profession} · {p.commune} · {p.distance} km
        </div>
        <div className="k-caption" style={{ color: p.response.includes("min") ? "var(--k-success)" : "var(--k-text-muted)", marginTop: 4 }}>
          Répond en ~{p.response}
        </div>
        <div style={{ marginTop: 6 }}>
          <span className="k-price" style={{ fontSize: 15, color: "var(--k-text-primary)", textDecoration: "underline", textUnderlineOffset: 3 }}>
            {p.hourly.toLocaleString("fr-FR")} FC
          </span>
          <span style={{ color: "var(--k-text-muted)", fontSize: 14 }}> /heure</span>
        </div>
      </div>
    </article>
  );
}

Object.assign(window, { WideProviderCard });
