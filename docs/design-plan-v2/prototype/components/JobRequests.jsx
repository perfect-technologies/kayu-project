// JobRequests — pro-side inbound requests + active jobs.
// Pro's counterpart to MyBookings. Swipeable accept/decline on mobile,
// full-detail sheet on web.

const INCOMING_REQUESTS = [
  {
    id: "r1", clientName: "Marie Kabongo", clientInitials: "MK", clientBg: "#FB7185",
    clientRating: 4.9, clientJobs: 14,
    service: "Fuite sous évier cuisine",
    category: "plomberie",
    when: "Dès que possible · idéalement aujourd'hui",
    address: "Av. Kasa-Vubu 42, Gombe", distance: 2.1,
    estimatedHours: 1.5, budget: 15000,
    description: "L'eau goutte depuis ce matin, j'ai mis un seau. Urgent si possible.",
    photos: 2,
    receivedAt: "il y a 4 min", expires: "27 min",
    competing: 3, // other pros also seeing this
  },
  {
    id: "r2", clientName: "Papa Léon", clientInitials: "PL", clientBg: "#10B981",
    clientRating: 4.7, clientJobs: 23,
    service: "Installation chauffe-eau 80L",
    category: "plomberie",
    when: "Samedi 19 avril · matin",
    address: "Bld. du 30 juin 112, Gombe", distance: 3.4,
    estimatedHours: 3, budget: 45000,
    description: "Chauffe-eau déjà acheté sur place. Besoin d'un raccordement propre et mise en service.",
    photos: 4,
    receivedAt: "il y a 22 min", expires: "2h 03min",
    competing: 1,
  },
  {
    id: "r3", clientName: "Christelle M.", clientInitials: "CM", clientBg: "#7C3AED",
    clientRating: null, clientJobs: 0, newClient: true,
    service: "Débouchage WC + lavabo",
    category: "plomberie",
    when: "Flexible · cette semaine",
    address: "Av. Kabinda 7, Lingwala", distance: 5.8,
    estimatedHours: 1, budget: 12000,
    description: "Deux problèmes dans la même salle de bain. Merci d'apporter matériel de débouchage.",
    photos: 0,
    receivedAt: "il y a 1h", expires: "4h",
    competing: 5,
  },
];

const PRO_ACTIVE_JOBS = [
  {
    id: "j1", clientName: "Joseph Mbuyi", clientInitials: "JM", clientBg: "#F59E0B",
    service: "Remplacement robinetterie cuisine",
    when: "Aujourd'hui · 14:00",
    address: "Av. de la Paix 18, Ngaliema",
    status: "scheduled", // scheduled | enroute | arrived | in_progress
    payout: 28000,
  },
  {
    id: "j2", clientName: "Famille Mutombo", clientInitials: "FM", clientBg: "#0EA5E9",
    service: "Réparation fuite salle de bain",
    when: "Hier · 16:00 — en cours",
    address: "Rue des Écoles 4, Kintambo",
    status: "in_progress",
    payout: 22000,
    startedAt: "hier 16:08",
  },
];

function InboundRequestCard({ r, onAccept, onDecline, onClick, mobile }) {
  const cat = PORTFOLIO_BG[r.category] || PORTFOLIO_BG.plomberie;
  return (
    <article style={{
      background: "white", border: "1px solid var(--k-border-subtle)",
      borderRadius: 18, padding: mobile ? 16 : 20,
      boxShadow: "0 1px 2px rgba(15,23,42,0.03)",
      display: "flex", flexDirection: "column", gap: 14,
    }}>
      {/* Top: client + urgency */}
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap: 12}}>
        <div style={{display:"flex", gap: 10, alignItems:"center", minWidth: 0}}>
          <Avatar name={r.clientName} bg={r.clientBg} size={40} initials={r.clientInitials}/>
          <div style={{minWidth: 0}}>
            <div style={{fontFamily:"var(--k-font-display)", fontWeight: 600, fontSize: 15, color:"var(--k-text-primary)"}}>
              {r.clientName}
            </div>
            <div style={{display:"flex", alignItems:"center", gap: 6, marginTop: 2}}>
              {r.newClient ? (
                <span className="k-chip k-chip-sm" style={{background:"var(--k-accent-subtle)", color:"#BE123C"}}>
                  Nouveau client
                </span>
              ) : (
                <>
                  <I.star size={11} color="var(--k-warning)"/>
                  <span className="k-num" style={{fontSize: 12, fontWeight: 600}}>{r.clientRating.toFixed(1)}</span>
                  <span className="k-caption" style={{color:"var(--k-text-muted)"}}>· {r.clientJobs} missions</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div style={{textAlign:"right", flexShrink: 0}}>
          <div style={{
            display:"inline-flex", alignItems:"center", gap: 4,
            background: "var(--k-warning-subtle)", color: "#B45309",
            padding: "3px 8px", borderRadius: 999,
            fontSize: 11.5, fontWeight: 600, fontFamily: "var(--k-font-mono)",
          }}>
            <I.clock size={11}/> Expire {r.expires}
          </div>
          <div className="k-caption" style={{color:"var(--k-text-muted)", marginTop: 4}}>
            Reçu {r.receivedAt}
          </div>
        </div>
      </div>

      {/* Service summary */}
      <div>
        <div style={{display:"flex", alignItems:"center", gap: 8, marginBottom: 6}}>
          <span style={{
            display:"inline-flex", alignItems:"center", gap: 5,
            background: cat.bg, color: cat.accent,
            padding: "3px 10px", borderRadius: 999,
            fontSize: 11, fontWeight: 600, fontFamily: "var(--k-font-mono)", letterSpacing: "0.04em",
          }}>
            <cat.icon size={11}/> {cat.label}
          </span>
          {r.competing > 1 && (
            <span className="k-caption" style={{color:"var(--k-text-muted)"}}>
              · {r.competing} autres pros
            </span>
          )}
        </div>
        <div style={{fontFamily:"var(--k-font-display)", fontWeight: 600, fontSize: 16.5, lineHeight: 1.3, color:"var(--k-text-primary)"}}>
          {r.service}
        </div>
        <div style={{
          fontSize: 13.5, color: "var(--k-text-body)", marginTop: 6, lineHeight: 1.45,
          display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden",
        }}>
          {r.description}
        </div>
      </div>

      {/* Key facts grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
        padding: "10px 12px", background: "var(--k-bg)", borderRadius: 12,
      }}>
        <div>
          <div className="k-caption" style={{color:"var(--k-text-muted)"}}>Quand</div>
          <div style={{fontSize: 13, fontWeight: 600, color:"var(--k-text-primary)", marginTop: 2}}>{r.when}</div>
        </div>
        <div>
          <div className="k-caption" style={{color:"var(--k-text-muted)"}}>Où</div>
          <div style={{fontSize: 13, fontWeight: 600, color:"var(--k-text-primary)", marginTop: 2}}>
            {r.address.split(",")[1]?.trim() || r.address} · {r.distance} km
          </div>
        </div>
        <div>
          <div className="k-caption" style={{color:"var(--k-text-muted)"}}>Durée estimée</div>
          <div style={{fontSize: 13, fontWeight: 600, color:"var(--k-text-primary)", marginTop: 2}}>
            ~{r.estimatedHours}h
          </div>
        </div>
        <div>
          <div className="k-caption" style={{color:"var(--k-text-muted)"}}>Budget client</div>
          <div className="k-price" style={{fontSize: 14, color:"var(--k-success)", marginTop: 2}}>
            {r.budget.toLocaleString("fr-FR")} FC
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{display:"flex", gap: 10}}>
        <button onClick={(e) => { e.stopPropagation(); onDecline(r.id); }}
          className="k-btn k-btn-secondary" style={{flex: 1}}>
          Refuser
        </button>
        <button onClick={(e) => { e.stopPropagation(); onAccept(r.id); }}
          className="k-btn k-btn-primary" style={{flex: 2}}>
          <I.check size={16}/> Accepter · envoyer devis
        </button>
      </div>
    </article>
  );
}

function ActiveJobRow({ j, onClick, mobile }) {
  const statusCopy = {
    scheduled: { label: "Planifié", color: "var(--k-primary)", bg: "var(--k-primary-subtle)" },
    enroute: { label: "En route", color: "var(--k-warning)", bg: "var(--k-warning-subtle)" },
    arrived: { label: "Sur place", color: "var(--k-success)", bg: "var(--k-success-subtle)" },
    in_progress: { label: "En cours", color: "var(--k-success)", bg: "var(--k-success-subtle)" },
  }[j.status];
  return (
    <button onClick={onClick} style={{
      width: "100%", textAlign:"left", background: "white",
      border: "1px solid var(--k-border-subtle)", borderRadius: 14,
      padding: mobile ? 14 : 16, cursor: "pointer",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <Avatar name={j.clientName} bg={j.clientBg} size={44} initials={j.clientInitials}/>
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{display:"flex", alignItems:"center", gap: 8, marginBottom: 2}}>
          <span style={{fontFamily:"var(--k-font-display)", fontWeight: 600, fontSize: 14.5, color:"var(--k-text-primary)"}}>
            {j.service}
          </span>
        </div>
        <div className="k-caption" style={{color:"var(--k-text-muted)"}}>
          {j.clientName} · {j.when}
        </div>
      </div>
      <div style={{display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0}}>
        <span style={{
          fontSize: 11, fontWeight: 600,
          padding: "3px 10px", borderRadius: 999,
          background: statusCopy.bg, color: statusCopy.color,
        }}>
          {j.status === "in_progress" && <span style={{
            display:"inline-block", width: 5, height: 5, borderRadius:"50%",
            background: statusCopy.color, marginRight: 5, verticalAlign: "middle",
            animation: "kpulse 1.4s ease-in-out infinite",
          }}/>}
          {statusCopy.label}
        </span>
        <span className="k-price" style={{fontSize: 13, color: "var(--k-text-primary)"}}>
          {j.payout.toLocaleString("fr-FR")} FC
        </span>
      </div>
    </button>
  );
}

function JobRequests({ nav, mobile }) {
  const [section, setSection] = React.useState("incoming"); // "incoming" | "active"
  const [dismissed, setDismissed] = React.useState(new Set());

  const visible = INCOMING_REQUESTS.filter(r => !dismissed.has(r.id));
  const handleAccept = (id) => {
    nav("quote", id);
  };
  const handleDecline = (id) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  const HeaderStats = () => (
    <div style={{
      display:"grid", gridTemplateColumns: "repeat(3, 1fr)", gap: mobile ? 8 : 14,
      marginBottom: mobile ? 16 : 24,
    }}>
      {[
        { label: "Nouvelles", value: visible.length, color: "var(--k-primary)", icon: I.inbox },
        { label: "En cours",  value: PRO_ACTIVE_JOBS.length, color: "var(--k-success)", icon: I.zap },
        { label: "Cette sem.", value: "124k FC", color: "var(--k-accent)", icon: I.coins },
      ].map((s, i) => (
        <div key={i} style={{
          background: "white", border: "1px solid var(--k-border-subtle)",
          borderRadius: 14, padding: mobile ? "12px 10px" : "14px 16px",
        }}>
          <div style={{display:"flex", alignItems:"center", gap: 6, color: s.color, marginBottom: 4}}>
            <s.icon size={14}/>
            <span className="k-caption" style={{color: s.color, fontWeight: 600}}>{s.label}</span>
          </div>
          <div className="k-num" style={{
            fontFamily: "var(--k-font-display)", fontWeight: 700,
            fontSize: mobile ? 20 : 26, color: "var(--k-text-primary)", letterSpacing: "-0.02em",
          }}>
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );

  const SectionTabs = () => (
    <div style={{
      display: "flex", gap: 2, borderBottom: "1px solid var(--k-border)",
      marginBottom: mobile ? 16 : 20,
    }}>
      {[
        { id: "incoming", label: `Nouvelles demandes (${visible.length})` },
        { id: "active",   label: `Missions en cours (${PRO_ACTIVE_JOBS.length})` },
      ].map(t => {
        const active = section === t.id;
        return (
          <button key={t.id} onClick={() => setSection(t.id)} style={{
            padding: mobile ? "10px 14px" : "12px 18px", borderRadius: 0, border: 0, background: "transparent",
            borderBottom: `2px solid ${active ? "var(--k-primary)" : "transparent"}`,
            color: active ? "var(--k-text-primary)" : "var(--k-text-muted)",
            fontFamily: "var(--k-font-body)", fontSize: mobile ? 13 : 14, fontWeight: active ? 600 : 500,
            cursor: "pointer", marginBottom: -1, whiteSpace: "nowrap",
          }}>
            {t.label}
          </button>
        );
      })}
    </div>
  );

  const body = (
    <>
      <HeaderStats/>
      <SectionTabs/>
      {section === "incoming" && (
        <div style={{display: "flex", flexDirection: "column", gap: 14}}>
          {visible.length === 0 ? (
            <div style={{textAlign:"center", padding: "48px 24px"}}>
              <div style={{
                width: 56, height: 56, borderRadius: 18, margin: "0 auto 12px",
                background: "var(--k-success-subtle)", color: "var(--k-success)",
                display: "flex", alignItems:"center", justifyContent:"center",
              }}><I.check size={26}/></div>
              <div style={{fontFamily:"var(--k-font-display)", fontWeight: 600, fontSize: 16}}>Boîte vide</div>
              <div className="k-body-m" style={{color:"var(--k-text-muted)", marginTop: 4}}>
                Les nouvelles demandes apparaîtront ici dès qu'un client vous cible.
              </div>
            </div>
          ) : (
            visible.map(r => (
              <InboundRequestCard key={r.id} r={r} mobile={mobile}
                onAccept={handleAccept} onDecline={handleDecline}
                onClick={() => {}}/>
            ))
          )}
        </div>
      )}
      {section === "active" && (
        <div style={{display: "flex", flexDirection: "column", gap: 10}}>
          {PRO_ACTIVE_JOBS.map(j => (
            <ActiveJobRow key={j.id} j={j} mobile={mobile} onClick={() => nav("detail", j.id)}/>
          ))}
        </div>
      )}
    </>
  );

  if (mobile) {
    return (
      <div style={{paddingBottom: 110}}>
        <div style={{padding: "18px 20px 10px"}}>
          <div className="k-overline" style={{color:"var(--k-accent)", marginBottom: 6}}>Espace pro</div>
          <h1 style={{fontFamily:"var(--k-font-display)", fontSize: 26, fontWeight: 700, letterSpacing:"-0.02em", margin:0}}>
            Demandes
          </h1>
        </div>
        <div style={{padding: "0 20px"}}>
          {body}
        </div>
      </div>
    );
  }

  return (
    <div style={{maxWidth: 1040, margin: "0 auto", padding: "32px 32px 48px"}}>
      <div style={{marginBottom: 24, display: "flex", alignItems:"flex-end", justifyContent:"space-between", gap: 16}}>
        <div>
          <div className="k-overline" style={{color:"var(--k-accent)", marginBottom: 6}}>Espace pro · Jean Mubake</div>
          <h1 className="k-display-m" style={{margin: "0 0 6px"}}>Demandes & missions</h1>
          <div className="k-body-m" style={{color:"var(--k-text-muted)"}}>
            Acceptez vite, envoyez un devis propre, et gardez votre taux de réponse au vert.
          </div>
        </div>
        <button className="k-btn k-btn-secondary" onClick={() => nav("provider")}>
          Aller au tableau de bord <I.arrowRight size={14}/>
        </button>
      </div>
      {body}
    </div>
  );
}

Object.assign(window, { JobRequests, INCOMING_REQUESTS });
