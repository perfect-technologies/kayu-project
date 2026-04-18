// AdminOps — KAYOU internal ops dashboard.
// Desktop-first, dense information architecture. Four main sections:
//   • Overview (KPIs, live activity)
//   • Verification queue (pros awaiting ID review)
//   • Disputes (active issues between clients and pros)
//   • Payouts (pending mobile money settlements)

// ─── Mock data ──────────────────────────────────────────────────────────

const ADMIN_KPIS = [
  { label: "Bookings aujourd'hui",     value: "287",     delta: "+12%",   deltaDir: "up",   sub: "vs hier",           icon: "calendar" },
  { label: "GMV cette semaine",         value: "48.2M",   unit: "FC",     delta: "+8.4%",  deltaDir: "up",   sub: "vs sem. dernière", icon: "trendingUp" },
  { label: "Pros actifs (7j)",          value: "1,248",   delta: "+47",    deltaDir: "up",   sub: "nouveaux cette sem.", icon: "users" },
  { label: "Taux d'acceptation devis",  value: "68%",     delta: "−2.1%",  deltaDir: "down", sub: "vs sem. dernière",   icon: "fileCheck" },
];

const VERIFICATION_QUEUE = [
  { id: "v1", name: "Pascal Ilunga", profession: "Plombier", city: "Kinshasa", country: "CD",
    submitted: "Il y a 14 min", wait: 14, priority: "high",
    docs: { id: true, selfie: true, address: true, cert: false },
    flags: [],
    avatarBg: "#0EA5E9", initials: "PI" },
  { id: "v2", name: "Christelle Mwamba", profession: "Coiffeuse", city: "Lubumbashi", country: "CD",
    submitted: "Il y a 42 min", wait: 42, priority: "normal",
    docs: { id: true, selfie: true, address: true, cert: true },
    flags: [],
    avatarBg: "#BE185D", initials: "CM" },
  { id: "v3", name: "Dieudonné Okito", profession: "Électricien", city: "Brazzaville", country: "CG",
    submitted: "Il y a 1h", wait: 62, priority: "high",
    docs: { id: true, selfie: false, address: true, cert: true },
    flags: ["Selfie flou"],
    avatarBg: "#D97706", initials: "DO" },
  { id: "v4", name: "Esther Kazadi", profession: "Femme de ménage", city: "Pointe-Noire", country: "CG",
    submitted: "Il y a 2h", wait: 128, priority: "normal",
    docs: { id: true, selfie: true, address: false, cert: false },
    flags: [],
    avatarBg: "#E11D48", initials: "EK" },
  { id: "v5", name: "Moïse Bemba", profession: "Menuisier", city: "Kinshasa", country: "CD",
    submitted: "Il y a 3h", wait: 187, priority: "urgent",
    docs: { id: true, selfie: true, address: true, cert: true },
    flags: ["ID non lisible", "Adresse incohérente"],
    avatarBg: "#B45309", initials: "MB" },
  { id: "v6", name: "Sarah Ngoy", profession: "Prof. informatique", city: "Kinshasa", country: "CD",
    submitted: "Il y a 5h", wait: 312, priority: "normal",
    docs: { id: true, selfie: true, address: true, cert: true },
    flags: [],
    avatarBg: "#7C3AED", initials: "SN" },
];

const DISPUTES = [
  { id: "d1", ref: "B-2847", client: "Marie K.", pro: "Jean Mubake", service: "Plomberie",
    opened: "Il y a 2h", status: "new", amount: 24000,
    reason: "Travail non conforme", severity: "medium",
    lastMsg: "Client: \"L'évier fuit toujours, le pro ne répond plus\"",
    country: "CD" },
  { id: "d2", ref: "B-2831", client: "Robert M.", pro: "Grâce Tshilumba", service: "Électricité",
    opened: "Il y a 6h", status: "pending_pro", amount: 48000,
    reason: "Pro absent au rendez-vous", severity: "high",
    lastMsg: "En attente de réponse du pro (rappel envoyé)",
    country: "CD" },
  { id: "d3", ref: "B-2789", client: "Alice O.", pro: "Patrick Lwanga", service: "Peinture",
    opened: "Hier", status: "investigating", amount: 95000,
    reason: "Désaccord sur le devis final", severity: "medium",
    lastMsg: "Ops: \"Photos demandées aux deux parties\"",
    country: "CG" },
  { id: "d4", ref: "B-2756", client: "Éric N.", pro: "Samuel Kabwe", service: "Ménage",
    opened: "Il y a 3 jours", status: "escalated", amount: 32000,
    reason: "Objet cassé pendant l'intervention", severity: "high",
    lastMsg: "Ops: \"Remboursement proposé — en attente validation\"",
    country: "CD" },
];

const PAYOUT_QUEUE = [
  { id: "po1", pro: "Jean Mubake", operator: "M-Pesa", number: "+243 810 *** 742", amount: 312000,
    jobs: 8, period: "7-13 avril", status: "ready", country: "CD" },
  { id: "po2", pro: "Grâce Tshilumba", operator: "Airtel Money", number: "+243 992 *** 118", amount: 186000,
    jobs: 5, period: "7-13 avril", status: "ready", country: "CD" },
  { id: "po3", pro: "Patrick Lwanga", operator: "MTN Mobile Money", number: "+242 068 *** 210", amount: 245000,
    jobs: 4, period: "7-13 avril", status: "flagged", note: "KYC incomplet", country: "CG" },
  { id: "po4", pro: "Esther Kazadi", operator: "Airtel Money", number: "+242 056 *** 934", amount: 128000,
    jobs: 6, period: "7-13 avril", status: "ready", country: "CG" },
  { id: "po5", pro: "Moïse Bemba", operator: "M-Pesa", number: "+243 817 *** 509", amount: 89000,
    jobs: 3, period: "7-13 avril", status: "hold", note: "Litige B-2847", country: "CD" },
];

const ACTIVITY_FEED = [
  { t: "14:32", evt: "booking", label: "Nouvelle résa Kinshasa · Plomberie · 24 000 FC" },
  { t: "14:30", evt: "verify",  label: "Pascal Ilunga a soumis ses documents" },
  { t: "14:28", evt: "payout",  label: "Payout envoyé · Grâce Tshilumba · 186k FC" },
  { t: "14:25", evt: "dispute", label: "Litige ouvert · B-2847 · Marie K." },
  { t: "14:21", evt: "booking", label: "Résa confirmée · Brazzaville · Peinture" },
  { t: "14:18", evt: "verify",  label: "Christelle Mwamba validée" },
  { t: "14:14", evt: "booking", label: "12 résas en cours actuellement · moyenne 28k FC" },
  { t: "14:10", evt: "alert",   label: "⚠ Pic de litiges Lubumbashi (+3 en 1h)" },
];

// ─── Color helpers for severity/status ─────────────────────────────────

function priorityBadge(p) {
  const map = {
    urgent: { bg: "#FEE2E2", fg: "#B91C1C", label: "Urgent" },
    high:   { bg: "#FEF3C7", fg: "#B45309", label: "Priorité" },
    normal: { bg: "#F1F5F9", fg: "#475569", label: "Normal" },
  };
  const s = map[p] || map.normal;
  return <span style={{ background: s.bg, color: s.fg, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 6 }}>{s.label}</span>;
}

function disputeStatusChip(s) {
  const map = {
    new:           { bg: "#FEE2E2", fg: "#B91C1C", label: "Nouveau" },
    pending_pro:   { bg: "#FEF3C7", fg: "#B45309", label: "Pro à relancer" },
    investigating: { bg: "#DBEAFE", fg: "#1D4ED8", label: "Enquête" },
    escalated:     { bg: "#FDE68A", fg: "#92400E", label: "Escaladé" },
    resolved:      { bg: "#D1FAE5", fg: "#065F46", label: "Résolu" },
  };
  const c = map[s] || map.new;
  return <span style={{ background: c.bg, color: c.fg, fontSize: 11, fontWeight: 600, padding: "4px 9px", borderRadius: 999 }}>{c.label}</span>;
}

function payoutStatusChip(s) {
  const map = {
    ready:   { bg: "#D1FAE5", fg: "#065F46", label: "Prêt" },
    flagged: { bg: "#FEF3C7", fg: "#B45309", label: "À vérifier" },
    hold:    { bg: "#FEE2E2", fg: "#B91C1C", label: "Bloqué" },
    sent:    { bg: "#E0E7FF", fg: "#3730A3", label: "Envoyé" },
  };
  const c = map[s] || map.ready;
  return <span style={{ background: c.bg, color: c.fg, fontSize: 11, fontWeight: 600, padding: "4px 9px", borderRadius: 999 }}>{c.label}</span>;
}

function countryFlag(code) {
  if (code === "CD") return <span title="RDC" style={{ fontSize: 10, padding: "2px 5px", borderRadius: 4, background: "#FEF3C7", color: "#92400E", fontWeight: 700, letterSpacing: "0.04em" }}>🇨🇩 CD</span>;
  return <span title="Congo-Brazzaville" style={{ fontSize: 10, padding: "2px 5px", borderRadius: 4, background: "#DBEAFE", color: "#1E40AF", fontWeight: 700, letterSpacing: "0.04em" }}>🇨🇬 CG</span>;
}

// ─── Main component ────────────────────────────────────────────────────

function AdminOps({ nav, mobile }) {
  const [section, setSection] = React.useState("overview");
  const [selectedVerif, setSelectedVerif] = React.useState(null);

  if (mobile) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "var(--k-text-muted)" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, margin: "60px auto 16px",
          background: "var(--k-surface)", border: "1px solid var(--k-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <I.server size={28} color="var(--k-text-muted)"/>
        </div>
        <h2 style={{ fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 18, color: "var(--k-text-primary)", margin: "0 0 8px" }}>
          Ops dashboard
        </h2>
        <div style={{ fontSize: 13, maxWidth: 240, margin: "0 auto", lineHeight: 1.5 }}>
          Interface réservée aux équipes KAYOU. Accédez-y depuis un ordinateur.
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#FAFAF9", minHeight: "100%" }}>
      {/* Top bar — dark, ops-feel */}
      <div style={{
        background: "#0F172A", color: "white",
        padding: "14px 28px", display: "flex", alignItems: "center", gap: 24,
        borderBottom: "1px solid #1E293B",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 6,
            background: "linear-gradient(135deg, #0EA5E9, #0284C7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700,
          }}>K</div>
          <span style={{ fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 14, letterSpacing: "-0.01em" }}>
            KAYOU Ops
          </span>
          <span style={{ fontSize: 10, padding: "2px 7px", background: "#1E293B", borderRadius: 4, color: "#94A3B8", fontFamily: "var(--k-font-mono)", letterSpacing: "0.04em" }}>
            PROD
          </span>
        </div>

        <nav style={{ display: "flex", gap: 4, marginLeft: 16 }}>
          {[
            { id: "overview",    label: "Vue d'ensemble", icon: I.home },
            { id: "verification", label: "Vérifications", count: VERIFICATION_QUEUE.length, icon: I.badgeCheck },
            { id: "disputes",    label: "Litiges", count: DISPUTES.filter(d => d.status !== "resolved").length, icon: I.flag },
            { id: "payouts",     label: "Payouts", count: PAYOUT_QUEUE.filter(p => p.status === "ready").length, icon: I.coins },
          ].map(t => {
            const active = section === t.id;
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setSection(t.id)} style={{
                background: active ? "#1E293B" : "transparent", border: 0,
                color: active ? "white" : "#94A3B8",
                padding: "8px 14px", borderRadius: 8,
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 7,
                transition: "color 120ms",
              }}>
                <Icon size={14}/> {t.label}
                {t.count != null && (
                  <span style={{
                    background: active ? "#0EA5E9" : "#334155",
                    color: "white", fontSize: 10, fontWeight: 700,
                    padding: "1px 6px", borderRadius: 999, minWidth: 18, textAlign: "center",
                  }}>{t.count}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div style={{ flex: 1 }}/>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#94A3B8" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 0 3px rgba(16,185,129,0.2)" }}/>
            System healthy
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 9,
            padding: "4px 12px 4px 4px", background: "#1E293B", borderRadius: 999,
          }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#7C3AED", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
              KA
            </div>
            <span style={{ fontSize: 12, fontWeight: 500 }}>Kasongo Admin</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "28px 32px 60px", maxWidth: 1440, margin: "0 auto" }}>
        {section === "overview"     && <OverviewSection/>}
        {section === "verification" && <VerificationSection onSelect={setSelectedVerif}/>}
        {section === "disputes"     && <DisputesSection/>}
        {section === "payouts"      && <PayoutsSection/>}
      </div>

      {selectedVerif && <VerificationDetailDrawer v={selectedVerif} onClose={() => setSelectedVerif(null)}/>}
    </div>
  );
}

// ─── Overview ──────────────────────────────────────────────────────────

function OverviewSection() {
  return (
    <div>
      <SectionHeader title="Vue d'ensemble" subtitle="Données en temps réel · mises à jour il y a quelques secondes"/>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {ADMIN_KPIS.map((k, i) => {
          const Icon = I[k.icon] || I.info;
          const isUp = k.deltaDir === "up";
          return (
            <div key={i} style={{
              background: "white", border: "1px solid var(--k-border)", borderRadius: 12,
              padding: 18, boxShadow: "var(--k-e1)", position: "relative", overflow: "hidden",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "#F1F5F9", color: "#475569",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={16}/>
                </div>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 3,
                  fontSize: 11.5, fontWeight: 600,
                  color: isUp ? "#047857" : "#B91C1C",
                  background: isUp ? "#ECFDF5" : "#FEF2F2",
                  padding: "3px 8px", borderRadius: 6,
                }}>
                  {isUp ? <I.trendingUp size={11}/> : <I.trendingDown size={11}/>}
                  {k.delta}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#64748B", marginBottom: 6, fontWeight: 500 }}>
                {k.label}
              </div>
              <div style={{
                fontFamily: "var(--k-font-display)", fontWeight: 700,
                fontSize: 26, letterSpacing: "-0.02em", color: "#0F172A",
                display: "flex", alignItems: "baseline", gap: 4,
              }}>
                {k.value}
                {k.unit && <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>{k.unit}</span>}
              </div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>{k.sub}</div>
            </div>
          );
        })}
      </div>

      {/* 2-col: left = queues summary, right = activity feed */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Geo split */}
          <OpsCard title="Répartition par pays (7j)">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <CountryPanel code="CD" name="République Démocratique du Congo" gmv="34.8M FC" pros={892} bookings={1847} color="#FBBF24"/>
              <CountryPanel code="CG" name="Congo-Brazzaville" gmv="13.4M FC" pros={356} bookings={612} color="#10B981"/>
            </div>
          </OpsCard>

          {/* Queue summary */}
          <OpsCard title="Files d'attente" action="Configurer les seuils →">
            <QueueRow icon={I.badgeCheck} label="Vérifications en attente"
              value={VERIFICATION_QUEUE.length} subValue="2 > 3h (cible: <2h)"
              tint="#0EA5E9" tintBg="#E0F2FE"
              alert={VERIFICATION_QUEUE.some(v => v.wait > 180)}/>
            <QueueRow icon={I.flag} label="Litiges actifs"
              value={DISPUTES.filter(d => d.status !== "resolved").length} subValue="1 escaladé · attention"
              tint="#DC2626" tintBg="#FEE2E2" alert/>
            <QueueRow icon={I.coins} label="Payouts à traiter"
              value={PAYOUT_QUEUE.filter(p => p.status === "ready").length}
              subValue={`${PAYOUT_QUEUE.filter(p => p.status === "ready").reduce((a,b) => a + b.amount, 0).toLocaleString("fr-FR")} FC prêts`}
              tint="#059669" tintBg="#D1FAE5"/>
            <QueueRow icon={I.alertTriangle} label="Payouts bloqués"
              value={PAYOUT_QUEUE.filter(p => p.status !== "ready").length}
              subValue="Nécessitent vérification manuelle"
              tint="#D97706" tintBg="#FEF3C7"/>
          </OpsCard>

          {/* Sparkline / trend */}
          <OpsCard title="Bookings · 14 derniers jours">
            <BookingsBars/>
          </OpsCard>
        </div>

        {/* Activity feed */}
        <OpsCard title="Flux d'activité" action="Tout voir →" style={{ alignSelf: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {ACTIVITY_FEED.map((a, i) => <ActivityRow key={i} a={a}/>)}
          </div>
        </OpsCard>
      </div>
    </div>
  );
}

function CountryPanel({ code, name, gmv, pros, bookings, color }) {
  return (
    <div style={{
      padding: 16, borderRadius: 10, border: "1px solid var(--k-border-subtle)",
      background: "linear-gradient(180deg, #FAFAFA 0%, white 100%)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        {countryFlag(code)}
        <span style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>{name}</span>
      </div>
      <div style={{ fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 24, letterSpacing: "-0.02em", color: "#0F172A", marginBottom: 4 }}>
        {gmv}
      </div>
      <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 12 }}>GMV hebdomadaire</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
        <div>
          <div style={{ color: "#64748B", fontSize: 11, marginBottom: 2 }}>Pros actifs</div>
          <div style={{ fontWeight: 600, color: "#0F172A", fontFamily: "var(--k-font-mono)" }}>{pros}</div>
        </div>
        <div>
          <div style={{ color: "#64748B", fontSize: 11, marginBottom: 2 }}>Bookings</div>
          <div style={{ fontWeight: 600, color: "#0F172A", fontFamily: "var(--k-font-mono)" }}>{bookings}</div>
        </div>
      </div>
      <div style={{ marginTop: 12, height: 3, borderRadius: 2, background: "#F1F5F9", overflow: "hidden" }}>
        <div style={{ height: "100%", width: "72%", background: color }}/>
      </div>
    </div>
  );
}

function QueueRow({ icon: Icon, label, value, subValue, tint, tintBg, alert }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
      borderBottom: "1px solid var(--k-border-subtle)",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, background: tintBg, color: tint,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={17}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: "#0F172A" }}>{label}</div>
        <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 1 }}>{subValue}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {alert && (
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#F59E0B", boxShadow: "0 0 0 3px rgba(245,158,11,0.15)" }}/>
        )}
        <span style={{ fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em", color: "#0F172A", minWidth: 30, textAlign: "right" }}>
          {value}
        </span>
      </div>
    </div>
  );
}

function BookingsBars() {
  const days = ["31", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"];
  const values = [180, 212, 245, 198, 223, 268, 301, 276, 289, 234, 267, 298, 312, 287];
  const max = Math.max(...values);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140, paddingTop: 8 }}>
      {values.map((v, i) => {
        const isToday = i === values.length - 1;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              width: "100%", height: `${(v / max) * 100}%`,
              background: isToday ? "#0EA5E9" : "#CBD5E1",
              borderRadius: "4px 4px 0 0",
              minHeight: 4, transition: "height 300ms",
              boxShadow: isToday ? "0 0 0 2px rgba(14,165,233,0.15)" : "none",
            }}/>
            <div style={{
              fontSize: 10, color: isToday ? "#0F172A" : "#94A3B8",
              fontWeight: isToday ? 600 : 400, fontFamily: "var(--k-font-mono)",
            }}>
              {days[i]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActivityRow({ a }) {
  const evtMap = {
    booking: { color: "#0EA5E9", label: "BOOKING" },
    verify:  { color: "#7C3AED", label: "VERIFY" },
    payout:  { color: "#059669", label: "PAYOUT" },
    dispute: { color: "#DC2626", label: "DISPUTE" },
    alert:   { color: "#D97706", label: "ALERT" },
  };
  const e = evtMap[a.evt] || evtMap.booking;
  return (
    <div style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--k-border-subtle)", alignItems: "flex-start" }}>
      <span style={{ fontSize: 10, color: "#94A3B8", fontFamily: "var(--k-font-mono)", minWidth: 34, paddingTop: 2 }}>{a.t}</span>
      <span style={{
        fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em",
        color: e.color, background: `${e.color}15`,
        padding: "2px 6px", borderRadius: 4, flexShrink: 0, marginTop: 1,
      }}>{e.label}</span>
      <span style={{ fontSize: 12.5, color: "#334155", lineHeight: 1.45, flex: 1 }}>{a.label}</span>
    </div>
  );
}

// ─── Verification Section ───────────────────────────────────────────────

function VerificationSection({ onSelect }) {
  const [filter, setFilter] = React.useState("all");
  const [country, setCountry] = React.useState("all");

  const filtered = VERIFICATION_QUEUE.filter(v => {
    if (country !== "all" && v.country !== country) return false;
    if (filter === "priority" && v.priority === "normal") return false;
    if (filter === "flagged" && v.flags.length === 0) return false;
    return true;
  });

  return (
    <div>
      <SectionHeader
        title="File de vérifications"
        subtitle={`${VERIFICATION_QUEUE.length} pros en attente · objectif : traitement sous 2h`}
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <button className="k-btn k-btn-secondary k-btn-sm"><I.refresh size={13}/> Actualiser</button>
            <button className="k-btn k-btn-primary k-btn-sm"><I.badgeCheck size={13}/> Nouveau critère</button>
          </div>
        }
      />

      {/* Filter bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: 14, background: "white", border: "1px solid var(--k-border)", borderRadius: 10,
        marginBottom: 14,
      }}>
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { id: "all", label: `Tous (${VERIFICATION_QUEUE.length})` },
            { id: "priority", label: `Priorité (${VERIFICATION_QUEUE.filter(v => v.priority !== "normal").length})` },
            { id: "flagged", label: `Signalés (${VERIFICATION_QUEUE.filter(v => v.flags.length > 0).length})` },
          ].map(t => (
            <button key={t.id} onClick={() => setFilter(t.id)} style={{
              padding: "6px 12px", borderRadius: 7, border: 0,
              background: filter === t.id ? "#0F172A" : "transparent",
              color: filter === t.id ? "white" : "#475569",
              fontSize: 12.5, fontWeight: 500, cursor: "pointer",
            }}>{t.label}</button>
          ))}
        </div>
        <div style={{ width: 1, height: 18, background: "var(--k-border)" }}/>
        <div style={{ display: "flex", gap: 4 }}>
          {[{id:"all",label:"Tous pays"},{id:"CD",label:"🇨🇩 RDC"},{id:"CG",label:"🇨🇬 CG"}].map(c => (
            <button key={c.id} onClick={() => setCountry(c.id)} style={{
              padding: "6px 10px", borderRadius: 7, border: 0,
              background: country === c.id ? "#0F172A" : "transparent",
              color: country === c.id ? "white" : "#475569",
              fontSize: 12.5, fontWeight: 500, cursor: "pointer",
            }}>{c.label}</button>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <span style={{ fontSize: 12, color: "#94A3B8" }}>
          Moy. temps de traitement : <strong style={{ color: "#0F172A" }}>47 min</strong>
        </span>
      </div>

      {/* Table */}
      <div style={{ background: "white", border: "1px solid var(--k-border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "auto 1fr 150px 120px 160px 130px 100px",
          gap: 12, padding: "12px 18px",
          borderBottom: "1px solid var(--k-border)", background: "#FAFAF9",
          fontSize: 11, fontWeight: 600, color: "#64748B", letterSpacing: "0.04em", textTransform: "uppercase",
        }}>
          <input type="checkbox"/>
          <span>Pro</span>
          <span>Profession / Ville</span>
          <span>Soumis</span>
          <span>Documents</span>
          <span>État</span>
          <span>Actions</span>
        </div>
        {filtered.map(v => <VerifyRow key={v.id} v={v} onSelect={() => onSelect(v)}/>)}
      </div>

      {/* Footer stats */}
      <div style={{
        marginTop: 14, display: "flex", gap: 20, padding: "12px 18px",
        background: "white", border: "1px solid var(--k-border)", borderRadius: 10,
        fontSize: 12, color: "#64748B",
      }}>
        <span>✓ <strong style={{ color: "#0F172A" }}>247</strong> validés cette semaine</span>
        <span>✗ <strong style={{ color: "#0F172A" }}>12</strong> rejetés</span>
        <span>⏱ <strong style={{ color: "#0F172A" }}>47 min</strong> médiane</span>
        <span>⚠ <strong style={{ color: "#0F172A" }}>2</strong> au-delà du SLA</span>
      </div>
    </div>
  );
}

function VerifyRow({ v, onSelect }) {
  return (
    <button onClick={onSelect} style={{
      display: "grid", gridTemplateColumns: "auto 1fr 150px 120px 160px 130px 100px",
      gap: 12, padding: "14px 18px", alignItems: "center",
      borderBottom: "1px solid var(--k-border-subtle)",
      background: "white", border: 0, width: "100%", textAlign: "left", cursor: "pointer",
    }}
      onMouseEnter={e => e.currentTarget.style.background = "#FAFAF9"}
      onMouseLeave={e => e.currentTarget.style.background = "white"}>
      <input type="checkbox" onClick={e => e.stopPropagation()}/>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar name={v.name} bg={v.avatarBg} size={34} initials={v.initials}/>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13.5, color: "#0F172A" }}>{v.name}</div>
          <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: "var(--k-font-mono)" }}>{v.id.toUpperCase()}</div>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 13, color: "#334155" }}>{v.profession}</div>
        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>
          {v.city} · {countryFlag(v.country)}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12.5, color: "#334155" }}>{v.submitted}</div>
        {v.wait > 120 && (
          <div style={{ fontSize: 10.5, color: "#B91C1C", marginTop: 2, fontWeight: 600 }}>
            ⚠ SLA dépassé
          </div>
        )}
      </div>
      <DocsProgress docs={v.docs}/>
      <div>
        {priorityBadge(v.priority)}
        {v.flags.length > 0 && (
          <div style={{ fontSize: 11, color: "#B45309", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <I.alertTriangle size={11}/> {v.flags[0]}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
        <button className="k-btn k-btn-secondary k-btn-sm" style={{ padding: "5px 10px", fontSize: 11.5 }}
          onClick={(e) => { e.stopPropagation(); onSelect(); }}>
          Examiner
        </button>
      </div>
    </button>
  );
}

function DocsProgress({ docs }) {
  const items = [
    { key: "id", label: "ID", icon: I.idCard },
    { key: "selfie", label: "Selfie", icon: I.selfie },
    { key: "address", label: "Adresse", icon: I.mapPin },
    { key: "cert", label: "Cert.", icon: I.fileCheck },
  ];
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {items.map(item => {
        const have = docs[item.key];
        const Icon = item.icon;
        return (
          <div key={item.key} title={item.label} style={{
            width: 28, height: 28, borderRadius: 6,
            background: have ? "#ECFDF5" : "#F1F5F9",
            color: have ? "#047857" : "#CBD5E1",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: have ? "1px solid #A7F3D0" : "1px solid #E2E8F0",
          }}>
            <Icon size={13}/>
          </div>
        );
      })}
    </div>
  );
}

// ─── Verification Detail Drawer ────────────────────────────────────────

function VerificationDetailDrawer({ v, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(15,23,42,0.5)", backdropFilter: "blur(2px)",
      display: "flex", justifyContent: "flex-end",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 540, background: "white", height: "100%",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.2)",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ padding: 20, borderBottom: "1px solid var(--k-border)", display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar name={v.name} bg={v.avatarBg} size={44} initials={v.initials}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>{v.name}</div>
            <div style={{ fontSize: 12, color: "#94A3B8" }}>{v.profession} · {v.city}</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: 0, cursor: "pointer", color: "#64748B", padding: 6 }}>
            <I.x size={18}/>
          </button>
        </div>

        {/* Body */}
        <div className="k-scroll" style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {priorityBadge(v.priority)}
            {countryFlag(v.country)}
            <span style={{ fontSize: 11, color: "#94A3B8" }}>Soumis {v.submitted}</span>
          </div>

          {v.flags.length > 0 && (
            <div style={{
              padding: 12, background: "#FEF3C7", border: "1px solid #FDE68A",
              borderRadius: 8, marginBottom: 18,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "#92400E", marginBottom: 6 }}>
                <I.alertTriangle size={13}/> Points d'attention
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#78350F", lineHeight: 1.6 }}>
                {v.flags.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}

          {/* Document previews */}
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "#64748B", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 10px" }}>
            Documents soumis
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            <DocPreview label="Pièce d'identité" type="ID" ok={v.docs.id}/>
            <DocPreview label="Selfie avec ID" type="selfie" ok={v.docs.selfie}/>
            <DocPreview label="Justif. adresse" type="address" ok={v.docs.address}/>
            <DocPreview label="Certificat métier" type="cert" ok={v.docs.cert} optional/>
          </div>

          {/* Profile summary */}
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "#64748B", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 10px" }}>
            Informations déclarées
          </h3>
          <div style={{ background: "#FAFAF9", borderRadius: 10, padding: 14, marginBottom: 18 }}>
            <InfoRow label="Numéro de téléphone" value={v.country === "CD" ? "+243 812 456 789" : "+242 068 123 456"} verified/>
            <InfoRow label="Année de naissance" value="1989"/>
            <InfoRow label="Adresse" value={`${v.city}, ${v.country === "CD" ? "RDC" : "Congo-B"}`}/>
            <InfoRow label="Années d'expérience" value="6 ans déclarés"/>
            <InfoRow label="Référence" value="Pro parrain : @marieK"/>
          </div>

          {/* Checks passed */}
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "#64748B", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 10px" }}>
            Vérifications auto
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
            <AutoCheck label="Numéro de téléphone valide et unique" pass/>
            <AutoCheck label="Selfie correspond à la photo ID" pass={v.docs.selfie}/>
            <AutoCheck label="ID n'est pas dans la base de fraudes" pass/>
            <AutoCheck label="Adresse dans zone de couverture" pass={v.docs.address}/>
            <AutoCheck label="Aucun compte existant avec ce numéro" pass/>
          </div>
        </div>

        {/* Footer actions */}
        <div style={{
          padding: 16, borderTop: "1px solid var(--k-border)", background: "#FAFAF9",
          display: "flex", gap: 8,
        }}>
          <button className="k-btn k-btn-secondary" style={{ flex: 1 }}>
            <I.messageCircle size={14}/> Demander plus d'info
          </button>
          <button className="k-btn k-btn-secondary" style={{ color: "#B91C1C", borderColor: "#FECACA", background: "#FEF2F2" }}>
            <I.xCircle size={14}/> Rejeter
          </button>
          <button className="k-btn k-btn-primary" style={{ background: "#059669", borderColor: "#059669" }}>
            <I.check size={14}/> Approuver
          </button>
        </div>
      </div>
    </div>
  );
}

function DocPreview({ label, type, ok, optional }) {
  return (
    <div style={{
      background: ok ? "#FAFAF9" : "#FFFBEB",
      border: `1px solid ${ok ? "var(--k-border)" : "#FDE68A"}`,
      borderRadius: 10, padding: 12,
      opacity: ok ? 1 : 0.6,
    }}>
      <div style={{
        height: 110, borderRadius: 8,
        background: ok ? "linear-gradient(135deg, #E0E7FF, #CFFAFE)" : "#FEF3C7",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: ok ? "#64748B" : "#B45309",
        marginBottom: 10, position: "relative", overflow: "hidden",
      }}>
        {type === "ID" && (
          <div style={{
            width: "80%", height: 70, borderRadius: 6, background: "white",
            display: "grid", gridTemplateColumns: "50px 1fr", padding: 8, gap: 8,
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}>
            <div style={{ background: "#CBD5E1", borderRadius: 3 }}/>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingTop: 4 }}>
              <div style={{ height: 4, background: "#CBD5E1", width: "70%", borderRadius: 2 }}/>
              <div style={{ height: 4, background: "#E2E8F0", width: "90%", borderRadius: 2 }}/>
              <div style={{ height: 4, background: "#E2E8F0", width: "50%", borderRadius: 2 }}/>
              <div style={{ height: 3, background: "#F1F5F9", width: "80%", borderRadius: 2, marginTop: "auto" }}/>
            </div>
          </div>
        )}
        {type === "selfie" && (
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#93C5FD", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
            <I.user size={28}/>
          </div>
        )}
        {type === "address" && <I.fileText size={40}/>}
        {type === "cert" && <I.award size={40}/>}
        {ok && <span style={{ position: "absolute", bottom: 6, right: 6, background: "rgba(5,150,105,0.95)", color: "white", padding: "2px 7px", borderRadius: 999, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.05em" }}>OK</span>}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{label}</div>
      <div style={{ fontSize: 11, color: ok ? "#94A3B8" : "#B45309", marginTop: 2 }}>
        {ok ? "Soumis · cliquez pour agrandir" : (optional ? "Optionnel · non fourni" : "Manquant")}
      </div>
    </div>
  );
}

function InfoRow({ label, value, verified }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12.5, borderBottom: "1px solid var(--k-border-subtle)" }}>
      <span style={{ color: "#64748B" }}>{label}</span>
      <span style={{ color: "#0F172A", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4 }}>
        {value}
        {verified && <I.badgeCheck size={12} color="#10B981"/>}
      </span>
    </div>
  );
}

function AutoCheck({ label, pass }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#334155" }}>
      {pass ? (
        <I.checkCircle size={14} color="#10B981"/>
      ) : (
        <I.xCircle size={14} color="#DC2626"/>
      )}
      <span style={{ color: pass ? "#334155" : "#B91C1C" }}>{label}</span>
    </div>
  );
}

// ─── Disputes Section ──────────────────────────────────────────────────

function DisputesSection() {
  const [selected, setSelected] = React.useState(null);

  return (
    <div>
      <SectionHeader
        title="Litiges actifs"
        subtitle={`${DISPUTES.filter(d => d.status !== "resolved").length} litiges en cours · objectif : résolution < 48h`}
      />

      {/* Severity alert */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: 14, marginBottom: 16,
        background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 10,
      }}>
        <I.alertTriangle size={18} color="#B45309"/>
        <span style={{ fontSize: 13, color: "#78350F" }}>
          <strong>1 litige escaladé</strong> nécessite une décision de remboursement. Temps d'attente : 3 jours.
        </span>
        <button className="k-btn k-btn-sm" style={{ marginLeft: "auto", background: "#B45309", color: "white", border: 0 }}>
          Voir
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16 }}>
        {/* List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {DISPUTES.map(d => (
            <DisputeCard key={d.id} d={d} onSelect={() => setSelected(d)} active={selected?.id === d.id}/>
          ))}
        </div>

        {/* Right rail — selected dispute detail */}
        <div style={{ position: "sticky", top: 20, alignSelf: "start" }}>
          {selected ? (
            <DisputeDetail d={selected}/>
          ) : (
            <div style={{
              padding: 40, background: "white", border: "1px solid var(--k-border)", borderRadius: 12,
              textAlign: "center", color: "#94A3B8",
            }}>
              <I.flag size={28} color="#CBD5E1" style={{ margin: "0 auto 12px" }}/>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#334155", marginBottom: 4 }}>Sélectionnez un litige</div>
              <div style={{ fontSize: 12 }}>Cliquez sur une carte pour voir les détails, la timeline et prendre une décision.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DisputeCard({ d, onSelect, active }) {
  const sevColor = d.severity === "high" ? "#DC2626" : "#D97706";
  return (
    <button onClick={onSelect} style={{
      padding: 16, background: "white", borderRadius: 10,
      border: `1px solid ${active ? "#0EA5E9" : "var(--k-border)"}`,
      boxShadow: active ? "0 0 0 3px rgba(14,165,233,0.12)" : "none",
      textAlign: "left", cursor: "pointer", transition: "border-color 120ms",
      borderLeft: `3px solid ${sevColor}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--k-font-mono)", fontSize: 11.5, fontWeight: 600, color: "#64748B" }}>
          #{d.ref}
        </span>
        {disputeStatusChip(d.status)}
        {countryFlag(d.country)}
        <span style={{ fontSize: 11, color: "#94A3B8", marginLeft: "auto" }}>{d.opened}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>
        {d.reason}
      </div>
      <div style={{ fontSize: 12, color: "#64748B", marginBottom: 8 }}>
        {d.client} <span style={{ color: "#CBD5E1" }}>·</span> {d.pro} <span style={{ color: "#CBD5E1" }}>·</span> {d.service}
      </div>
      <div style={{ fontSize: 12, color: "#475569", fontStyle: "italic", lineHeight: 1.45, background: "#FAFAF9", padding: "8px 10px", borderRadius: 6 }}>
        {d.lastMsg}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, fontSize: 11.5 }}>
        <span style={{ color: "#64748B" }}>Montant en jeu</span>
        <span style={{ fontFamily: "var(--k-font-mono)", fontWeight: 700, color: "#0F172A" }}>
          {d.amount.toLocaleString("fr-FR")} FC
        </span>
      </div>
    </button>
  );
}

function DisputeDetail({ d }) {
  return (
    <div style={{ background: "white", border: "1px solid var(--k-border)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: 16, borderBottom: "1px solid var(--k-border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontFamily: "var(--k-font-mono)", fontSize: 12, color: "#64748B", fontWeight: 600 }}>#{d.ref}</span>
          {disputeStatusChip(d.status)}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{d.reason}</div>
      </div>

      <div style={{ padding: 16 }}>
        <h4 style={{ fontSize: 11, fontWeight: 700, color: "#64748B", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 10px" }}>
          Timeline
        </h4>
        <div style={{ marginBottom: 18 }}>
          <TimelineEvent time={d.opened} who="Client" action="a ouvert le litige" active/>
          <TimelineEvent time="Il y a 1h" who="Ops" action="a contacté les deux parties"/>
          <TimelineEvent time="Il y a 30 min" who="Pro" action="a répondu : contestation"/>
          <TimelineEvent time="Maintenant" who="Ops" action="en attente de décision" current/>
        </div>

        <h4 style={{ fontSize: 11, fontWeight: 700, color: "#64748B", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 10px" }}>
          Décision
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button className="k-btn k-btn-secondary k-btn-sm" style={{ justifyContent: "flex-start" }}>
            ✓ Rembourser intégralement ({d.amount.toLocaleString("fr-FR")} FC)
          </button>
          <button className="k-btn k-btn-secondary k-btn-sm" style={{ justifyContent: "flex-start" }}>
            ½ Rembourser partiellement
          </button>
          <button className="k-btn k-btn-secondary k-btn-sm" style={{ justifyContent: "flex-start" }}>
            ✗ Rejeter la demande
          </button>
          <button className="k-btn k-btn-secondary k-btn-sm" style={{ justifyContent: "flex-start" }}>
            → Escalader au manager
          </button>
        </div>
      </div>
    </div>
  );
}

function TimelineEvent({ time, who, action, active, current }) {
  return (
    <div style={{ display: "flex", gap: 10, paddingBottom: 12, position: "relative" }}>
      <div style={{
        width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
        background: current ? "#0EA5E9" : active ? "#10B981" : "#E2E8F0",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "white", fontSize: 10, fontWeight: 700,
        boxShadow: current ? "0 0 0 3px rgba(14,165,233,0.2)" : "none",
        position: "relative", zIndex: 1,
      }}>
        {current ? "•" : "✓"}
      </div>
      <div style={{ fontSize: 12, color: "#334155", flex: 1 }}>
        <div><strong>{who}</strong> {action}</div>
        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>{time}</div>
      </div>
    </div>
  );
}

// ─── Payouts Section ───────────────────────────────────────────────────

function PayoutsSection() {
  const readyAmount = PAYOUT_QUEUE.filter(p => p.status === "ready").reduce((a, b) => a + b.amount, 0);

  return (
    <div>
      <SectionHeader
        title="Payouts hebdomadaires"
        subtitle="Batch hebdomadaire · dimanche soir · Mobile Money (M-Pesa, Airtel Money, MTN MoMo)"
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <button className="k-btn k-btn-secondary k-btn-sm"><I.fileText size={13}/> Exporter CSV</button>
            <button className="k-btn k-btn-primary k-btn-sm" style={{ background: "#059669", borderColor: "#059669" }}>
              <I.send size={13}/> Lancer le batch ({readyAmount.toLocaleString("fr-FR")} FC)
            </button>
          </div>
        }
      />

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        <PayoutStat label="Prêts à envoyer" value={PAYOUT_QUEUE.filter(p => p.status === "ready").length} amount={readyAmount} tint="#059669"/>
        <PayoutStat label="À vérifier" value={PAYOUT_QUEUE.filter(p => p.status === "flagged").length} amount={PAYOUT_QUEUE.filter(p => p.status === "flagged").reduce((a,b) => a + b.amount, 0)} tint="#D97706"/>
        <PayoutStat label="Bloqués" value={PAYOUT_QUEUE.filter(p => p.status === "hold").length} amount={PAYOUT_QUEUE.filter(p => p.status === "hold").reduce((a,b) => a + b.amount, 0)} tint="#DC2626"/>
        <PayoutStat label="Total batch" value={PAYOUT_QUEUE.length} amount={PAYOUT_QUEUE.reduce((a,b) => a + b.amount, 0)} tint="#0EA5E9"/>
      </div>

      {/* Table */}
      <div style={{ background: "white", border: "1px solid var(--k-border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "auto 1fr 170px 200px 120px 140px 100px",
          gap: 12, padding: "12px 18px",
          borderBottom: "1px solid var(--k-border)", background: "#FAFAF9",
          fontSize: 11, fontWeight: 600, color: "#64748B", letterSpacing: "0.04em", textTransform: "uppercase",
        }}>
          <input type="checkbox"/>
          <span>Pro</span>
          <span>Opérateur</span>
          <span>Numéro</span>
          <span>Missions</span>
          <span>Montant</span>
          <span>État</span>
        </div>
        {PAYOUT_QUEUE.map(p => <PayoutRow key={p.id} p={p}/>)}
      </div>
    </div>
  );
}

function PayoutStat({ label, value, amount, tint }) {
  return (
    <div style={{
      padding: 14, background: "white", border: "1px solid var(--k-border)", borderRadius: 10,
      borderTop: `3px solid ${tint}`,
    }}>
      <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
        <span style={{ fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 24, letterSpacing: "-0.02em", color: "#0F172A" }}>
          {value}
        </span>
        <span style={{ fontSize: 11.5, color: "#94A3B8" }}>pros</span>
      </div>
      <div style={{ fontSize: 12, color: "#475569", fontFamily: "var(--k-font-mono)" }}>
        {amount.toLocaleString("fr-FR")} FC
      </div>
    </div>
  );
}

function PayoutRow({ p }) {
  const opColor = {
    "M-Pesa": "#DC2626",
    "Airtel Money": "#E11D48",
    "MTN Mobile Money": "#F59E0B",
    "Orange Money": "#F97316",
  }[p.operator] || "#64748B";
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "auto 1fr 170px 200px 120px 140px 100px",
      gap: 12, padding: "14px 18px", alignItems: "center",
      borderBottom: "1px solid var(--k-border-subtle)",
    }}>
      <input type="checkbox"/>
      <div>
        <div style={{ fontWeight: 600, fontSize: 13.5, color: "#0F172A" }}>{p.pro}</div>
        <div style={{ fontSize: 11, color: "#94A3B8" }}>{countryFlag(p.country)} · {p.period}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#334155" }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: opColor }}/>
        {p.operator}
      </div>
      <div style={{ fontFamily: "var(--k-font-mono)", fontSize: 12, color: "#64748B" }}>{p.number}</div>
      <div style={{ fontSize: 12.5, color: "#334155" }}>{p.jobs} missions</div>
      <div style={{ fontFamily: "var(--k-font-mono)", fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>
        {p.amount.toLocaleString("fr-FR")} FC
      </div>
      <div>
        {payoutStatusChip(p.status)}
        {p.note && <div style={{ fontSize: 10.5, color: "#B45309", marginTop: 3 }}>{p.note}</div>}
      </div>
    </div>
  );
}

// ─── Shared primitives ─────────────────────────────────────────────────

function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
      <div>
        <h1 style={{
          fontFamily: "var(--k-font-display)", fontWeight: 700,
          fontSize: 26, letterSpacing: "-0.02em", color: "#0F172A", margin: "0 0 4px",
        }}>
          {title}
        </h1>
        <div style={{ fontSize: 13, color: "#64748B" }}>{subtitle}</div>
      </div>
      {action}
    </div>
  );
}

function OpsCard({ title, action, children, style }) {
  return (
    <section style={{ background: "white", border: "1px solid var(--k-border)", borderRadius: 12, padding: 18, boxShadow: "var(--k-e1)", ...style }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <h3 style={{ fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 15, color: "#0F172A", margin: 0 }}>
          {title}
        </h3>
        {action && <button style={{ background: "transparent", border: 0, fontSize: 12, color: "#0EA5E9", fontWeight: 500, cursor: "pointer" }}>{action}</button>}
      </div>
      {children}
    </section>
  );
}

Object.assign(window, { AdminOps });
