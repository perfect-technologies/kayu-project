// Write a review — 5-dimension KAYOU rating
// Triggered after a completed mission. Web + mobile.

const REVIEW_DIMENSIONS = [
  { key: "punctuality",     label: "Ponctualité",       desc: "Arrivé à l'heure ?",          icon: "clock" },
  { key: "quality",         label: "Qualité du travail", desc: "Résultat à la hauteur ?",     icon: "sparkles" },
  { key: "communication",   label: "Communication",      desc: "Clair, réactif, à l'écoute ?", icon: "messageCircle" },
  { key: "value",           label: "Rapport qualité-prix", desc: "Prix juste pour le service ?", icon: "coins" },
  { key: "professionalism", label: "Professionnalisme",  desc: "Respectueux, soigné, sérieux ?", icon: "shieldCheck" },
];

const QUICK_TAGS = [
  "Ponctuel", "Travail propre", "Bon communicant", "Prix honnête",
  "Je recommande", "Expert dans son domaine", "Conseils utiles",
  "Matériel de qualité", "Chantier bien rangé", "Réactif",
];

function DimensionRow({ dim, value, onChange, mobile }) {
  const IconC = I[dim.icon] || I.star;
  return (
    <div style={{
      padding: mobile ? "14px 0" : "18px 0",
      borderBottom: "1px solid var(--k-border-subtle)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "var(--k-surface-primary)", color: "var(--k-primary-hover)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <IconC size={18}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: mobile ? 15 : 16, color: "var(--k-text-primary)" }}>
            {dim.label}
          </div>
          <div className="k-caption" style={{ marginTop: 2 }}>{dim.desc}</div>
        </div>
        {value > 0 && (
          <span className="k-num" style={{
            fontWeight: 600, fontSize: 15, color: "var(--k-text-primary)",
            fontFamily: "var(--k-font-mono)",
          }}>{value}.0</span>
        )}
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-start", paddingLeft: 48 }}>
        {[1,2,3,4,5].map(n => (
          <button key={n} onClick={() => onChange(n)}
            aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
            style={{
              width: mobile ? 36 : 40, height: mobile ? 36 : 40,
              borderRadius: 10,
              border: "1px solid " + (value >= n ? "var(--k-warning)" : "var(--k-border)"),
              background: value >= n ? "var(--k-warning-subtle)" : "var(--k-surface)",
              color: value >= n ? "var(--k-warning)" : "var(--k-text-subtle)",
              cursor: "pointer", padding: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 140ms var(--k-ease-std)",
            }}>
            <I.star size={mobile ? 16 : 18}/>
          </button>
        ))}
      </div>
    </div>
  );
}

function ReviewForm({ provider, mobile, onSubmit, onCancel }) {
  const [ratings, setRatings] = React.useState({});
  const [tags, setTags] = React.useState([]);
  const [text, setText] = React.useState("");
  const [photos, setPhotos] = React.useState([]); // placeholder
  const [step, setStep] = React.useState(mobile ? 1 : 0); // mobile is 3-step wizard

  const overall = React.useMemo(() => {
    const vals = Object.values(ratings);
    if (vals.length === 0) return 0;
    return vals.reduce((a,b) => a+b, 0) / vals.length;
  }, [ratings]);

  const allRated = Object.keys(ratings).length === REVIEW_DIMENSIONS.length;
  const canSubmit = allRated && text.trim().length >= 10;

  const toggleTag = (t) => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  // Web: one-page form. Mobile: 3-step wizard (ratings → tags/photos → review text)
  const webForm = (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ padding: "20px 0 10px" }}>
        <div className="k-overline">Note détaillée</div>
        <div className="k-body-m" style={{ color: "var(--k-text-muted)", marginTop: 4 }}>
          5 dimensions. Touchez où c'est important.
        </div>
      </div>
      {REVIEW_DIMENSIONS.map(d => (
        <DimensionRow key={d.key} dim={d} value={ratings[d.key] || 0}
          onChange={(v) => setRatings({ ...ratings, [d.key]: v })}/>
      ))}

      <div style={{ padding: "24px 0 12px" }}>
        <div className="k-overline">Qu'est-ce qui s'est bien passé ?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {QUICK_TAGS.map(t => (
            <button key={t} onClick={() => toggleTag(t)}
              style={{
                padding: "8px 14px", borderRadius: 999,
                border: "1px solid " + (tags.includes(t) ? "var(--k-primary)" : "var(--k-border)"),
                background: tags.includes(t) ? "var(--k-primary-subtle)" : "var(--k-surface)",
                color: tags.includes(t) ? "var(--k-primary-hover)" : "var(--k-text-body)",
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 6,
                transition: "all 140ms var(--k-ease-std)",
              }}>
              {tags.includes(t) && <I.check size={13}/>}
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "24px 0 12px" }}>
        <div className="k-overline">Votre avis écrit</div>
        <div className="k-body-m" style={{ color: "var(--k-text-muted)", marginTop: 4, marginBottom: 10 }}>
          Partagez ce qui aidera les autres clients. Minimum 10 caractères.
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)}
          placeholder="Raconte comment s'est passée ta mission…"
          style={{
            width: "100%", minHeight: 120,
            padding: 14, borderRadius: "var(--k-r-md)",
            border: "1px solid var(--k-border)", background: "var(--k-surface)",
            fontFamily: "inherit", fontSize: 15, lineHeight: 1.5,
            color: "var(--k-text-primary)", resize: "vertical",
            outline: "none",
          }}/>
        <div className="k-caption" style={{ marginTop: 6, textAlign: "right" }}>
          {text.length} caractères
        </div>
      </div>

      <div style={{ padding: "16px 0 24px" }}>
        <div className="k-overline">Photos (optionnel)</div>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          {photos.map((_, i) => (
            <div key={i} style={{
              width: 80, height: 80, borderRadius: "var(--k-r-md)",
              background: "linear-gradient(135deg, #E0F2FE, #BAE6FD)",
              border: "1px solid var(--k-border)",
            }}/>
          ))}
          <button onClick={() => setPhotos([...photos, 1])}
            style={{
              width: 80, height: 80, borderRadius: "var(--k-r-md)",
              border: "2px dashed var(--k-border-strong)", background: "transparent",
              color: "var(--k-text-muted)", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
            }}>
            <I.plus size={20}/>
            <span style={{ fontSize: 11 }}>Ajouter</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Mobile step views
  const mobileStep1 = (
    <div>
      {REVIEW_DIMENSIONS.map(d => (
        <DimensionRow key={d.key} dim={d} value={ratings[d.key] || 0}
          onChange={(v) => setRatings({ ...ratings, [d.key]: v })} mobile/>
      ))}
    </div>
  );
  const mobileStep2 = (
    <div>
      <div className="k-overline" style={{ marginBottom: 10 }}>Qu'est-ce qui s'est bien passé ?</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {QUICK_TAGS.map(t => (
          <button key={t} onClick={() => toggleTag(t)}
            style={{
              padding: "9px 14px", borderRadius: 999,
              border: "1px solid " + (tags.includes(t) ? "var(--k-primary)" : "var(--k-border)"),
              background: tags.includes(t) ? "var(--k-primary-subtle)" : "var(--k-surface)",
              color: tags.includes(t) ? "var(--k-primary-hover)" : "var(--k-text-body)",
              fontSize: 13, fontWeight: 500, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
            {tags.includes(t) && <I.check size={13}/>}
            {t}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 24 }}>
        <div className="k-overline" style={{ marginBottom: 10 }}>Photos (optionnel)</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {photos.map((_, i) => (
            <div key={i} style={{ width: 72, height: 72, borderRadius: 10, background: "linear-gradient(135deg, #E0F2FE, #BAE6FD)" }}/>
          ))}
          <button onClick={() => setPhotos([...photos, 1])}
            style={{ width: 72, height: 72, borderRadius: 10, border: "2px dashed var(--k-border-strong)", background: "transparent", color: "var(--k-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <I.plus size={20}/>
          </button>
        </div>
      </div>
    </div>
  );
  const mobileStep3 = (
    <div>
      <div className="k-overline">Votre avis écrit</div>
      <p className="k-body-m" style={{ color: "var(--k-text-muted)", marginTop: 4, marginBottom: 12 }}>
        Ce sera visible sur le profil de {provider.firstName}.
      </p>
      <textarea value={text} onChange={e => setText(e.target.value)}
        placeholder="Raconte ta mission…"
        style={{
          width: "100%", minHeight: 180, padding: 14, borderRadius: "var(--k-r-md)",
          border: "1px solid var(--k-border)", background: "var(--k-surface)",
          fontFamily: "inherit", fontSize: 15, lineHeight: 1.5, outline: "none", resize: "vertical",
        }}/>
      <div className="k-caption" style={{ marginTop: 6, textAlign: "right" }}>{text.length} caractères</div>
    </div>
  );

  // ── Web render ─────────────────────────────────────────────────────────
  if (!mobile) {
    return (
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 32px 64px" }}>
        {/* Header */}
        <button onClick={onCancel}
          style={{ border: 0, background: "transparent", color: "var(--k-text-muted)", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 20, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <I.arrowLeft size={15}/> Retour
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <Avatar name={`${provider.firstName} ${provider.lastName}`} bg={provider.avatarBg} size={64} initials={provider.initials}/>
          <div>
            <div className="k-caption" style={{ color: "var(--k-text-muted)" }}>Mission terminée</div>
            <div className="k-display-m" style={{ color: "var(--k-text-primary)", marginTop: 2 }}>
              Comment était {provider.firstName} ?
            </div>
            <div className="k-body-m" style={{ color: "var(--k-text-muted)", marginTop: 4 }}>
              Plomberie · Gombe · aujourd'hui
            </div>
          </div>
        </div>

        {/* Overall banner */}
        <div style={{
          padding: "20px 24px", borderRadius: "var(--k-r-lg)",
          background: overall > 0
            ? `linear-gradient(135deg, var(--k-warning-subtle), var(--k-surface-amber))`
            : "var(--k-surface-primary)",
          border: "1px solid " + (overall > 0 ? "#FCD34D" : "var(--k-border)"),
          display: "flex", alignItems: "center", gap: 16,
          marginBottom: 8,
        }}>
          <div>
            <div className="k-overline">Note globale</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
              <span className="k-num" style={{ fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 40, color: "var(--k-text-primary)" }}>
                {overall > 0 ? overall.toFixed(1) : "—"}
              </span>
              <span className="k-num" style={{ color: "var(--k-text-muted)", fontSize: 14 }}>/ 5</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {[1,2,3,4,5].map(n => (
                <I.star key={n} size={24} color={overall >= n - 0.5 ? "var(--k-warning)" : "#E2E8F0"}/>
              ))}
            </div>
            <div className="k-body-m" style={{ color: "var(--k-text-muted)", marginTop: 6 }}>
              Calculée automatiquement à partir des 5 critères.
            </div>
          </div>
        </div>

        {webForm}

        {/* Submit bar */}
        <div style={{ display: "flex", gap: 12, marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--k-border-subtle)" }}>
          <button onClick={onCancel} className="k-btn k-btn-secondary k-btn-lg" style={{ flex: 1 }}>
            Plus tard
          </button>
          <button disabled={!canSubmit} onClick={() => onSubmit({ ratings, tags, text })}
            className="k-btn k-btn-primary k-btn-lg"
            style={{
              flex: 2, opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? "pointer" : "not-allowed",
            }}>
            Publier l'avis <I.arrowRight size={16}/>
          </button>
        </div>
      </div>
    );
  }

  // ── Mobile render (3 steps) ────────────────────────────────────────────
  const titles = { 1: "Notez la mission", 2: "Ce qui a fonctionné", 3: "Ajoutez un avis écrit" };
  const canAdvance = step === 1 ? allRated : (step === 2 ? true : canSubmit);

  return (
    <div style={{ padding: "12px 20px 120px", minHeight: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
        <button onClick={() => step === 1 ? onCancel() : setStep(step - 1)}
          style={{ border: 0, background: "transparent", padding: 8, marginLeft: -8, cursor: "pointer", color: "var(--k-text-body)" }}>
          <I.arrowLeft size={20}/>
        </button>
        <div className="k-caption" style={{ color: "var(--k-text-muted)" }}>Étape {step} / 3</div>
        <div style={{ flex: 1 }}/>
      </div>

      {/* Progress */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {[1,2,3].map(n => (
          <div key={n} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: n <= step ? "var(--k-primary)" : "var(--k-border)",
          }}/>
        ))}
      </div>

      {/* Provider tag */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <Avatar name={`${provider.firstName} ${provider.lastName}`} bg={provider.avatarBg} size={44} initials={provider.initials}/>
        <div>
          <div style={{ fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 15 }}>{provider.firstName} {provider.lastName}</div>
          <div className="k-caption">{provider.profession}</div>
        </div>
      </div>

      <h2 className="k-heading" style={{ margin: "0 0 18px", color: "var(--k-text-primary)" }}>
        {titles[step]}
      </h2>

      {step === 1 && mobileStep1}
      {step === 2 && mobileStep2}
      {step === 3 && mobileStep3}

      {/* Sticky submit */}
      <div style={{
        position: "fixed", left: 16, right: 16, bottom: 90,
        maxWidth: 358, margin: "0 auto",
      }}>
        <button disabled={!canAdvance}
          onClick={() => step === 3 ? onSubmit({ ratings, tags, text }) : setStep(step + 1)}
          className="k-btn k-btn-primary k-btn-lg"
          style={{
            width: "100%",
            opacity: canAdvance ? 1 : 0.5,
            boxShadow: "0 8px 20px rgba(14,165,233,0.3)",
          }}>
          {step === 3 ? "Publier l'avis" : "Continuer"} <I.arrowRight size={16}/>
        </button>
      </div>
    </div>
  );
}

// Success state — shown after submit
function ReviewSuccess({ provider, overall, mobile, onDone }) {
  return (
    <div style={{
      minHeight: mobile ? "100%" : 600,
      padding: mobile ? "60px 24px" : "80px 32px",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      textAlign: "center",
    }}>
      <div style={{
        width: 88, height: 88, borderRadius: "50%",
        background: "var(--k-success-subtle)", color: "var(--k-success)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 24,
        boxShadow: "0 8px 24px rgba(16,185,129,0.2)",
      }}>
        <I.check size={44} stroke={2.5}/>
      </div>
      <h2 className="k-display-m" style={{ margin: "0 0 10px" }}>Merci pour ton avis !</h2>
      <p className="k-body-l" style={{ color: "var(--k-text-muted)", maxWidth: 380, margin: "0 0 28px" }}>
        Ta note aide la communauté à trouver les bons pros. {provider.firstName} sera notifié.
      </p>
      <button onClick={onDone} className="k-btn k-btn-primary k-btn-lg">
        Retour à l'accueil
      </button>
    </div>
  );
}

function WriteReview({ nav, mobile, providerId }) {
  const provider = PROVIDERS.find(p => p.id === providerId) || PROVIDERS[0];
  const [done, setDone] = React.useState(false);
  const [payload, setPayload] = React.useState(null);

  if (done) {
    const overall = Object.values(payload.ratings).reduce((a,b) => a+b, 0) / 5;
    return <ReviewSuccess provider={provider} overall={overall} mobile={mobile} onDone={() => nav("home")}/>;
  }

  return (
    <ReviewForm provider={provider} mobile={mobile}
      onSubmit={(data) => { setPayload(data); setDone(true); }}
      onCancel={() => nav("home")}/>
  );
}

Object.assign(window, { WriteReview });
