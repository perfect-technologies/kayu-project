// Provider profile page — the hero component. Web + mobile.
function ProviderProfile({ nav, mobile, providerId, onBook }) {
  const p = PROVIDERS.find(x => x.id === providerId) || PROVIDERS[0];
  const [favorited, setFavorited] = React.useState(false);
  const [tab, setTab] = React.useState("about");

  if (mobile) {
    const portfolio = PORTFOLIO_BG[(p.categories[0]) || "plomberie"];
    return (
      <div style={{ background: "var(--k-bg)", minHeight: "100%", paddingBottom: 110 }}>
        {/* Full-bleed photo hero */}
        <div style={{
          position: "relative", aspectRatio: "5 / 4", width: "100%",
          background: portfolio.bg,
          backgroundImage: `radial-gradient(circle at 25% 25%, ${portfolio.accent}2e 0%, transparent 55%), radial-gradient(circle at 75% 80%, ${portfolio.accent}1e 0%, transparent 55%), repeating-linear-gradient(135deg, transparent 0, transparent 22px, ${portfolio.accent}16 22px, ${portfolio.accent}16 23px)`,
          overflow: "hidden",
        }}>
          {/* Floating nav buttons */}
          <div style={{ position: "absolute", top: 14, left: 14, right: 14, display: "flex", justifyContent: "space-between", zIndex: 2 }}>
            <button onClick={() => nav("search")} style={ppFloatBtn}><I.arrowLeft size={18}/></button>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={ppFloatBtn}><I.share size={17}/></button>
              <button onClick={() => setFavorited(f => !f)} style={{ ...ppFloatBtn, color: favorited ? "var(--k-accent)" : "var(--k-text-primary)" }}>
                <I.heart size={17} fill={favorited ? "currentColor" : "none"}/>
              </button>
            </div>
          </div>

          {/* Specialty tag */}
          <div style={{
            position: "absolute", top: 74, left: 16,
            background: "rgba(255,255,255,0.94)", backdropFilter: "blur(6px)",
            borderRadius: 999, padding: "6px 12px",
            fontFamily: "var(--k-font-mono)", fontSize: 11, fontWeight: 600,
            color: portfolio.accent, letterSpacing: "0.04em",
            display: "inline-flex", alignItems: "center", gap: 5,
          }}>
            <portfolio.icon size={12}/> {portfolio.label}
          </div>

          {/* Top-rated bottom-left */}
          {p.topRated && (
            <div style={{
              position: "absolute", left: 16, bottom: 74,
              background: "rgba(15,23,42,0.9)", color: "white",
              padding: "6px 11px", borderRadius: 999,
              fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5,
            }}>
              <I.award size={12}/> Top rated
            </div>
          )}

          {/* Large avatar overlapping bottom */}
          <div style={{
            position: "absolute", left: "50%", bottom: -40,
            transform: "translateX(-50%)",
          }}>
            <div style={{
              padding: 4, borderRadius: "50%", background: "var(--k-bg)",
            }}>
              <Avatar name={`${p.firstName} ${p.lastName}`} bg={p.avatarBg} size={88} initials={p.initials} online={p.online}/>
            </div>
          </div>
        </div>

        {/* Identity */}
        <div style={{ padding: "54px 24px 0", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
            <h1 style={{
              fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 24,
              margin: 0, letterSpacing: "-0.02em",
            }}>{p.firstName} {p.lastName}</h1>
            {p.verified && <I.badgeCheck size={18} color="var(--k-success)"/>}
          </div>
          <div className="k-body-m" style={{ color: "var(--k-text-muted)", marginTop: 3 }}>
            {p.profession}
          </div>
          <div className="k-caption" style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 4, color: "var(--k-text-muted)" }}>
            <I.mapPin size={12}/> {p.city}, {p.commune}
          </div>
        </div>

        {/* Inline stat row — Airbnb style, divided */}
        <div style={{
          margin: "18px 20px 0",
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          borderTop: "1px solid var(--k-border-subtle)",
          borderBottom: "1px solid var(--k-border-subtle)",
          padding: "14px 0",
        }}>
          <div style={ppStatCell}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "var(--k-warning)" }}>
              <I.star size={14}/>
              <span className="k-num" style={{ color: "var(--k-text-primary)", fontWeight: 700, fontSize: 17 }}>{p.rating.toFixed(1)}</span>
            </div>
            <div className="k-caption" style={{ marginTop: 2 }}>{p.reviews} avis</div>
          </div>
          <div style={{ ...ppStatCell, borderLeft: "1px solid var(--k-border-subtle)", borderRight: "1px solid var(--k-border-subtle)" }}>
            <div className="k-num" style={{ fontWeight: 700, fontSize: 17, color: "var(--k-text-primary)" }}>{p.jobs}</div>
            <div className="k-caption" style={{ marginTop: 2 }}>missions</div>
          </div>
          <div style={ppStatCell}>
            <div style={{ fontWeight: 700, fontSize: 17, color: p.response.includes("min") ? "var(--k-success)" : "var(--k-text-primary)" }}>~{p.response}</div>
            <div className="k-caption" style={{ marginTop: 2 }}>réponse</div>
          </div>
        </div>

        {/* Trust chips */}
        <div style={{ padding: "16px 20px 0", display: "flex", gap: 6, flexWrap: "wrap" }}>
          <TrustChip trust={p.trust}/>
          <span className="k-chip k-chip-sm"><I.badgeCheck size={12}/> Identité vérifiée</span>
          <span className="k-chip k-chip-sm"><I.shieldCheck size={12}/> Assurance RC Pro</span>
        </div>

        {/* Sections — divided, not boxed */}
        <div style={{ padding: "24px 20px 0" }}>
          <h2 style={ppSectionTitle}>À propos</h2>
          <div style={{ marginTop: 10 }}><AboutTab p={p}/></div>
        </div>
        <div style={ppDivider}/>

        <div style={{ padding: "24px 20px 0" }}>
          <h2 style={ppSectionTitle}>Évaluations KAYOU</h2>
          <p className="k-caption" style={{ marginTop: 4 }}>Notes par dimension</p>
          <div style={{ marginTop: 14 }}><RatingsTab p={p}/></div>
        </div>
        <div style={ppDivider}/>

        <div style={{ padding: "24px 20px 0" }}>
          <h2 style={ppSectionTitle}>Portfolio</h2>
          <div style={{ marginTop: 12 }}><PortfolioGrid mobile/></div>
        </div>
        <div style={ppDivider}/>

        <div style={{ padding: "24px 20px 0" }}>
          <h2 style={ppSectionTitle}>Avis · {p.reviews}</h2>
          <div style={{ marginTop: 12 }}><ReviewsList p={p}/></div>
        </div>

        {/* Sticky bottom price/reserve bar — Airbnb pattern */}
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 40,
          background: "white", borderTop: "1px solid var(--k-border)",
          padding: "12px 16px 16px",
          display: "flex", gap: 10, alignItems: "center",
          boxShadow: "0 -4px 20px -8px rgba(15,23,42,0.1)",
        }}>
          <div style={{ minWidth: 0, flexShrink: 1 }}>
            <div>
              <span className="k-price" style={{ fontSize: 17, textDecoration: "underline", textUnderlineOffset: 3 }}>
                {p.hourly.toLocaleString("fr-FR")} FC
              </span>
              <span style={{ color: "var(--k-text-muted)", fontSize: 13 }}> /h</span>
            </div>
            <div className="k-caption" style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 1, whiteSpace: "nowrap" }}>
              <I.star size={11} color="var(--k-warning)"/>
              <span className="k-num" style={{ color: "var(--k-text-primary)", fontWeight: 600 }}>{p.rating.toFixed(1)}</span>
              <span>· {p.reviews}</span>
            </div>
          </div>
          <div style={{ flex: 1 }}/>
          <button style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "white", border: "1px solid var(--k-border)", cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            color: "var(--k-text-primary)", flexShrink: 0,
          }}>
            <I.messageCircle size={17}/>
          </button>
          <button className="k-btn k-btn-primary" style={{ padding: "0 20px", height: 46, fontSize: 14, flexShrink: 0 }} onClick={onBook}>
            Réserver
          </button>
        </div>
      </div>
    );
  }

  // WEB
  return (
    <div style={{ background: "var(--k-bg)", minHeight: "100%" }}>
      <WebHeader nav={nav}/>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 40px" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, color: "var(--k-text-muted)", fontSize: 13 }}>
          <a onClick={() => nav("home")} style={{cursor:"pointer"}}>Accueil</a>
          <I.chevronRight size={12}/>
          <a onClick={() => nav("search")} style={{cursor:"pointer"}}>Plombiers</a>
          <I.chevronRight size={12}/>
          <span style={{color:"var(--k-text-primary)"}}>{p.firstName} {p.lastName}</span>
        </div>

        {/* Hero card */}
        <div style={{
          background: "var(--k-surface)", border: "1px solid var(--k-border)",
          borderRadius: "var(--k-r-lg)", boxShadow: "var(--k-e1)",
          padding: 32, position: "relative", overflow: "hidden",
        }}>
          {p.topRated && <TopRatedRibbon/>}
          <div style={{ display: "grid", gridTemplateColumns: "96px 1fr auto", gap: 24, alignItems: "flex-start" }}>
            <Avatar name={`${p.firstName} ${p.lastName}`} bg={p.avatarBg} size={96} initials={p.initials} online={p.online}/>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1 className="k-display-l" style={{ margin: 0 }}>{p.firstName} {p.lastName}</h1>
                {p.verified && <I.badgeCheck size={24} color="var(--k-success)"/>}
              </div>
              <div className="k-body-l" style={{ color: "var(--k-text-body)", marginTop: 6 }}>{p.profession}</div>
              <div style={{ display: "flex", gap: 16, marginTop: 10, color: "var(--k-text-muted)", fontSize: 14, flexWrap: "wrap" }}>
                <span style={{display:"flex", gap:6, alignItems:"center"}}><I.mapPin size={14}/>{p.city}, {p.commune}</span>
                <span style={{display:"flex", gap:6, alignItems:"center", color: p.response.includes("min") ? "var(--k-success)" : undefined}}><I.clock size={14}/>Réponse ~{p.response}</span>
                <span style={{display:"flex", gap:6, alignItems:"center"}}><I.award size={14}/>{p.years} ans d'expérience</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                <TrustChip trust={p.trust}/>
                {p.topRated && <span className="k-chip k-chip-sm k-chip-warning"><I.award size={12}/> Top rated</span>}
                <span className="k-chip k-chip-sm"><I.badgeCheck size={12}/> Identité vérifiée</span>
                <span className="k-chip k-chip-sm"><I.shieldCheck size={12}/> Assurance RC Pro</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={iconBtn}><I.share size={18}/></button>
              <button onClick={() => setFavorited(f => !f)} style={{...iconBtn, color: favorited ? "var(--k-accent)" : "var(--k-text-body)"}}>
                <I.heart size={18} fill={favorited ? "currentColor" : "none"}/>
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, marginTop: 28, paddingTop: 24, borderTop: "1px solid var(--k-border-subtle)" }}>
            <BigStat label="Note globale" value={<StarRating value={p.rating} size={20}/>}/>
            <BigStat label="Avis" value={<span className="k-num" style={bigStatValue}>{p.reviews}</span>}/>
            <BigStat label="Missions réalisées" value={<span className="k-num" style={bigStatValue}>{p.jobs}</span>}/>
            <BigStat label="Taux de réponse" value={<span className="k-num" style={{...bigStatValue, color:"var(--k-success)"}}>98%</span>}/>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, marginTop: 24 }}>
          {/* Left col */}
          <div style={{ display: "grid", gap: 16 }}>
            <Section title="À propos">
              <AboutTab p={p}/>
            </Section>

            <Section title="Évaluations détaillées" subtitle="Notes par dimension (système KAYOU)">
              <RatingsTab p={p}/>
            </Section>

            <Section title="Portfolio" subtitle="Projets récents">
              <PortfolioGrid/>
            </Section>

            <Section title={`Avis (${p.reviews})`}>
              <ReviewsList p={p}/>
            </Section>
          </div>

          {/* Right rail — booking */}
          <aside style={{ position: "sticky", top: 80, alignSelf: "start" }}>
            <div style={{
              background: "var(--k-surface)", border: "1px solid var(--k-border)",
              borderRadius: "var(--k-r-lg)", boxShadow: "var(--k-e2)", padding: 24,
            }}>
              <div className="k-caption" style={{ marginBottom: 4 }}>À partir de</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span className="k-price" style={{ fontSize: 32, letterSpacing: "-0.02em" }}>{p.hourly.toLocaleString("fr-FR")}</span>
                <span className="k-body" style={{ color: "var(--k-text-muted)" }}>FC/h</span>
              </div>
              <div className="k-caption" style={{ marginTop: 6 }}>Devis gratuit · Paiement sécurisé</div>

              <div style={{ background: "var(--k-surface-muted)", borderRadius: "var(--k-r-md)", padding: 14, marginTop: 18, display: "grid", gap: 10 }}>
                <MiniRow icon={<I.calendar size={16}/>} label="Date" value="Sélectionner"/>
                <MiniRow icon={<I.clock size={16}/>} label="Durée" value="~2 heures"/>
                <MiniRow icon={<I.mapPin size={16}/>} label="Adresse" value="Kinshasa, Gombe"/>
              </div>

              <button className="k-btn k-btn-primary k-btn-lg" style={{ width: "100%", marginTop: 16 }} onClick={onBook}>
                Réserver maintenant <I.arrowRight size={16}/>
              </button>
              <button className="k-btn k-btn-secondary" style={{ width: "100%", marginTop: 8 }}>
                <I.messageCircle size={16}/> Envoyer un message
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--k-border-subtle)", color: "var(--k-success)" }}>
                <I.shieldCheck size={16}/>
                <span className="k-caption" style={{color: "var(--k-text-body)"}}>Paiement protégé par KAYOU — libéré quand le travail est fini.</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <WebFooter/>
    </div>
  );
}

const iconBtn = { width: 40, height: 40, borderRadius: "50%", border: "1px solid var(--k-border)", background: "var(--k-surface)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--k-text-body)" };
const bigStatValue = { fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 22, letterSpacing: "-0.02em" };

function StatCell({ label, value }) {
  return (
    <div style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: "var(--k-r-md)", padding: 12 }}>
      <div className="k-caption">{label}</div>
      <div style={{ marginTop: 4, fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 16 }}>{value}</div>
    </div>
  );
}
function BigStat({ label, value }) {
  return (
    <div>
      <div className="k-caption">{label}</div>
      <div style={{ marginTop: 4 }}>{value}</div>
    </div>
  );
}
function MiniRow({ icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ color: "var(--k-text-muted)" }}>{icon}</span>
      <span className="k-body-m" style={{ color: "var(--k-text-muted)", flex: 1 }}>{label}</span>
      <span className="k-body-m" style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
function Section({ title, subtitle, children }) {
  return (
    <section style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: "var(--k-r-lg)", padding: 28 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 className="k-display-m" style={{ margin: 0, fontSize: 22 }}>{title}</h2>
        {subtitle && <div className="k-caption" style={{ marginTop: 4 }}>{subtitle}</div>}
      </div>
      {children}
    </section>
  );
}

function AboutTab({ p }) {
  return (
    <div>
      <p className="k-body-l" style={{ color: "var(--k-text-body)", margin: "0 0 18px" }}>{p.bio}</p>
      <div className="k-overline" style={{ marginBottom: 10 }}>Compétences</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {p.skills.map(s => <span key={s} className="k-chip">{s}</span>)}
      </div>

      <div className="k-overline" style={{ marginTop: 24, marginBottom: 10 }}>Certifications</div>
      <div style={{ display: "grid", gap: 10 }}>
        <CertRow icon={<I.shieldCheck size={18}/>} title="Identité vérifiée" sub="Confirmée par KAYOU le 14 mars 2024"/>
        <CertRow icon={<I.award size={18}/>} title="Formation INPP Kinshasa" sub="Plomberie industrielle — 2018"/>
        <CertRow icon={<I.badgeCheck size={18}/>} title="Assurance RC Pro" sub="SONAS — valide jusqu'en 2027"/>
      </div>

      <div className="k-overline" style={{ marginTop: 24, marginBottom: 10 }}>Zones d'intervention</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {["Gombe", "Lingwala", "Kinshasa Centre", "Limete", "Kasa-Vubu"].map(z => (
          <span key={z} className="k-chip k-chip-primary"><I.mapPin size={12}/> {z}</span>
        ))}
      </div>
    </div>
  );
}

function CertRow({ icon, title, sub }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 12, background: "var(--k-success-subtle)", borderRadius: "var(--k-r-sm)" }}>
      <span style={{ color: "var(--k-success)", marginTop: 2 }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
        <div className="k-caption" style={{ color: "var(--k-text-body)" }}>{sub}</div>
      </div>
    </div>
  );
}

function RatingsTab({ p }) {
  const DIMS = [
    { key: "punctuality", label: "Ponctualité", icon: I.clock },
    { key: "quality", label: "Qualité", icon: I.wrench },
    { key: "communication", label: "Communication", icon: I.messageCircle },
    { key: "value", label: "Rapport qualité/prix", icon: I.coins },
    { key: "professionalism", label: "Professionnalisme", icon: I.award },
  ];
  const scoreColor = (s) => s >= 4 ? "var(--k-success)" : s >= 3 ? "var(--k-warning)" : "var(--k-danger)";
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {DIMS.map(d => {
        const s = p.categoryRatings.find(r => r.c === d.key)?.s ?? 0;
        const color = scoreColor(s);
        return (
          <div key={d.key} style={{ display: "grid", gridTemplateColumns: "24px 1fr auto 120px", gap: 14, alignItems: "center" }}>
            <span style={{ color }}><d.icon size={18}/></span>
            <span className="k-body-m" style={{ fontWeight: 500 }}>{d.label}</span>
            <span className="k-num" style={{ fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 15, color }}>{s}.0</span>
            <div style={{ height: 6, borderRadius: 3, background: "var(--k-border-subtle)", overflow: "hidden" }}>
              <div style={{ width: `${(s/5)*100}%`, height: "100%", background: color, borderRadius: 3 }}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PortfolioGrid({ mobile }) {
  const tiles = [
    { label: "Rénovation salle de bain · Gombe", bg: "#F0F9FF", accent: "#0EA5E9" },
    { label: "Installation chauffe-eau · Lingwala", bg: "#ECFDF5", accent: "#10B981" },
    { label: "Débouchage · Kasa-Vubu", bg: "#FFF1F2", accent: "#FB7185" },
    { label: "Réseau sanitaire villa · Ma Campagne", bg: "#FEF3C7", accent: "#F59E0B" },
    { label: "Réparation fuite · Limete", bg: "#F1F5F9", accent: "#64748B" },
    { label: "Installation lave-linge · Gombe", bg: "#EEF2FF", accent: "#4F46E5" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 10 }}>
      {tiles.map((t, i) => (
        <div key={i} style={{
          aspectRatio: "4/3", borderRadius: "var(--k-r-md)", overflow: "hidden",
          background: t.bg, position: "relative",
          border: "1px solid var(--k-border-subtle)",
          display: "flex", alignItems: "flex-end", padding: 12,
          backgroundImage: `repeating-linear-gradient(135deg, transparent 0, transparent 12px, ${t.accent}14 12px, ${t.accent}14 13px)`,
        }}>
          <div style={{
            fontFamily: "var(--k-font-mono)", fontSize: 10, fontWeight: 500,
            color: t.accent, background: "rgba(255,255,255,0.85)",
            padding: "4px 8px", borderRadius: 4,
          }}>{t.label}</div>
        </div>
      ))}
    </div>
  );
}

function ReviewsList({ p }) {
  const reviews = [
    { name: "Marie K.", initials: "MK", bg: "#FB7185", rating: 5, date: "il y a 3 jours", text: "Très professionnel, travail propre et rapide. Il a diagnostiqué la fuite en 5 minutes et tout était réparé dans l'heure. Je recommande sans hésiter." },
    { name: "Papa Léon", initials: "PL", bg: "#0EA5E9", rating: 5, date: "il y a 1 semaine", text: "Intervention de nuit pour une urgence. Ponctuel, efficace, prix correct. Merci Jean !" },
    { name: "Christelle M.", initials: "CM", bg: "#10B981", rating: 4, date: "il y a 2 semaines", text: "Bon travail sur l'installation de mon chauffe-eau. Petit retard au début mais il a prévenu. Résultat impeccable." },
  ];
  return (
    <div style={{ display: "grid", gap: 20 }}>
      {reviews.map((r, i) => (
        <div key={i} style={{ display: "flex", gap: 14 }}>
          <Avatar name={r.name} bg={r.bg} size={44} initials={r.initials}/>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
                  <StarRating value={r.rating} size={12}/>
                  <span className="k-caption">{r.date}</span>
                </div>
              </div>
            </div>
            <p className="k-body" style={{ color: "var(--k-text-body)", margin: "8px 0 0" }}>{r.text}</p>
          </div>
        </div>
      ))}
      <button className="k-btn k-btn-secondary" style={{ justifySelf: "center", marginTop: 6 }}>Voir tous les avis</button>
    </div>
  );
}

const ppFloatBtn = {
  width: 38, height: 38, borderRadius: "50%",
  background: "rgba(255,255,255,0.96)", border: 0,
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  color: "var(--k-text-primary)", cursor: "pointer",
  boxShadow: "0 2px 8px -2px rgba(15,23,42,0.2)",
  backdropFilter: "blur(6px)",
};
const ppStatCell = { textAlign: "center", padding: "2px 8px" };
const ppSectionTitle = { fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 19, margin: 0, letterSpacing: "-0.02em", color: "var(--k-text-primary)" };
const ppDivider = { height: 1, background: "var(--k-border-subtle)", margin: "24px 20px 0" };

Object.assign(window, { ProviderProfile });
