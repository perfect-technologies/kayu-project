// MyBookings — client's bookings list, web + mobile.
// Filter tabs (À venir / En cours / Terminées / Annulées), status chips,
// tap → re-enters the thread or review flow.

const BOOKINGS = [
  {
    id: "b1", providerId: "p1", status: "upcoming",
    service: "Réparation fuite sous évier",
    when: "Demain · 09:00", whenShort: "Demain",
    address: "Av. Kasa-Vubu 42, Gombe",
    price: 15000, priceLabel: "Estimation",
    createdAt: "Il y a 2h",
  },
  {
    id: "b2", providerId: "p2", status: "active",
    service: "Remplacement 3 prises salon",
    when: "Aujourd'hui · 14:30", whenShort: "Aujourd'hui",
    address: "Av. de l'Université 11, Lemba",
    price: 24000, priceLabel: "Devis validé",
    createdAt: "Il y a 3 jours",
    progress: "En route · arrivée dans ~15 min",
  },
  {
    id: "b3", providerId: "p4", status: "completed",
    service: "Coiffure à domicile — tresses",
    when: "Sam. 12 avril · 10:00", whenShort: "12 avril",
    address: "Bld. Katuba 89, Kamalondo",
    price: 18000, priceLabel: "Payé via M-Pesa",
    createdAt: "Il y a 5 jours",
    reviewed: false,
  },
  {
    id: "b4", providerId: "p3", status: "completed",
    service: "Peinture salon + couloir",
    when: "Jeu. 3 avril · 08:00", whenShort: "3 avril",
    address: "Rue Makélékélé, Poto-Poto",
    price: 95000, priceLabel: "Payé via Airtel Money",
    createdAt: "Il y a 2 semaines",
    reviewed: true, myRating: 4.8,
  },
  {
    id: "b5", providerId: "p6", status: "cancelled",
    service: "Nettoyage après chantier",
    when: "Mar. 26 mars · 09:00", whenShort: "26 mars",
    address: "Av. de la Nation 5, Makélékélé",
    price: 32000, priceLabel: "Remboursé",
    createdAt: "Il y a 3 semaines",
    cancelledBy: "provider",
  },
];

const BOOKING_TABS = [
  { id: "upcoming",  label: "À venir",    match: (b) => b.status === "upcoming" },
  { id: "active",    label: "En cours",   match: (b) => b.status === "active" },
  { id: "completed", label: "Terminées",  match: (b) => b.status === "completed" },
  { id: "cancelled", label: "Annulées",   match: (b) => b.status === "cancelled" },
];

function BookingStatusChip({ status }) {
  if (status === "upcoming") return <span className="k-chip k-chip-sm k-chip-primary">À venir</span>;
  if (status === "active")   return <span className="k-chip k-chip-sm k-chip-success"><span style={{width:6,height:6,borderRadius:"50%",background:"var(--k-success)",display:"inline-block",animation:"kpulse 1.6s ease-in-out infinite"}}/>En cours</span>;
  if (status === "completed") return <span className="k-chip k-chip-sm" style={{background:"var(--k-surface-muted)",color:"var(--k-text-body)"}}>Terminée</span>;
  if (status === "cancelled") return <span className="k-chip k-chip-sm" style={{background:"var(--k-danger-subtle)",color:"#BE123C"}}>Annulée</span>;
  return null;
}

function BookingCard({ b, onClick, mobile }) {
  const p = PROVIDERS.find(x => x.id === b.providerId);
  if (!p) return null;
  const portfolio = PORTFOLIO_BG[(p.categories[0]) || "plomberie"];

  return (
    <button onClick={onClick} style={{
      display: "block", width: "100%", textAlign: "left",
      background: "white", border: "1px solid var(--k-border-subtle)",
      borderRadius: 16, padding: mobile ? 14 : 18, cursor: "pointer",
      boxShadow: "0 1px 2px rgba(15,23,42,0.03)",
      transition: "box-shadow 160ms var(--k-ease-std), transform 120ms",
    }}
    onMouseOver={(e) => e.currentTarget.style.boxShadow = "0 8px 24px -12px rgba(15,23,42,0.12)"}
    onMouseOut={(e) => e.currentTarget.style.boxShadow = "0 1px 2px rgba(15,23,42,0.03)"}>

      {/* Header row: date + status */}
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap: 10, marginBottom: 12}}>
        <div style={{display:"flex", alignItems:"center", gap: 8}}>
          <I.calendar size={14} color="var(--k-text-muted)"/>
          <span style={{fontFamily:"var(--k-font-body)", fontSize: 13, fontWeight: 500, color:"var(--k-text-body)"}}>
            {b.when}
          </span>
        </div>
        <BookingStatusChip status={b.status}/>
      </div>

      {/* Body: service + provider */}
      <div style={{display:"flex", gap: 12, alignItems:"flex-start"}}>
        <div style={{
          width: 56, height: 56, borderRadius: 12, flexShrink: 0, position:"relative",
          background: portfolio.bg,
          backgroundImage: `radial-gradient(circle at 25% 25%, ${portfolio.accent}2a 0%, transparent 60%)`,
          display:"flex", alignItems:"center", justifyContent:"center", color: portfolio.accent,
        }}>
          <portfolio.icon size={24}/>
        </div>
        <div style={{flex:1, minWidth: 0}}>
          <div style={{fontFamily:"var(--k-font-display)", fontWeight: 600, fontSize: 15.5, color:"var(--k-text-primary)", lineHeight: 1.3}}>
            {b.service}
          </div>
          <div style={{display:"flex", alignItems:"center", gap: 6, marginTop: 4}}>
            <Avatar name={`${p.firstName} ${p.lastName}`} bg={p.avatarBg} size={18} initials={p.initials}/>
            <span className="k-body-m" style={{color:"var(--k-text-muted)", fontSize: 13}}>
              {p.firstName} {p.lastName}
            </span>
            {p.verified && <I.badgeCheck size={12} color="var(--k-success)"/>}
          </div>
          <div className="k-caption" style={{color:"var(--k-text-muted)", marginTop: 4, display:"flex", alignItems:"center", gap: 4}}>
            <I.mapPin size={11}/> {b.address}
          </div>
        </div>
      </div>

      {/* Footer: progress (if active) or price */}
      {b.progress && (
        <div style={{
          marginTop: 12, padding: "10px 12px",
          background: "var(--k-success-subtle)", borderRadius: 10,
          display: "flex", alignItems: "center", gap: 8,
          fontSize: 13, color: "#047857", fontWeight: 500,
        }}>
          <I.mapPin size={14}/>
          {b.progress}
        </div>
      )}
      <div style={{
        marginTop: 12, paddingTop: 12, borderTop: "1px dashed var(--k-border-subtle)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
      }}>
        <div>
          <span className="k-price" style={{fontSize: 15, color:"var(--k-text-primary)"}}>
            {b.price.toLocaleString("fr-FR")} FC
          </span>
          <span className="k-caption" style={{marginLeft: 6, color:"var(--k-text-muted)"}}>· {b.priceLabel}</span>
        </div>
        {b.status === "completed" && !b.reviewed && (
          <span style={{fontSize: 12.5, fontWeight: 600, color: "var(--k-primary-hover)", display:"inline-flex", alignItems:"center", gap: 4}}>
            Laisser un avis <I.arrowRight size={12}/>
          </span>
        )}
        {b.status === "completed" && b.reviewed && (
          <span style={{display:"inline-flex", alignItems:"center", gap: 4, color:"var(--k-warning)", fontSize: 12.5, fontWeight: 600}}>
            <I.star size={12}/> <span className="k-num" style={{color:"var(--k-text-primary)"}}>{b.myRating}</span>
          </span>
        )}
        {b.status === "cancelled" && (
          <span className="k-caption" style={{color:"var(--k-text-muted)"}}>
            {b.cancelledBy === "provider" ? "Par le pro" : "Par vous"}
          </span>
        )}
      </div>
    </button>
  );
}

function EmptyBookings({ tabId, onBrowse }) {
  const copy = {
    upcoming:  { t: "Aucune réservation à venir", s: "Quand vous réservez un pro, il apparaîtra ici.", cta: "Trouver un pro" },
    active:    { t: "Rien en cours", s: "Les missions actives apparaissent ici, avec le suivi en temps réel.", cta: "Parcourir les catégories" },
    completed: { t: "Pas encore de missions terminées", s: "Votre historique vit ici.", cta: "Réserver un pro" },
    cancelled: { t: "Aucune annulation", s: "Bon signe — tout roule.", cta: null },
  }[tabId];
  return (
    <div style={{padding: "48px 24px", textAlign:"center"}}>
      <div style={{
        width: 64, height: 64, borderRadius: 20, margin: "0 auto 16px",
        background: "var(--k-surface-primary)", color: "var(--k-primary)",
        display: "flex", alignItems:"center", justifyContent:"center",
      }}><I.calendar size={28}/></div>
      <div style={{fontFamily:"var(--k-font-display)", fontWeight: 600, fontSize: 17, marginBottom: 6}}>{copy.t}</div>
      <div className="k-body-m" style={{color:"var(--k-text-muted)", maxWidth: 280, margin: "0 auto 18px"}}>{copy.s}</div>
      {copy.cta && (
        <button className="k-btn k-btn-primary" onClick={onBrowse}>{copy.cta}</button>
      )}
    </div>
  );
}

function MyBookings({ nav, mobile }) {
  const [tab, setTab] = React.useState("upcoming");
  const filtered = BOOKINGS.filter(BOOKING_TABS.find(t => t.id === tab).match);

  const onBookingClick = (b) => {
    return nav("detail", b.id);
  };

  if (mobile) {
    return (
      <div style={{paddingBottom: 110}}>
        {/* Mobile header */}
        <div style={{
          padding: "18px 20px 8px", background: "var(--k-bg)",
          position: "sticky", top: 0, zIndex: 5,
        }}>
          <h1 style={{fontFamily:"var(--k-font-display)", fontSize: 28, fontWeight: 700, letterSpacing:"-0.02em", margin:0}}>
            Mes réservations
          </h1>
        </div>

        {/* Scrollable tabs */}
        <div className="k-scroll" style={{
          display:"flex", gap: 8, padding: "8px 20px 16px", overflowX:"auto",
          position: "sticky", top: 64, background: "var(--k-bg)", zIndex: 4,
        }}>
          {BOOKING_TABS.map(t => {
            const count = BOOKINGS.filter(t.match).length;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flexShrink: 0, padding: "8px 14px", borderRadius: 999,
                border: `1px solid ${active ? "var(--k-text-primary)" : "var(--k-border)"}`,
                background: active ? "var(--k-text-primary)" : "white",
                color: active ? "white" : "var(--k-text-body)",
                fontSize: 13.5, fontWeight: 600, fontFamily: "var(--k-font-body)",
                cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
              }}>
                {t.label}
                {count > 0 && <span className="k-num" style={{
                  fontSize: 11, padding: "1px 6px", borderRadius: 999,
                  background: active ? "rgba(255,255,255,0.25)" : "var(--k-surface-muted)",
                  color: active ? "white" : "var(--k-text-muted)",
                }}>{count}</span>}
              </button>
            );
          })}
        </div>

        {/* List */}
        <div style={{padding: "0 20px", display: "flex", flexDirection: "column", gap: 12}}>
          {filtered.length === 0
            ? <EmptyBookings tabId={tab} onBrowse={() => nav("search")}/>
            : filtered.map(b => <BookingCard key={b.id} b={b} onClick={() => onBookingClick(b)} mobile={true}/>)}
        </div>
      </div>
    );
  }

  // WEB
  return (
    <div style={{maxWidth: 960, margin: "0 auto", padding: "32px 32px 48px"}}>
      <div style={{marginBottom: 24}}>
        <h1 className="k-display-m" style={{margin: "0 0 6px"}}>Mes réservations</h1>
        <div className="k-body-m" style={{color:"var(--k-text-muted)"}}>
          Vos missions passées, en cours et à venir — avec suivi temps réel et reçus.
        </div>
      </div>

      {/* Desktop tabs */}
      <div style={{
        display:"flex", gap: 2, borderBottom: "1px solid var(--k-border)",
        marginBottom: 24,
      }}>
        {BOOKING_TABS.map(t => {
          const count = BOOKINGS.filter(t.match).length;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "12px 18px", borderRadius: 0, border: 0, background: "transparent",
              borderBottom: `2px solid ${active ? "var(--k-primary)" : "transparent"}`,
              color: active ? "var(--k-text-primary)" : "var(--k-text-muted)",
              fontFamily: "var(--k-font-body)", fontSize: 14, fontWeight: active ? 600 : 500,
              cursor: "pointer", marginBottom: -1, display: "inline-flex", alignItems: "center", gap: 8,
            }}>
              {t.label}
              {count > 0 && <span className="k-num" style={{
                fontSize: 11, padding: "1px 7px", borderRadius: 999,
                background: active ? "var(--k-primary-subtle)" : "var(--k-surface-muted)",
                color: active ? "var(--k-primary-hover)" : "var(--k-text-muted)",
                fontWeight: 600,
              }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Grid of cards (2-up on web) */}
      {filtered.length === 0 ? (
        <EmptyBookings tabId={tab} onBrowse={() => nav("search")}/>
      ) : (
        <div style={{display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16}}>
          {filtered.map(b => <BookingCard key={b.id} b={b} onClick={() => onBookingClick(b)} mobile={false}/>)}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { MyBookings, BOOKINGS });

// pulse anim
if (!document.getElementById("kpulse-style")) {
  const s = document.createElement("style");
  s.id = "kpulse-style";
  s.textContent = `@keyframes kpulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.85); } }`;
  document.head.appendChild(s);
}
