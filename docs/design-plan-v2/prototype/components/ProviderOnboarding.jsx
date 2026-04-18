// Provider Onboarding — multi-step "become a pro" trust-building flow.
// Steps: 1. Identity  2. Métier  3. Zones  4. Tarifs  5. Photo/bio  6. Publier

const ONBOARDING_STEPS = [
  { n: 1, key: "identity", label: "Identité", icon: "shieldCheck" },
  { n: 2, key: "craft",    label: "Métier",   icon: "wrench" },
  { n: 3, key: "zones",    label: "Zones",    icon: "mapPin" },
  { n: 4, key: "pricing",  label: "Tarifs",   icon: "coins" },
  { n: 5, key: "profile",  label: "Profil",   icon: "user" },
  { n: 6, key: "publish",  label: "Publier",  icon: "sparkles" },
];

const CITIES = [
  { name: "Kinshasa", communes: ["Gombe", "Lemba", "Limete", "Ngaliema", "Kintambo", "Kasa-Vubu", "Bandal"] },
  { name: "Lubumbashi", communes: ["Kamalondo", "Lubumbashi", "Kenya"] },
  { name: "Brazzaville", communes: ["Poto-Poto", "Bacongo", "Makélékélé"] },
  { name: "Pointe-Noire", communes: ["Tié-Tié", "Loandjili"] },
];

function StepIndicator({ step, mobile }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: mobile ? 4 : 8,
      padding: mobile ? "0" : "0 8px",
    }}>
      {ONBOARDING_STEPS.map((s, i) => {
        const done = step > s.n;
        const active = step === s.n;
        const IconC = I[s.icon];
        return (
          <React.Fragment key={s.key}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: mobile ? 30 : 36, height: mobile ? 30 : 36, borderRadius: "50%",
                background: done ? "var(--k-success)" : (active ? "var(--k-primary)" : "var(--k-surface)"),
                color: (done || active) ? "white" : "var(--k-text-muted)",
                border: "2px solid " + (done ? "var(--k-success)" : (active ? "var(--k-primary)" : "var(--k-border)")),
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 200ms var(--k-ease-std)",
                boxShadow: active ? "0 0 0 4px rgba(14,165,233,0.15)" : "none",
              }}>
                {done ? <I.check size={mobile ? 14 : 16} stroke={2.5}/> : <IconC size={mobile ? 14 : 16}/>}
              </div>
              {!mobile && (
                <span style={{ fontSize: 11, fontWeight: 600, color: active ? "var(--k-text-primary)" : "var(--k-text-muted)", letterSpacing: "0.03em", textTransform: "uppercase" }}>
                  {s.label}
                </span>
              )}
            </div>
            {i < ONBOARDING_STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 2, minWidth: mobile ? 10 : 24,
                background: done ? "var(--k-success)" : "var(--k-border)",
                marginBottom: mobile ? 0 : 18,
                transition: "background 200ms var(--k-ease-std)",
              }}/>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function FieldLabel({ label, hint, optional }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <label style={{ fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 14, color: "var(--k-text-primary)" }}>
        {label} {optional && <span className="k-caption" style={{ fontWeight: 400 }}>(optionnel)</span>}
      </label>
      {hint && <div className="k-caption" style={{ marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

// Step 1 — Identity
function StepIdentity({ data, setData, mobile }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{
        padding: 16, borderRadius: "var(--k-r-md)", background: "var(--k-surface-primary)",
        display: "flex", gap: 12, alignItems: "flex-start",
        border: "1px solid #BAE6FD",
      }}>
        <I.shieldCheck size={20} color="var(--k-primary-hover)"/>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: "var(--k-primary-hover)", fontSize: 14 }}>Pourquoi on vérifie</div>
          <div className="k-body-m" style={{ color: "var(--k-text-body)", marginTop: 4 }}>
            Les clients KAYOU choisissent en confiance. Ton identité vérifiée débloque le badge <span className="k-chip k-chip-sm k-chip-success"><I.badgeCheck size={11}/> Vérifié</span> sur ton profil.
          </div>
        </div>
      </div>

      <div>
        <FieldLabel label="Prénom"/>
        <input className="k-input" value={data.firstName || ""} onChange={e => setData({ ...data, firstName: e.target.value })} placeholder="Jean"/>
      </div>
      <div>
        <FieldLabel label="Nom"/>
        <input className="k-input" value={data.lastName || ""} onChange={e => setData({ ...data, lastName: e.target.value })} placeholder="Mubake"/>
      </div>
      <div>
        <FieldLabel label="Numéro de téléphone" hint="Utilisé pour les missions et la vérification par SMS."/>
        <div style={{ display: "flex", gap: 8 }}>
          <div className="k-input" style={{ width: 80, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--k-font-mono)", fontWeight: 600 }}>+243</div>
          <input className="k-input" value={data.phone || ""} onChange={e => setData({ ...data, phone: e.target.value })} placeholder="81 234 5678" style={{ flex: 1 }}/>
        </div>
      </div>

      <div>
        <FieldLabel label="Pièce d'identité" hint="Carte d'électeur, passeport ou permis. Stocké de façon sécurisée."/>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { k: "front", label: "Recto" },
            { k: "back", label: "Verso" },
          ].map(s => (
            <button key={s.k} onClick={() => setData({ ...data, id: { ...data.id, [s.k]: true } })}
              style={{
                padding: "22px 12px", borderRadius: "var(--k-r-md)",
                border: data.id?.[s.k] ? "2px solid var(--k-success)" : "2px dashed var(--k-border-strong)",
                background: data.id?.[s.k] ? "var(--k-success-subtle)" : "var(--k-surface)",
                cursor: "pointer", textAlign: "center",
                color: data.id?.[s.k] ? "var(--k-success)" : "var(--k-text-muted)",
              }}>
              {data.id?.[s.k] ? <I.check size={22}/> : <I.plus size={22}/>}
              <div style={{ fontSize: 12, fontWeight: 600, marginTop: 6 }}>{s.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Step 2 — Métier (craft)
function StepCraft({ data, setData, mobile }) {
  const selected = data.categories || [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <FieldLabel label="Catégorie principale" hint="Tu pourras en ajouter plus tard."/>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 10 }}>
          {CATEGORIES.slice(0, 9).map(c => {
            const IconC = c.icon;
            const isSel = selected.includes(c.slug);
            return (
              <button key={c.slug} onClick={() => setData({ ...data, categories: isSel ? selected.filter(x => x !== c.slug) : [c.slug] })}
                style={{
                  padding: 14, borderRadius: "var(--k-r-md)",
                  border: isSel ? `2px solid ${c.tint}` : "2px solid var(--k-border)",
                  background: isSel ? c.tintBg : "var(--k-surface)",
                  cursor: "pointer", textAlign: "left",
                  display: "flex", gap: 10, alignItems: "center",
                  transition: "all 140ms var(--k-ease-std)",
                }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: c.tintBg, color: c.tint, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IconC size={18}/>
                </div>
                <span style={{ fontWeight: 600, fontSize: 14, color: "var(--k-text-primary)" }}>{c.label}</span>
                {isSel && <I.check size={16} color={c.tint} style={{ marginLeft: "auto" }}/>}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <FieldLabel label="Intitulé de métier" hint="Ex : Plombier certifié, Électricienne agréée SNEL…"/>
        <input className="k-input" value={data.title || ""} onChange={e => setData({ ...data, title: e.target.value })} placeholder="Plombier certifié"/>
      </div>

      <div>
        <FieldLabel label="Années d'expérience"/>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["< 1 an", "1–3 ans", "4–7 ans", "8+ ans"].map((r, i) => (
            <button key={r} onClick={() => setData({ ...data, years: r })}
              style={{
                padding: "10px 16px", borderRadius: 999,
                border: "1px solid " + (data.years === r ? "var(--k-primary)" : "var(--k-border)"),
                background: data.years === r ? "var(--k-primary-subtle)" : "var(--k-surface)",
                color: data.years === r ? "var(--k-primary-hover)" : "var(--k-text-body)",
                fontWeight: 500, fontSize: 13.5, cursor: "pointer",
              }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div>
        <FieldLabel label="Compétences" optional hint="Ajoute 3 à 8 spécialités. Les clients filtrent par compétence."/>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {["Fuites d'eau", "Chauffe-eau", "Installation sanitaire", "Débouchage", "Canalisations", "Évacuations", "Robinetterie", "Salle de bain"].map(s => {
            const isSel = (data.skills || []).includes(s);
            return (
              <button key={s} onClick={() => setData({ ...data, skills: isSel ? (data.skills || []).filter(x => x !== s) : [...(data.skills || []), s] })}
                style={{
                  padding: "8px 12px", borderRadius: 999,
                  border: "1px solid " + (isSel ? "var(--k-text-primary)" : "var(--k-border)"),
                  background: isSel ? "var(--k-text-primary)" : "var(--k-surface)",
                  color: isSel ? "white" : "var(--k-text-body)",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}>
                {isSel && <I.check size={12}/>}
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <FieldLabel label="Certifications" optional hint="Diplôme, formation, agrément."/>
        <button style={{
          padding: "16px", borderRadius: "var(--k-r-md)",
          border: "2px dashed var(--k-border-strong)", background: "transparent",
          color: "var(--k-text-muted)", cursor: "pointer", width: "100%",
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13.5, fontWeight: 500,
        }}>
          <I.plus size={16}/> Ajouter une certification
        </button>
      </div>
    </div>
  );
}

// Step 3 — Zones
function StepZones({ data, setData, mobile }) {
  const zones = data.zones || [];
  const toggleCommune = (city, commune) => {
    const key = `${city}|${commune}`;
    setData({ ...data, zones: zones.includes(key) ? zones.filter(x => x !== key) : [...zones, key] });
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <FieldLabel label="Rayon d'intervention" hint={`Actuel : ${data.radius || 10} km autour de ta zone`}/>
        <input type="range" min="1" max="30" value={data.radius || 10}
          onChange={e => setData({ ...data, radius: +e.target.value })}
          style={{ width: "100%", accentColor: "var(--k-primary)" }}/>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--k-text-muted)", marginTop: 2, fontFamily: "var(--k-font-mono)" }}>
          <span>1 km</span><span>{data.radius || 10} km</span><span>30 km</span>
        </div>
      </div>

      <div>
        <FieldLabel label="Communes desservies" hint="Choisis au moins une commune."/>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {CITIES.map(city => (
            <div key={city.name}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "var(--k-text-primary)", marginBottom: 8 }}>
                {city.name}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {city.communes.map(c => {
                  const key = `${city.name}|${c}`;
                  const isSel = zones.includes(key);
                  return (
                    <button key={c} onClick={() => toggleCommune(city.name, c)}
                      style={{
                        padding: "7px 11px", borderRadius: 999,
                        border: "1px solid " + (isSel ? "var(--k-primary)" : "var(--k-border)"),
                        background: isSel ? "var(--k-primary-subtle)" : "var(--k-surface)",
                        color: isSel ? "var(--k-primary-hover)" : "var(--k-text-body)",
                        fontSize: 12.5, fontWeight: 500, cursor: "pointer",
                      }}>
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Step 4 — Pricing
function StepPricing({ data, setData, mobile }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{
        padding: 16, borderRadius: "var(--k-r-md)", background: "var(--k-surface-amber)",
        border: "1px solid #FDE68A", display: "flex", gap: 12,
      }}>
        <I.coins size={20} color="#B45309"/>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: "#92400E", fontSize: 14 }}>Tarif moyen des plombiers à Kinshasa</div>
          <div className="k-body-m" style={{ color: "#78350F", marginTop: 2 }}>
            <span className="k-num" style={{ fontFamily: "var(--k-font-mono)", fontWeight: 700 }}>12 000 – 18 000 FC</span> / heure. Tu peux ajuster à tout moment.
          </div>
        </div>
      </div>

      <div>
        <FieldLabel label="Tarif horaire" hint="Prix que tu affiches. Les clients voient toujours un total estimé avant de réserver."/>
        <div style={{ position: "relative" }}>
          <input className="k-input" type="number" value={data.hourly || ""} onChange={e => setData({ ...data, hourly: +e.target.value })} placeholder="15000"
            style={{ paddingRight: 70, fontFamily: "var(--k-font-mono)", fontWeight: 600, fontSize: 18 }}/>
          <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "var(--k-text-muted)", fontFamily: "var(--k-font-mono)", fontWeight: 600, fontSize: 14 }}>
            FC / h
          </div>
        </div>
      </div>

      <div>
        <FieldLabel label="Déplacement" hint="Frais fixes pour te rendre chez le client."/>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { k: "free", label: "Gratuit", sub: "Dans ma zone" },
            { k: "fixed", label: "Forfait", sub: "5 000 FC" },
          ].map(o => {
            const isSel = (data.travelMode || "free") === o.k;
            return (
              <button key={o.k} onClick={() => setData({ ...data, travelMode: o.k })}
                style={{
                  padding: "14px", borderRadius: "var(--k-r-md)",
                  border: "2px solid " + (isSel ? "var(--k-primary)" : "var(--k-border)"),
                  background: isSel ? "var(--k-primary-subtle)" : "var(--k-surface)",
                  cursor: "pointer", textAlign: "left",
                }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--k-text-primary)" }}>{o.label}</div>
                <div className="k-caption" style={{ marginTop: 2 }}>{o.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <FieldLabel label="Paiement Mobile Money" hint="Comment tu reçois tes paiements."/>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { k: "airtel", label: "Airtel Money", color: "#E11D48" },
            { k: "mpesa",  label: "M-Pesa",       color: "#059669" },
            { k: "orange", label: "Orange Money", color: "#F59E0B" },
          ].map(o => {
            const isSel = data.payment === o.k;
            return (
              <button key={o.k} onClick={() => setData({ ...data, payment: o.k })}
                style={{
                  padding: "14px 16px", borderRadius: "var(--k-r-md)",
                  border: "1px solid " + (isSel ? o.color : "var(--k-border)"),
                  background: isSel ? "#fafafa" : "var(--k-surface)",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: o.color, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>
                  {o.label[0]}
                </div>
                <span style={{ fontWeight: 600, fontSize: 14, flex: 1, textAlign: "left" }}>{o.label}</span>
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid " + (isSel ? o.color : "var(--k-border-strong)"), display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {isSel && <div style={{ width: 10, height: 10, borderRadius: "50%", background: o.color }}/>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Step 5 — Profile (bio + photo)
function StepProfile({ data, setData, mobile }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <FieldLabel label="Photo de profil" hint="Une photo claire, visage visible. Double la confiance des clients."/>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{
            width: 88, height: 88, borderRadius: "50%",
            background: data.photo ? "linear-gradient(135deg, #0EA5E9, #0284C7)" : "var(--k-surface-muted)",
            border: "2px dashed " + (data.photo ? "transparent" : "var(--k-border-strong)"),
            display: "flex", alignItems: "center", justifyContent: "center",
            color: data.photo ? "white" : "var(--k-text-subtle)",
            fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 32,
          }}>
            {data.photo ? (data.firstName?.[0] || "J") + (data.lastName?.[0] || "M") : <I.user size={32}/>}
          </div>
          <button onClick={() => setData({ ...data, photo: !data.photo })}
            className="k-btn k-btn-secondary">
            {data.photo ? "Remplacer" : "Ajouter une photo"}
          </button>
        </div>
      </div>

      <div>
        <FieldLabel label="À propos de toi" hint="2–3 phrases. Qu'est-ce qui fait ta différence ?"/>
        <textarea value={data.bio || ""} onChange={e => setData({ ...data, bio: e.target.value })}
          placeholder="Plombier depuis 2018, formé à l'INPP Kinshasa. Je réponds en moins de 30 min et garantis mes interventions."
          style={{
            width: "100%", minHeight: 110, padding: 14, borderRadius: "var(--k-r-md)",
            border: "1px solid var(--k-border)", background: "var(--k-surface)",
            fontFamily: "inherit", fontSize: 14.5, lineHeight: 1.5, outline: "none", resize: "vertical",
          }}/>
        <div className="k-caption" style={{ marginTop: 4, textAlign: "right" }}>{(data.bio || "").length} / 400</div>
      </div>

      <div>
        <FieldLabel label="Portfolio" optional hint="Photos de tes chantiers terminés. 3 à 8 photos recommandé."/>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr 1fr" : "repeat(4, 1fr)", gap: 8 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              aspectRatio: "1/1", borderRadius: 10,
              background: i < (data.portfolio || 0)
                ? `linear-gradient(135deg, ${["#0EA5E9","#10B981","#F59E0B","#FB7185"][i]}, #fff)`
                : "var(--k-surface-muted)",
              border: i < (data.portfolio || 0) ? 0 : "2px dashed var(--k-border-strong)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--k-text-muted)",
            }}
            onClick={() => setData({ ...data, portfolio: Math.min(4, (data.portfolio || 0) + 1) })}>
              {i >= (data.portfolio || 0) && <I.plus size={20}/>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Step 6 — Publish preview
function StepPublish({ data, mobile }) {
  const cat = CATEGORIES.find(c => c.slug === (data.categories?.[0] || "plomberie"));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{
        padding: 18, borderRadius: "var(--k-r-lg)",
        background: "linear-gradient(135deg, var(--k-surface-primary), var(--k-surface))",
        border: "1px solid #BAE6FD",
      }}>
        <div className="k-overline" style={{ color: "var(--k-primary-hover)" }}>Aperçu de ton profil</div>
        <div style={{ display: "flex", gap: 14, marginTop: 12, alignItems: "flex-start" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg, #0EA5E9, #0284C7)",
            color: "white", display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 24,
          }}>
            {(data.firstName?.[0] || "J")}{(data.lastName?.[0] || "M")}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 18, color: "var(--k-text-primary)" }}>
              {data.firstName || "Jean"} {data.lastName || "Mubake"}
            </div>
            <div className="k-body-m" style={{ color: "var(--k-text-muted)", marginTop: 2 }}>
              {data.title || "Plombier certifié"}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              <span className="k-chip k-chip-sm k-chip-success"><I.badgeCheck size={12}/> Nouveau · Vérifié</span>
              <span className="k-chip k-chip-sm"><I.award size={12}/> {data.years || "4–7 ans"}</span>
              <span className="k-chip k-chip-sm"><I.mapPin size={12}/> {(data.zones || []).length || 3} zones</span>
            </div>
            <p className="k-body-m" style={{ color: "var(--k-text-body)", marginTop: 10 }}>
              {data.bio || "Plombier depuis 2018, formé à l'INPP Kinshasa. Je réponds en moins de 30 min et garantis mes interventions."}
            </p>
            <div style={{ paddingTop: 12, marginTop: 12, borderTop: "1px solid var(--k-border-subtle)" }}>
              <span className="k-price" style={{ fontSize: 18, color: "var(--k-text-primary)" }}>
                {(data.hourly || 15000).toLocaleString("fr-FR")} FC
              </span>
              <span style={{ color: "var(--k-text-muted)", fontSize: 14 }}> /heure</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: 16, borderRadius: "var(--k-r-md)", background: "var(--k-surface)", border: "1px solid var(--k-border)" }}>
        <div style={{ fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
          Prochaines étapes après publication
        </div>
        {[
          { icon: "check", label: "Profil vérifié sous 24h", done: true },
          { icon: "sparkles", label: "Badge « Nouveau » pendant 30 jours" },
          { icon: "award", label: "Débloque « De confiance » après 10 missions notées" },
        ].map((n, i) => {
          const IconC = I[n.icon];
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", color: "var(--k-text-body)", fontSize: 13.5 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--k-surface-primary)", color: "var(--k-primary-hover)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <IconC size={13}/>
              </div>
              {n.label}
            </div>
          );
        })}
      </div>

      <label style={{ display: "flex", gap: 10, padding: 14, borderRadius: "var(--k-r-md)", border: "1px solid var(--k-border)", cursor: "pointer", fontSize: 13.5, color: "var(--k-text-body)", lineHeight: 1.45 }}>
        <input type="checkbox" style={{ marginTop: 2 }}/>
        J'accepte les <a style={{ color: "var(--k-primary-hover)", fontWeight: 600 }}>conditions d'utilisation pro</a> et le code de conduite KAYOU.
      </label>
    </div>
  );
}

function ProviderOnboarding({ nav, mobile }) {
  const [step, setStep] = React.useState(1);
  const [data, setData] = React.useState({
    firstName: "Jean", lastName: "Mubake", phone: "", id: {},
    categories: ["plomberie"], title: "Plombier certifié", years: "4–7 ans",
    skills: ["Fuites d'eau", "Chauffe-eau"], zones: ["Kinshasa|Gombe"], radius: 10,
    hourly: 15000, travelMode: "free", payment: "airtel",
    photo: false, bio: "", portfolio: 0,
  });

  const body = (() => {
    if (step === 1) return <StepIdentity data={data} setData={setData} mobile={mobile}/>;
    if (step === 2) return <StepCraft data={data} setData={setData} mobile={mobile}/>;
    if (step === 3) return <StepZones data={data} setData={setData} mobile={mobile}/>;
    if (step === 4) return <StepPricing data={data} setData={setData} mobile={mobile}/>;
    if (step === 5) return <StepProfile data={data} setData={setData} mobile={mobile}/>;
    return <StepPublish data={data} mobile={mobile}/>;
  })();

  const titles = {
    1: "Vérifions ton identité",
    2: "Quel est ton métier ?",
    3: "Où tu interviens ?",
    4: "Définis tes tarifs",
    5: "Complète ton profil",
    6: "Prêt à publier",
  };
  const subs = {
    1: "Ces infos restent privées. Elles servent uniquement à te vérifier.",
    2: "Précise ton savoir-faire pour être trouvé par les bons clients.",
    3: "Les clients te voient si tu couvres leur quartier.",
    4: "Tu peux modifier à tout moment depuis ton dashboard.",
    5: "Une photo et un bon texte font toute la différence.",
    6: "Un dernier coup d'œil avant de te lancer.",
  };

  // Shared nav bar
  const navBar = (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      {step > 1 && (
        <button onClick={() => setStep(step - 1)} className="k-btn k-btn-secondary">
          <I.arrowLeft size={15}/> Retour
        </button>
      )}
      <div style={{ flex: 1 }}/>
      <button onClick={() => step === 6 ? nav("provider") : setStep(step + 1)}
        className="k-btn k-btn-primary k-btn-lg">
        {step === 6 ? "Publier mon profil" : "Continuer"} <I.arrowRight size={16}/>
      </button>
    </div>
  );

  // ── Mobile ───────────────────────────────────────────────────────────
  if (mobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", paddingBottom: 120 }}>
        <div style={{
          position: "sticky", top: 0, zIndex: 10, background: "var(--k-bg)",
          padding: "12px 20px 14px", borderBottom: "1px solid var(--k-border-subtle)",
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
            <button onClick={() => step === 1 ? nav("home") : setStep(step - 1)}
              style={{ border: 0, background: "transparent", padding: 6, marginLeft: -6, cursor: "pointer", color: "var(--k-text-body)" }}>
              <I.arrowLeft size={20}/>
            </button>
            <div className="k-caption" style={{ marginLeft: 4 }}>Étape {step} / 6</div>
          </div>
          <StepIndicator step={step} mobile/>
        </div>

        <div style={{ padding: "20px 20px 30px" }}>
          <h2 className="k-display-m" style={{ margin: "0 0 6px", fontSize: 22 }}>{titles[step]}</h2>
          <p className="k-body-m" style={{ color: "var(--k-text-muted)", margin: "0 0 22px" }}>{subs[step]}</p>
          {body}
        </div>

        <div style={{
          position: "fixed", left: 16, right: 16, bottom: 30,
          maxWidth: 358, margin: "0 auto",
        }}>
          <button onClick={() => step === 6 ? nav("provider") : setStep(step + 1)}
            className="k-btn k-btn-primary k-btn-lg"
            style={{ width: "100%", boxShadow: "0 8px 20px rgba(14,165,233,0.3)" }}>
            {step === 6 ? "Publier mon profil" : "Continuer"} <I.arrowRight size={16}/>
          </button>
        </div>
      </div>
    );
  }

  // ── Web ──────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "28px 32px 60px", maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <I.logo size={32}/>
        <div style={{ fontFamily: "var(--k-font-display)", fontWeight: 700, letterSpacing: "-0.01em", fontSize: 18 }}>KAYOU</div>
        <span className="k-chip k-chip-sm k-chip-primary">Devenir pro</span>
        <div style={{ flex: 1 }}/>
        <button className="k-btn k-btn-ghost k-btn-sm" onClick={() => nav("home")}>Quitter</button>
      </div>

      {/* Stepper */}
      <div style={{ marginBottom: 32 }}>
        <StepIndicator step={step}/>
      </div>

      {/* Title */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="k-display-l" style={{ margin: "0 0 6px", fontSize: 32 }}>{titles[step]}</h1>
        <p className="k-body-l" style={{ color: "var(--k-text-muted)", margin: 0 }}>{subs[step]}</p>
      </div>

      {/* Body */}
      <div style={{
        background: "var(--k-surface)", border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-lg)", padding: 32,
        boxShadow: "var(--k-e1)",
      }}>
        {body}
      </div>

      {/* Nav */}
      <div style={{ marginTop: 24 }}>{navBar}</div>
    </div>
  );
}

Object.assign(window, { ProviderOnboarding });
