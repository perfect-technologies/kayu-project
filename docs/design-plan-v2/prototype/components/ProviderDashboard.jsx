// Provider Dashboard — "home" for a pro: today's schedule, new requests, earnings, ratings.

const PRO_ME = {
  firstName: "Jean", lastName: "Mubake", initials: "JM", avatarBg: "#0EA5E9",
  profession: "Plombier certifié", trust: "EXPERT", rating: 4.9, reviews: 127, jobs: 284,
  city: "Kinshasa", response: "15 min", verified: true,
};

const TODAY_JOBS = [
  { id: "j1", time: "09:00", duration: "~2h", client: { name: "Marie K.", initials: "MK", bg: "#FB7185" },
    kind: "Fuite évier cuisine", address: "Av. Kasa-Vubu, Gombe", status: "confirmed", fee: 15000, distance: 2.3 },
  { id: "j2", time: "14:30", duration: "~1h30", client: { name: "Papa Léon", initials: "PL", bg: "#10B981" },
    kind: "Chauffe-eau panne", address: "Blvd du 30 Juin, Kinshasa", status: "en_route", fee: 22000, distance: 4.1 },
  { id: "j3", time: "17:00", duration: "~1h", client: { name: "Esther B.", initials: "EB", bg: "#F59E0B" },
    kind: "Débouchage WC", address: "Rue de la Victoire, Lemba", status: "confirmed", fee: 12000, distance: 6.2 },
];

const NEW_REQUESTS = [
  { id: "r1", client: { name: "Christelle M.", initials: "CM", bg: "#BE185D" }, kind: "Installation robinet cuisine",
    when: "Demain matin", address: "Gombe", msg: "J'ai acheté un nouveau robinet mais je n'arrive pas à l'installer.",
    matchScore: 96, receivedAt: "il y a 8 min", distance: 1.8 },
  { id: "r2", client: { name: "Ingrid L.", initials: "IL", bg: "#7C3AED" }, kind: "Fuite sous la douche",
    when: "Dès que possible", address: "Limete", msg: "L'eau coule à travers le plafond du voisin. URGENT.",
    matchScore: 92, receivedAt: "il y a 22 min", distance: 3.7, urgent: true },
  { id: "r3", client: { name: "Patrick N.", initials: "PN", bg: "#475569" }, kind: "Devis rénovation salle de bain",
    when: "Semaine prochaine", address: "Gombe", msg: "Je veux refaire toute la plomberie de ma salle de bain.",
    matchScore: 88, receivedAt: "il y a 1h", distance: 2.1 },
];

const STATS = {
  earningsThisMonth: 485000, earningsLastMonth: 420000,
  jobsThisMonth: 23, jobsLastMonth: 19,
  responseRate: 98,
  acceptRate: 87,
};

function StatusPill({ status }) {
  if (status === "en_route") return <span className="k-chip k-chip-sm k-chip-warning"><I.clock size={11}/> En route</span>;
  if (status === "confirmed") return <span className="k-chip k-chip-sm k-chip-success">Confirmé</span>;
  if (status === "completed") return <span className="k-chip k-chip-sm">Terminé</span>;
  return null;
}

function JobCard({ job, mobile, onClick }) {
  return (
    <div onClick={onClick} role="button" tabIndex={0}
      style={{
        width: "100%", textAlign: "left", cursor: "pointer",
        background: "var(--k-surface)", border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-md)", padding: mobile ? 14 : 18,
        display: "grid", gridTemplateColumns: mobile ? "auto 1fr" : "auto 1fr auto", gap: mobile ? 12 : 18,
        alignItems: "center", boxShadow: "var(--k-e1)",
        transition: "box-shadow 140ms var(--k-ease-std), transform 140ms var(--k-ease-std)",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "var(--k-e2)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--k-e1)"; }}>
      {/* Time block */}
      <div style={{
        width: 60, textAlign: "center",
        paddingRight: 12, borderRight: "1px solid var(--k-border-subtle)",
      }}>
        <div className="k-num" style={{ fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 19, color: "var(--k-text-primary)" }}>{job.time}</div>
        <div className="k-caption" style={{ marginTop: 2 }}>{job.duration}</div>
      </div>

      {/* Body */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 15, color: "var(--k-text-primary)" }}>{job.kind}</span>
          <StatusPill status={job.status}/>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
          <Avatar name={job.client.name} bg={job.client.bg} size={22} initials={job.client.initials}/>
          <span className="k-body-m" style={{ color: "var(--k-text-body)" }}>{job.client.name}</span>
          <span className="k-caption" style={{ color: "var(--k-text-muted)" }}>·</span>
          <span className="k-caption" style={{ color: "var(--k-text-muted)", display: "inline-flex", alignItems: "center", gap: 3 }}>
            <I.mapPin size={11}/> {job.address} · {job.distance} km
          </span>
        </div>
      </div>

      {/* Fee (web) */}
      {!mobile && (
        <div style={{ textAlign: "right" }}>
          <div className="k-price" style={{ fontSize: 16, color: "var(--k-text-primary)" }}>
            {job.fee.toLocaleString("fr-FR")} FC
          </div>
          <button className="k-btn k-btn-primary k-btn-sm" style={{ marginTop: 6 }}>
            Détails <I.chevronRight size={13}/>
          </button>
        </div>
      )}
    </div>
  );
}

function RequestCard({ req, mobile, nav }) {
  return (
    <div style={{
      background: "var(--k-surface)",
      border: "1px solid " + (req.urgent ? "#FCA5A5" : "var(--k-border)"),
      borderRadius: "var(--k-r-md)",
      padding: mobile ? 14 : 18,
      boxShadow: "var(--k-e1)",
      position: "relative",
    }}>
      {req.urgent && (
        <div style={{
          position: "absolute", top: -8, left: 14,
          background: "var(--k-danger)", color: "white",
          fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
          padding: "3px 8px", borderRadius: 999, textTransform: "uppercase",
        }}>Urgent</div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <Avatar name={req.client.name} bg={req.client.bg} size={36} initials={req.client.initials}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 14.5 }}>{req.client.name}</div>
          <div className="k-caption">{req.receivedAt} · {req.distance} km</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="k-caption" style={{ fontSize: 10.5 }}>Match</div>
          <div className="k-num" style={{ fontFamily: "var(--k-font-mono)", fontWeight: 700, fontSize: 14, color: "var(--k-success)" }}>{req.matchScore}%</div>
        </div>
      </div>
      <div style={{ fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 15, color: "var(--k-text-primary)", marginBottom: 4 }}>
        {req.kind}
      </div>
      <p className="k-body-m" style={{ color: "var(--k-text-body)", margin: "0 0 10px",
        display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" }}>
        « {req.msg} »
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        <span className="k-chip k-chip-sm"><I.calendar size={11}/> {req.when}</span>
        <span className="k-chip k-chip-sm"><I.mapPin size={11}/> {req.address}</span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="k-btn k-btn-secondary k-btn-sm" style={{ flex: 1 }}>
          Décliner
        </button>
        <button onClick={() => nav && nav("quote", req.id)} className="k-btn k-btn-primary k-btn-sm" style={{ flex: 2 }}>
          Envoyer un devis <I.arrowRight size={13}/>
        </button>
      </div>
    </div>
  );
}

function Sparkline({ up = true }) {
  // simple svg trend line
  const points = up
    ? "0,24 14,20 28,22 42,15 56,18 70,12 84,14 100,6"
    : "0,10 14,14 28,12 42,18 56,15 70,20 84,18 100,24";
  return (
    <svg width="100" height="30" viewBox="0 0 100 30" style={{ display: "block" }}>
      <polyline points={points} fill="none"
        stroke={up ? "var(--k-success)" : "var(--k-danger)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function StatCard({ label, value, sub, trend, mobile }) {
  const up = trend > 0;
  return (
    <div style={{
      background: "var(--k-surface)", border: "1px solid var(--k-border)",
      borderRadius: "var(--k-r-md)", padding: mobile ? 14 : 18,
      boxShadow: "var(--k-e1)",
    }}>
      <div className="k-overline">{label}</div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10, marginTop: 10 }}>
        <div>
          <div className="k-num" style={{ fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: mobile ? 22 : 26, color: "var(--k-text-primary)", letterSpacing: "-0.02em" }}>
            {value}
          </div>
          {sub && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4,
              color: up ? "var(--k-success)" : "var(--k-danger)", fontSize: 12, fontWeight: 600 }}>
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path d={up ? "M2 7 L5 3 L8 7" : "M2 3 L5 7 L8 3"} stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {sub}
            </div>
          )}
        </div>
        {trend != null && <Sparkline up={up}/>}
      </div>
    </div>
  );
}

function ProviderDashboard({ nav, mobile }) {
  const todayTotal = TODAY_JOBS.reduce((a,b) => a+b.fee, 0);

  // ── Mobile ───────────────────────────────────────────────────────────
  if (mobile) {
    return (
      <div style={{ paddingBottom: 100 }}>
        {/* Greeting header */}
        <div style={{
          padding: "18px 20px 16px",
          background: "linear-gradient(180deg, var(--k-surface-primary) 0%, var(--k-bg) 100%)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <Avatar name={`${PRO_ME.firstName} ${PRO_ME.lastName}`} bg={PRO_ME.avatarBg} size={40} initials={PRO_ME.initials}/>
            <div style={{ flex: 1 }}>
              <div className="k-caption" style={{ color: "var(--k-text-muted)" }}>Bonjour</div>
              <div style={{ fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 17 }}>{PRO_ME.firstName} 👋</div>
            </div>
            <button style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--k-surface)", border: "1px solid var(--k-border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--k-text-body)", position: "relative" }}>
              <I.inbox size={18}/>
              <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: "var(--k-accent)" }}/>
            </button>
          </div>

          {/* Availability toggle */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", background: "var(--k-surface)",
            borderRadius: 999, border: "1px solid var(--k-border)",
          }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--k-success)", boxShadow: "0 0 0 3px var(--k-success-subtle)" }}/>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Disponible aujourd'hui</span>
            <div style={{ flex: 1 }}/>
            <div style={{ width: 38, height: 22, borderRadius: 999, background: "var(--k-success)", position: "relative", cursor: "pointer" }}>
              <div style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}/>
            </div>
          </div>
        </div>

        {/* Today summary */}
        <div style={{ padding: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: "var(--k-r-md)", padding: 14, boxShadow: "var(--k-e1)" }}>
              <div className="k-overline">Aujourd'hui</div>
              <div className="k-num" style={{ fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 22, marginTop: 6 }}>
                {TODAY_JOBS.length} missions
              </div>
              <div className="k-caption" style={{ marginTop: 2 }}>Prochaine à 09h00</div>
            </div>
            <div style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: "var(--k-r-md)", padding: 14, boxShadow: "var(--k-e1)" }}>
              <div className="k-overline">Recette prévue</div>
              <div className="k-price" style={{ fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 22, marginTop: 6, color: "var(--k-text-primary)" }}>
                {todayTotal.toLocaleString("fr-FR")} FC
              </div>
              <div className="k-caption" style={{ marginTop: 2 }}>3 missions confirmées</div>
            </div>
          </div>
        </div>

        {/* Today's schedule */}
        <div style={{ padding: "0 20px 20px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 className="k-heading" style={{ margin: 0 }}>Planning du jour</h2>
            <button style={{ border: 0, background: "transparent", color: "var(--k-primary-hover)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Calendrier
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {TODAY_JOBS.map(j => <JobCard key={j.id} job={j} mobile/>)}
          </div>
        </div>

        {/* New requests */}
        <div style={{ padding: "0 20px 20px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 className="k-heading" style={{ margin: 0 }}>
              Nouvelles demandes <span style={{ fontSize: 14, color: "var(--k-accent)", fontWeight: 600, marginLeft: 4 }}>({NEW_REQUESTS.length})</span>
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {NEW_REQUESTS.map(r => <RequestCard key={r.id} req={r} mobile nav={nav}/>)}
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: "0 20px 20px" }}>
          <h2 className="k-heading" style={{ margin: "0 0 12px" }}>Ce mois</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <StatCard label="Revenus" value={`${(STATS.earningsThisMonth/1000).toFixed(0)}k FC`} sub="+15%" trend={1} mobile/>
            <StatCard label="Missions" value={STATS.jobsThisMonth} sub="+21%" trend={1} mobile/>
            <StatCard label="Taux réponse" value={`${STATS.responseRate}%`} sub="Excellent" trend={1} mobile/>
            <StatCard label="Note moyenne" value={PRO_ME.rating.toFixed(1)} sub="+0.1" trend={1} mobile/>
          </div>
        </div>
      </div>
    );
  }

  // ── Web ──────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "28px 36px 60px", maxWidth: 1280, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 28 }}>
        <Avatar name={`${PRO_ME.firstName} ${PRO_ME.lastName}`} bg={PRO_ME.avatarBg} size={64} initials={PRO_ME.initials}/>
        <div style={{ flex: 1 }}>
          <div className="k-caption" style={{ color: "var(--k-text-muted)" }}>Bonjour,</div>
          <div className="k-display-m" style={{ color: "var(--k-text-primary)" }}>{PRO_ME.firstName} {PRO_ME.lastName}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <TrustChip trust={PRO_ME.trust}/>
            <StarRating value={PRO_ME.rating} count={PRO_ME.reviews}/>
            <span className="k-caption" style={{ color: "var(--k-text-muted)" }}>· {PRO_ME.jobs} missions</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="k-btn k-btn-secondary">
            <I.calendar size={15}/> Calendrier
          </button>
          <button className="k-btn k-btn-primary">
            <I.plus size={15}/> Créer un devis
          </button>
        </div>
      </div>

      {/* Availability bar */}
      <div style={{
        padding: "14px 20px", borderRadius: "var(--k-r-md)",
        background: "var(--k-success-subtle)", border: "1px solid #A7F3D0",
        display: "flex", alignItems: "center", gap: 14, marginBottom: 24,
      }}>
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--k-success)", boxShadow: "0 0 0 4px rgba(16,185,129,0.25)" }}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: "#065F46" }}>Disponible aujourd'hui · reçoit des demandes</div>
          <div className="k-caption" style={{ color: "#047857" }}>Tu apparais dans les résultats de recherche · zone : Kinshasa, 10 km</div>
        </div>
        <button className="k-btn k-btn-secondary k-btn-sm">Modifier zone</button>
        <div style={{ width: 44, height: 26, borderRadius: 999, background: "var(--k-success)", position: "relative", cursor: "pointer" }}>
          <div style={{ position: "absolute", top: 3, right: 3, width: 20, height: 20, borderRadius: "50%", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}/>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        <StatCard label="Revenus du mois" value={`${(STATS.earningsThisMonth/1000).toFixed(0)}k FC`} sub="+15% vs dernier" trend={1}/>
        <StatCard label="Missions" value={STATS.jobsThisMonth} sub="+21% vs dernier" trend={1}/>
        <StatCard label="Taux de réponse" value={`${STATS.responseRate}%`} sub="Excellent" trend={1}/>
        <StatCard label="Note moyenne" value={PRO_ME.rating.toFixed(1)} sub="+0.1 ce mois" trend={1}/>
      </div>

      {/* Two columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24 }}>
        {/* Today */}
        <div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 className="k-heading" style={{ margin: 0 }}>Planning du jour</h2>
            <span className="k-caption">Total estimé : <span className="k-price" style={{ fontSize: 13, color: "var(--k-text-primary)" }}>{todayTotal.toLocaleString("fr-FR")} FC</span></span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {TODAY_JOBS.map(j => <JobCard key={j.id} job={j}/>)}
          </div>
        </div>

        {/* New requests */}
        <div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 className="k-heading" style={{ margin: 0 }}>
              Nouvelles demandes <span style={{ fontSize: 14, color: "var(--k-accent)", fontWeight: 600 }}>({NEW_REQUESTS.length})</span>
            </h2>
            <button style={{ border: 0, background: "transparent", color: "var(--k-primary-hover)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Tout voir
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {NEW_REQUESTS.map(r => <RequestCard key={r.id} req={r} nav={nav}/>)}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ProviderDashboard });
