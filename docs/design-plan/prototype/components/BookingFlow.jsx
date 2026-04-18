// Booking flow with Kayou Moment
function BookingFlow({ nav, mobile, providerId, onDone }) {
  const p = PROVIDERS.find(x => x.id === providerId) || PROVIDERS[0];
  const [step, setStep] = React.useState(0); // 0 service, 1 date, 2 confirm, 3 celebrate
  const [service, setService] = React.useState("Dépannage urgent");
  const [duration, setDuration] = React.useState(2);
  const [date, setDate] = React.useState(18);
  const [time, setTime] = React.useState("10:00");
  const [address, setAddress] = React.useState("Av. Colonel Lukusa 47, Gombe, Kinshasa");
  const [note, setNote] = React.useState("Fuite sous l'évier de la cuisine. Urgence.");

  const total = p.hourly * duration;

  if (step === 3) return <KayouMoment client={{initials:"AM", bg:"#FB7185"}} provider={p} mobile={mobile} onDone={onDone}/>;

  if (mobile) {
    return <MobileBooking {...{nav, p, step, setStep, service, setService, duration, setDuration, date, setDate, time, setTime, address, setAddress, note, setNote, total}}/>;
  }

  const steps = [
    { label: "Service" },
    { label: "Date & heure" },
    { label: "Confirmation" },
  ];

  const bodyWidth = 560;

  const Container = ({ children }) => (
    <div style={{ background: "var(--k-bg)", minHeight: "100%", padding: "24px 0 60px" }}>
      <div style={{ width: bodyWidth, maxWidth: "100%", margin: "0 auto" }}>
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => step === 0 ? nav("profile", p.id) : setStep(s => s-1)} style={iconBtn}><I.arrowLeft size={18}/></button>
          <h1 className="k-display-m" style={{ margin: 0 }}>Réserver avec {p.firstName}</h1>
        </div>

        {/* Stepper */}
        {step < 3 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ flex: 1 }}>
                <div style={{ height: 4, borderRadius: 2, background: i <= step ? "var(--k-primary)" : "var(--k-border)", transition: "background 240ms" }}/>
                <div className="k-caption" style={{ marginTop: 6, color: i === step ? "var(--k-text-primary)" : "var(--k-text-muted)", fontWeight: i === step ? 600 : 500 }}>
                  {i+1}. {s.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Provider mini-card */}
        {step < 3 && (
          <div style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: "var(--k-r-md)", padding: 14, display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
            <Avatar name={`${p.firstName} ${p.lastName}`} bg={p.avatarBg} size={44} initials={p.initials}/>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontWeight: 600 }}>{p.firstName} {p.lastName}</span>
                {p.verified && <I.badgeCheck size={14} color="var(--k-success)"/>}
              </div>
              <div className="k-caption">{p.profession}</div>
            </div>
            <StarRating value={p.rating} count={p.reviews} size={13}/>
          </div>
        )}

        {children}
      </div>
    </div>
  );

  return (
    <Container>
      {step === 0 && (
        <div>
          <h2 className="k-heading" style={{ marginTop: 0 }}>Quel service ?</h2>
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {["Dépannage urgent", "Installation nouvelle", "Devis / diagnostic", "Rénovation complète"].map(s => (
              <label key={s} style={{
                display: "flex", alignItems: "center", gap: 12, padding: 16,
                background: "var(--k-surface)", border: `1px solid ${service === s ? "var(--k-primary)" : "var(--k-border)"}`,
                borderRadius: "var(--k-r-md)", cursor: "pointer",
                boxShadow: service === s ? "0 0 0 3px rgba(14,165,233,0.12)" : "none",
              }}>
                <input type="radio" name="service" checked={service === s} onChange={() => setService(s)}/>
                <span style={{ flex: 1, fontWeight: 500, fontSize: 15 }}>{s}</span>
                {service === s && <I.check size={18} color="var(--k-primary)"/>}
              </label>
            ))}
          </div>

          <div style={{ marginTop: 24 }}>
            <label className="k-overline" style={{display:"block", marginBottom:8}}>Durée estimée</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[1, 2, 4, 8].map(h => (
                <button key={h} onClick={() => setDuration(h)} style={{
                  flex: 1, height: 44, borderRadius: "var(--k-r-md)",
                  border: `1px solid ${duration === h ? "var(--k-primary)" : "var(--k-border)"}`,
                  background: duration === h ? "var(--k-primary-subtle)" : "var(--k-surface)",
                  color: duration === h ? "var(--k-primary-hover)" : "var(--k-text-body)",
                  fontWeight: 600, cursor: "pointer",
                }}>
                  {h}h
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <label className="k-overline" style={{display:"block", marginBottom:8}}>Décris ton besoin</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
              style={{
                width: "100%", padding: 12, border: "1px solid var(--k-border)",
                borderRadius: "var(--k-r-md)", background: "var(--k-surface)",
                fontFamily: "inherit", fontSize: 14, resize: "vertical",
              }}/>
          </div>

          <button className="k-btn k-btn-primary k-btn-lg" style={{ width: "100%", marginTop: 24 }} onClick={() => setStep(1)}>
            Continuer <I.arrowRight size={16}/>
          </button>
        </div>
      )}

      {step === 1 && (
        <div>
          <h2 className="k-heading" style={{ marginTop: 0 }}>Quand ?</h2>
          <MiniCalendar selected={date} onSelect={setDate}/>

          <div style={{ marginTop: 20 }}>
            <div className="k-overline" style={{marginBottom:8}}>Créneaux disponibles</div>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(3, 1fr)" : "repeat(4, 1fr)", gap: 8 }}>
              {["08:00", "10:00", "14:00", "16:00", "18:00"].map(t => (
                <button key={t} onClick={() => setTime(t)} style={{
                  height: 42, borderRadius: "var(--k-r-md)",
                  border: `1px solid ${time === t ? "var(--k-primary)" : "var(--k-border)"}`,
                  background: time === t ? "var(--k-primary-subtle)" : "var(--k-surface)",
                  color: time === t ? "var(--k-primary-hover)" : "var(--k-text-body)",
                  fontWeight: 600, cursor: "pointer", fontFamily: "var(--k-font-mono)",
                }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <label className="k-overline" style={{display:"block", marginBottom:8}}>Adresse d'intervention</label>
            <input value={address} onChange={e => setAddress(e.target.value)} className="k-input"/>
          </div>

          <button className="k-btn k-btn-primary k-btn-lg" style={{ width: "100%", marginTop: 24 }} onClick={() => setStep(2)}>
            Continuer <I.arrowRight size={16}/>
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="k-heading" style={{ marginTop: 0 }}>Récapitulatif</h2>

          <div style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: "var(--k-r-md)", padding: 18, marginTop: 12 }}>
            <SumRow label="Service" value={service}/>
            <SumRow label="Durée estimée" value={`${duration}h`}/>
            <SumRow label="Date" value={`Mer. ${date} avril · ${time}`}/>
            <SumRow label="Adresse" value={address} multiline/>
            <SumRow label="Note" value={note} multiline last/>
          </div>

          <div style={{ background: "var(--k-surface-primary)", border: "1px solid #BAE6FD", borderRadius: "var(--k-r-md)", padding: 18, marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--k-text-body)" }}>
              <span>{p.hourly.toLocaleString("fr-FR")} FC × {duration}h</span>
              <span className="k-price">{(p.hourly*duration).toLocaleString("fr-FR")} FC</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--k-text-muted)", marginTop: 6 }}>
              <span>Frais de service</span>
              <span className="k-price" style={{color:"var(--k-text-body)"}}>{(total*0.07).toLocaleString("fr-FR", {maximumFractionDigits:0})} FC</span>
            </div>
            <div style={{ height: 1, background: "#BAE6FD", margin: "12px 0" }}/>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span className="k-heading" style={{ margin: 0 }}>Total estimé</span>
              <span className="k-price" style={{ fontSize: 22, color: "var(--k-primary-hover)" }}>
                {(total*1.07).toLocaleString("fr-FR", {maximumFractionDigits:0})} FC
              </span>
            </div>
            <div className="k-caption" style={{ marginTop: 8, display: "flex", gap: 6, alignItems: "center" }}>
              <I.shieldCheck size={12} color="var(--k-success)"/> Paiement à la fin du travail · remboursement garanti
            </div>
          </div>

          <button className="k-btn k-btn-primary k-btn-lg" style={{ width: "100%", marginTop: 18 }} onClick={() => setStep(3)}>
            Confirmer la réservation
          </button>
          <div className="k-caption" style={{ textAlign: "center", marginTop: 10 }}>
            En confirmant, tu acceptes les <a style={{color:"var(--k-primary-hover)"}}>conditions générales</a>.
          </div>
        </div>
      )}
    </Container>
  );
}

function SumRow({ label, value, multiline, last }) {
  return (
    <div style={{ padding: "12px 0", borderBottom: last ? 0 : "1px solid var(--k-border-subtle)",
      display: "grid", gridTemplateColumns: multiline ? "1fr" : "140px 1fr", gap: multiline ? 4 : 12 }}>
      <div className="k-caption">{label}</div>
      <div className="k-body-m" style={{ fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function MiniCalendar({ selected, onSelect }) {
  const days = ["L", "M", "M", "J", "V", "S", "D"];
  const grid = Array.from({ length: 35 }, (_, i) => i - 1);
  return (
    <div style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: "var(--k-r-md)", padding: 16, marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <button style={iconBtn}><I.arrowLeft size={16}/></button>
        <span style={{ fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 16 }}>Avril 2026</span>
        <button style={iconBtn}><I.arrowRight size={16}/></button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 6 }}>
        {days.map((d, i) => <div key={i} className="k-caption" style={{ textAlign: "center" }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {grid.map((d) => {
          const valid = d >= 1 && d <= 30;
          const isPast = d < 18;
          const isAvail = valid && !isPast && [18, 19, 20, 22, 24, 25, 27].includes(d);
          const isSel = d === selected;
          return (
            <button key={d} disabled={!isAvail} onClick={() => isAvail && onSelect(d)} style={{
              aspectRatio: "1/1", border: 0, borderRadius: 8,
              background: isSel ? "var(--k-primary)" : "transparent",
              color: isSel ? "white" : (isAvail ? "var(--k-text-primary)" : "var(--k-text-subtle)"),
              cursor: isAvail ? "pointer" : "default",
              fontSize: 13, fontWeight: isSel ? 700 : 500,
              position: "relative", opacity: valid ? 1 : 0,
            }}>
              {valid ? d : ""}
              {isAvail && !isSel && <div style={{ position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)", width: 3, height: 3, borderRadius: "50%", background: "var(--k-success)" }}/>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── THE KAYOU MOMENT ────────────────────────────────────────────────────────
function KayouMoment({ client, provider, mobile, onDone }) {
  const [phase, setPhase] = React.useState(0);
  React.useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 2300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const W = 320, H = 120;
  const clientX = 40, provX = W - 40, Y = H - 30;
  // Control point above midline for arc
  const cx = W / 2, cy = 10;

  return (
    <div style={{ background: "var(--k-bg)", minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center" }}>
      <style>{`
        @keyframes kmDot { 0% { offset-distance: 0%; opacity: 0; } 10% { opacity: 1 } 90% { opacity: 1 } 100% { offset-distance: 100%; opacity: 0; } }
        @keyframes kmPath { 0% { stroke-dashoffset: 400; opacity: 0.8 } 100% { stroke-dashoffset: 0; opacity: 0 } }
        @keyframes kmPulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.08) } }
        @keyframes kmPop { 0% { transform: scale(0.6); opacity: 0 } 60% { transform: scale(1.15); opacity: 1 } 100% { transform: scale(1); opacity: 1 } }
        @keyframes kmRise { 0% { transform: translateY(12px); opacity: 0 } 100% { transform: translateY(0); opacity: 1 } }
      `}</style>

      {/* success circle */}
      <div style={{
        width: 96, height: 96, borderRadius: "50%",
        background: "var(--k-success-subtle)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 24,
        animation: "kmPop 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "var(--k-success)", color: "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "kmPulse 2400ms var(--k-ease-std) infinite",
        }}>
          <I.check size={36} stroke={2.5}/>
        </div>
      </div>

      <h1 className="k-display-l" style={{ margin: "0 0 10px", fontSize: mobile ? 28 : 36, animation: "kmRise 500ms 200ms both" }}>
        C'est noté !
      </h1>
      <p className="k-body-l" style={{ color: "var(--k-text-body)", margin: "0 0 28px", maxWidth: 420, animation: "kmRise 500ms 320ms both" }}>
        <b>{provider.firstName}</b> te recontacte sous <b className="k-num">~{provider.response}</b> pour confirmer les détails.
      </p>

      {/* The arc */}
      <div style={{
        position: "relative", width: W, height: H,
        animation: "kmRise 600ms 440ms both",
      }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <path id="kmArc" d={`M ${clientX} ${Y} Q ${cx} ${cy} ${provX} ${Y}`}/>
          </defs>
          {/* trail */}
          <path d={`M ${clientX} ${Y} Q ${cx} ${cy} ${provX} ${Y}`}
            fill="none" stroke="#FB7185" strokeWidth="2" strokeLinecap="round"
            strokeDasharray="400" strokeDashoffset="400"
            style={{ animation: phase >= 1 ? "kmPath 2000ms cubic-bezier(0.3, 0, 0, 1) forwards" : "none" }}/>
          {/* traveling dot */}
          {phase >= 1 && (
            <circle r="6" fill="#FB7185" style={{
              offsetPath: `path('M ${clientX} ${Y} Q ${cx} ${cy} ${provX} ${Y}')`,
              animation: "kmDot 2000ms cubic-bezier(0.3, 0, 0, 1) forwards",
              filter: "drop-shadow(0 0 8px rgba(251,113,133,0.7))",
            }}/>
          )}
        </svg>
        {/* Avatars */}
        <div style={{ position: "absolute", left: clientX - 28, top: Y - 28 }}>
          <Avatar name="A M" bg={client.bg} size={56} initials={client.initials}/>
          <div className="k-caption" style={{ textAlign: "center", marginTop: 6, fontWeight: 600, color: "var(--k-text-primary)" }}>Toi</div>
        </div>
        <div style={{ position: "absolute", left: provX - 28, top: Y - 28,
          animation: phase >= 2 ? "kmPulse 900ms cubic-bezier(0.34, 1.56, 0.64, 1)" : "none" }}>
          <Avatar name={provider.firstName} bg={provider.avatarBg} size={56} initials={provider.initials} online={true}/>
          <div className="k-caption" style={{ textAlign: "center", marginTop: 6, fontWeight: 600, color: "var(--k-text-primary)" }}>{provider.firstName}</div>
        </div>
      </div>

      <div style={{ marginTop: 36, background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: "var(--k-r-md)", padding: 16, width: "min(420px, 100%)", animation: "kmRise 600ms 600ms both" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, textAlign: "left" }}>
          <div>
            <div className="k-caption">Référence</div>
            <div className="k-price" style={{ fontSize: 14 }}>#KY-4829-AM</div>
          </div>
          <div>
            <div className="k-caption">Date</div>
            <div className="k-body-m" style={{ fontWeight: 600 }}>Mer. 18 avril · 10:00</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 24, width: "min(420px, 100%)", animation: "kmRise 600ms 720ms both" }}>
        <button className="k-btn k-btn-secondary" style={{ flex: 1 }} onClick={onDone}>
          <I.messageCircle size={16}/> Message
        </button>
        <button className="k-btn k-btn-primary" style={{ flex: 1.2 }} onClick={onDone}>
          Voir ma réservation
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { BookingFlow, KayouMoment });

// ─── Airbnb-style mobile booking ─────────────────────────────────────────
function MobileBooking({ nav, p, step, setStep, service, setService, duration, setDuration, date, setDate, time, setTime, address, setAddress, note, setNote, total }) {
  const portfolio = PORTFOLIO_BG[(p.categories[0]) || "plomberie"];
  const stepTitle = ["Quel service ?", "Quand ça t'arrange ?", "Récapitulatif"][step];
  const stepCount = 3;

  const handleBack = () => step === 0 ? nav("profile", p.id) : setStep(s => s - 1);
  const handleNext = () => setStep(s => Math.min(s + 1, 3));
  const canContinue = true;

  const serviceOptions = [
    { key: "Dépannage urgent",    icon: I.zap,      desc: "Problème immédiat" },
    { key: "Installation nouvelle", icon: I.wrench,   desc: "Nouveau matériel" },
    { key: "Devis / diagnostic",   icon: I.sparkles, desc: "Évaluation gratuite" },
    { key: "Rénovation complète",  icon: I.hammer,   desc: "Projet de fond" },
  ];

  return (
    <div style={{ background: "var(--k-bg)", minHeight: "100%", display: "flex", flexDirection: "column" }}>
      {/* Sheet-style header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "var(--k-bg)",
        padding: "12px 16px 10px",
        borderBottom: "1px solid var(--k-border-subtle)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={handleBack} aria-label="Fermer" style={mbSheetIconBtn}>
            {step === 0 ? <I.x size={18}/> : <I.arrowLeft size={18}/>}
          </button>
          <div className="k-num" style={{ fontFamily: "var(--k-font-mono)", fontSize: 12, color: "var(--k-text-muted)", fontWeight: 600, letterSpacing: "0.04em" }}>
            Étape {step + 1} sur {stepCount}
          </div>
          <div style={{ width: 36 }}/>
        </div>
        {/* Progress */}
        <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= step ? "var(--k-text-primary)" : "var(--k-border)",
              transition: "background 280ms var(--k-ease-std)",
            }}/>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "22px 20px 140px" }}>
        {/* Provider mini */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 14px", marginBottom: 22,
          background: "white", borderRadius: 16,
          boxShadow: "0 4px 14px -6px rgba(15,23,42,0.1), 0 1px 3px -1px rgba(15,23,42,0.05)",
        }}>
          <Avatar name={`${p.firstName} ${p.lastName}`} bg={p.avatarBg} size={42} initials={p.initials}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 15 }}>{p.firstName} {p.lastName}</span>
              {p.verified && <I.badgeCheck size={13} color="var(--k-success)"/>}
            </div>
            <div className="k-caption" style={{ marginTop: 1 }}>{p.profession}</div>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            <I.star size={12} color="var(--k-warning)"/>
            <span className="k-num" style={{ fontWeight: 600, fontSize: 13 }}>{p.rating.toFixed(1)}</span>
          </span>
        </div>

        {/* Big step title */}
        <h1 style={{
          fontFamily: "var(--k-font-display)", fontWeight: 700,
          fontSize: 28, lineHeight: 1.1, letterSpacing: "-0.02em",
          margin: "0 0 22px", color: "var(--k-text-primary)",
        }}>
          {stepTitle}
        </h1>

        {step === 0 && (
          <>
            <div style={{ display: "grid", gap: 10 }}>
              {serviceOptions.map(o => {
                const active = service === o.key;
                return (
                  <button key={o.key} onClick={() => setService(o.key)} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: 16, textAlign: "left", width: "100%",
                    background: "white", border: 0, cursor: "pointer",
                    borderRadius: 16,
                    boxShadow: active
                      ? `0 0 0 2px ${portfolio.accent}, 0 8px 20px -8px rgba(15,23,42,0.12)`
                      : "0 4px 14px -6px rgba(15,23,42,0.1), 0 1px 3px -1px rgba(15,23,42,0.05)",
                    transition: "box-shadow 160ms",
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: active ? `${portfolio.accent}18` : "var(--k-surface-muted)",
                      color: active ? portfolio.accent : "var(--k-text-body)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <o.icon size={20}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 15, color: "var(--k-text-primary)" }}>
                        {o.key}
                      </div>
                      <div className="k-caption" style={{ marginTop: 1 }}>{o.desc}</div>
                    </div>
                    {active && <I.check size={20} color={portfolio.accent}/>}
                  </button>
                );
              })}
            </div>

            <h3 style={mbBlockLabel}>Durée estimée</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {[1, 2, 4, 8].map(h => {
                const active = duration === h;
                return (
                  <button key={h} onClick={() => setDuration(h)} style={{
                    height: 48, borderRadius: 12, border: 0, cursor: "pointer",
                    background: active ? "var(--k-text-primary)" : "white",
                    color: active ? "white" : "var(--k-text-primary)",
                    fontWeight: 700, fontSize: 15,
                    boxShadow: active ? "none" : "0 2px 8px -3px rgba(15,23,42,0.1), 0 1px 2px rgba(15,23,42,0.04)",
                    transition: "all 160ms",
                  }}>
                    {h}h
                  </button>
                );
              })}
            </div>

            <h3 style={mbBlockLabel}>Décris ton besoin</h3>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={4}
              placeholder="Précise le problème, l'urgence, les détails…"
              style={{
                width: "100%", padding: 14, border: 0, outline: 0,
                borderRadius: 16, background: "white",
                boxShadow: "0 2px 8px -3px rgba(15,23,42,0.1), 0 1px 2px rgba(15,23,42,0.04)",
                fontFamily: "inherit", fontSize: 14, lineHeight: 1.5, resize: "vertical",
                color: "var(--k-text-primary)",
              }}/>
          </>
        )}

        {step === 1 && (
          <>
            <div style={{
              background: "white", borderRadius: 18, padding: 18,
              boxShadow: "0 4px 14px -6px rgba(15,23,42,0.1), 0 1px 3px -1px rgba(15,23,42,0.05)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <button style={mbRoundBtn}><I.arrowLeft size={15}/></button>
                <span style={{ fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 16 }}>Avril 2026</span>
                <button style={mbRoundBtn}><I.arrowRight size={15}/></button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 6 }}>
                {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                  <div key={i} className="k-caption" style={{ textAlign: "center", fontWeight: 600 }}>{d}</div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                {Array.from({ length: 35 }, (_, i) => i - 1).map(d => {
                  const valid = d >= 1 && d <= 30;
                  const isPast = d < 18;
                  const isAvail = valid && !isPast && [18, 19, 20, 22, 24, 25, 27].includes(d);
                  const isSel = d === date;
                  return (
                    <button key={d} disabled={!isAvail} onClick={() => isAvail && setDate(d)} style={{
                      aspectRatio: "1/1", border: 0, borderRadius: 10,
                      background: isSel ? "var(--k-text-primary)" : "transparent",
                      color: isSel ? "white" : (isAvail ? "var(--k-text-primary)" : "var(--k-text-subtle)"),
                      cursor: isAvail ? "pointer" : "default",
                      fontSize: 14, fontWeight: isSel ? 700 : 500,
                      position: "relative", opacity: valid ? 1 : 0,
                      fontFamily: "var(--k-font-body)",
                    }}>
                      {valid ? d : ""}
                      {isAvail && !isSel && <div style={{ position: "absolute", bottom: 5, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", background: "var(--k-success)" }}/>}
                    </button>
                  );
                })}
              </div>
            </div>

            <h3 style={mbBlockLabel}>Créneaux disponibles</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {["08:00", "10:00", "14:00", "16:00", "18:00"].map(t => {
                const active = time === t;
                return (
                  <button key={t} onClick={() => setTime(t)} style={{
                    height: 46, borderRadius: 12, border: 0, cursor: "pointer",
                    background: active ? "var(--k-text-primary)" : "white",
                    color: active ? "white" : "var(--k-text-primary)",
                    fontWeight: 600, fontSize: 14, fontFamily: "var(--k-font-mono)",
                    boxShadow: active ? "none" : "0 2px 8px -3px rgba(15,23,42,0.1), 0 1px 2px rgba(15,23,42,0.04)",
                  }}>
                    {t}
                  </button>
                );
              })}
            </div>

            <h3 style={mbBlockLabel}>Adresse d'intervention</h3>
            <div style={{
              display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
              background: "white", borderRadius: 16,
              boxShadow: "0 2px 8px -3px rgba(15,23,42,0.1), 0 1px 2px rgba(15,23,42,0.04)",
            }}>
              <I.mapPin size={18} color="var(--k-text-muted)"/>
              <input value={address} onChange={e => setAddress(e.target.value)}
                style={{ flex: 1, border: 0, outline: 0, background: "transparent", fontSize: 14, fontFamily: "inherit", color: "var(--k-text-primary)" }}/>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{
              background: "white", borderRadius: 18, overflow: "hidden",
              boxShadow: "0 4px 14px -6px rgba(15,23,42,0.1), 0 1px 3px -1px rgba(15,23,42,0.05)",
            }}>
              <MbSumRow icon={I.wrench} label="Service" value={service}/>
              <MbSumRow icon={I.clock} label="Durée" value={`${duration} heure${duration>1?"s":""}`}/>
              <MbSumRow icon={I.calendar} label="Date" value={`Mer. ${date} avril · ${time}`}/>
              <MbSumRow icon={I.mapPin} label="Adresse" value={address}/>
              <MbSumRow icon={I.messageCircle} label="Note" value={note} last/>
            </div>

            <h3 style={mbBlockLabel}>Détails du paiement</h3>
            <div style={{
              background: "white", borderRadius: 18, padding: "16px 18px",
              boxShadow: "0 4px 14px -6px rgba(15,23,42,0.1), 0 1px 3px -1px rgba(15,23,42,0.05)",
            }}>
              <MbPriceRow label={`${p.hourly.toLocaleString("fr-FR")} FC × ${duration}h`} value={`${total.toLocaleString("fr-FR")} FC`}/>
              <MbPriceRow label="Frais de service (7%)" value={`${(total*0.07).toLocaleString("fr-FR", {maximumFractionDigits:0})} FC`} muted/>
              <div style={{ height: 1, background: "var(--k-border-subtle)", margin: "12px 0" }}/>
              <MbPriceRow label="Total estimé" value={`${(total*1.07).toLocaleString("fr-FR", {maximumFractionDigits:0})} FC`} bold/>
            </div>

            <div style={{
              marginTop: 16, padding: "12px 14px",
              background: "var(--k-success-subtle)",
              borderRadius: 14,
              display: "flex", alignItems: "flex-start", gap: 10,
            }}>
              <I.shieldCheck size={18} color="var(--k-success)" style={{ flexShrink: 0, marginTop: 1 }}/>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--k-text-primary)" }}>Paiement protégé</div>
                <div className="k-caption" style={{ marginTop: 2 }}>
                  Tu paies à la fin du travail. Remboursement garanti si le travail n'est pas fait.
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sticky footer CTA */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 40,
        background: "white", borderTop: "1px solid var(--k-border-subtle)",
        padding: "12px 16px 18px",
        display: "flex", alignItems: "center", gap: 12,
        boxShadow: "0 -4px 20px -8px rgba(15,23,42,0.1)",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="k-caption">
            {step === 2 ? "Total estimé" : `à ${p.hourly.toLocaleString("fr-FR")} FC/h`}
          </div>
          <div style={{ fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 17, textDecoration: step === 2 ? "none" : "underline", textUnderlineOffset: 3 }}>
            {step === 2
              ? `${(total*1.07).toLocaleString("fr-FR", {maximumFractionDigits:0})} FC`
              : `${total.toLocaleString("fr-FR")} FC`}
          </div>
        </div>
        <button
          className="k-btn k-btn-primary"
          style={{ padding: "0 22px", height: 48, fontSize: 15, flexShrink: 0 }}
          onClick={handleNext}
          disabled={!canContinue}>
          {step === 2 ? "Confirmer" : "Continuer"} <I.arrowRight size={16}/>
        </button>
      </div>
    </div>
  );
}

function MbSumRow({ icon: Icon, label, value, last }) {
  return (
    <div style={{
      display: "flex", gap: 12, padding: "14px 16px",
      borderBottom: last ? 0 : "1px solid var(--k-border-subtle)",
      alignItems: "flex-start",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: "var(--k-surface-muted)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, color: "var(--k-text-body)",
      }}>
        <Icon size={16}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="k-caption">{label}</div>
        <div style={{ fontSize: 14, color: "var(--k-text-primary)", fontWeight: 500, marginTop: 2, lineHeight: 1.4 }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function MbPriceRow({ label, value, muted, bold }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "baseline",
      padding: "4px 0",
      color: muted ? "var(--k-text-muted)" : "var(--k-text-primary)",
      fontSize: bold ? 16 : 14,
      fontWeight: bold ? 700 : 500,
    }}>
      <span style={{ fontFamily: bold ? "var(--k-font-display)" : "inherit" }}>{label}</span>
      <span className={bold ? "" : "k-num"} style={{ fontWeight: bold ? 700 : 600 }}>{value}</span>
    </div>
  );
}

const mbSheetIconBtn = { width: 36, height: 36, borderRadius: "50%", background: "white", border: 0, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--k-text-primary)", boxShadow: "0 2px 6px -2px rgba(15,23,42,0.12), 0 1px 2px rgba(15,23,42,0.05)" };
const mbRoundBtn = { width: 32, height: 32, borderRadius: "50%", background: "var(--k-surface-muted)", border: 0, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--k-text-primary)" };
const mbBlockLabel = { fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.01em", margin: "28px 0 12px", color: "var(--k-text-primary)" };

Object.assign(window, { MobileBooking });
