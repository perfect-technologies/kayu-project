// ProVerification — pro-facing KYC / verification flow.
// Three modes:
//   • Status screen (default) — shows current verification state + next steps
//   • Upload wizard — multi-step capture of ID, selfie, address, optional cert
//   • Dispute view — if the pro is party to a dispute, shows the timeline + chat

// ─── Mock: current pro's verification state ────────────────────────────
// We'll let the user toggle between states via a debug dropdown at the top
// (hidden unless ?debug=1) — for the prototype we default to "in_review"

const VERIFY_STEPS = [
  { id: "identity", label: "Identité",         icon: "idCard",    required: true, caption: "Carte d'identité ou passeport" },
  { id: "selfie",   label: "Selfie",            icon: "selfie",    required: true, caption: "Pour confirmer que c'est bien vous" },
  { id: "address",  label: "Adresse",           icon: "mapPin",    required: true, caption: "Facture EDC / Regideso récente" },
  { id: "cert",     label: "Certificat métier", icon: "award",     required: false, caption: "Optionnel · augmente vos chances" },
];

const VERIFY_BENEFITS = [
  { icon: "badgeCheck", label: "Badge « De confiance »",   desc: "Affiché sur votre profil · +40% de vues" },
  { icon: "trendingUp", label: "Meilleur classement",      desc: "Vous apparaissez plus haut dans les recherches" },
  { icon: "zap",        label: "Missions premium",          desc: "Accès aux demandes urgentes et haut de gamme" },
  { icon: "shieldCheck",label: "Assurance KAYOU",           desc: "Couverture en cas de litige ou accident" },
];

const PRO_DISPUTE = {
  ref: "B-2847", opened: "Il y a 2h", status: "pending_pro",
  client: "Marie K.", service: "Réparation fuite sous évier", amount: 24000,
  reason: "Travail non conforme",
  clientSide: "L'évier fuit toujours le lendemain. J'ai essayé de joindre le pro mais sans réponse. Je demande un remboursement.",
  deadline: "Il vous reste 22h pour répondre",
  evidence: 2,
};

function ProVerification({ nav, mobile }) {
  // States: "not_started" | "in_progress" | "in_review" | "verified" | "rejected" | "dispute"
  const [state, setState] = React.useState("in_review");
  const [flow, setFlow] = React.useState(null); // null | "wizard" | "dispute"
  const [wizardStep, setWizardStep] = React.useState(0);

  // Wizard view
  if (flow === "wizard") {
    return <VerifyWizard mobile={mobile} step={wizardStep} setStep={setWizardStep} onDone={() => { setFlow(null); setState("in_review"); }} onExit={() => setFlow(null)}/>;
  }

  // Dispute view
  if (flow === "dispute") {
    return <DisputeView mobile={mobile} onBack={() => setFlow(null)}/>;
  }

  return <VerifyStatus mobile={mobile} state={state} setState={setState} onStart={() => setFlow("wizard")} onDispute={() => setFlow("dispute")} nav={nav}/>;
}

// ─── Status screen ─────────────────────────────────────────────────────

function VerifyStatus({ mobile, state, setState, onStart, onDispute, nav }) {
  const cfg = {
    not_started: {
      tint: "#D97706", tintBg: "#FEF3C7",
      icon: "shieldCheck",
      title: "Vérifiez votre compte",
      sub: "Obtenez le badge « De confiance » pour rassurer les clients et recevoir plus de demandes.",
      cta: "Commencer la vérification",
      progress: 0,
    },
    in_progress: {
      tint: "#0EA5E9", tintBg: "#E0F2FE",
      icon: "upload",
      title: "Continuez où vous en étiez",
      sub: "Il vous reste 2 documents à envoyer. Cela prend environ 3 minutes.",
      cta: "Reprendre",
      progress: 50,
    },
    in_review: {
      tint: "#7C3AED", tintBg: "#EDE9FE",
      icon: "clock",
      title: "Dossier en cours d'examen",
      sub: "Notre équipe vérifie vos documents. Délai habituel : moins de 2 heures.",
      cta: null,
      progress: 75,
    },
    verified: {
      tint: "#059669", tintBg: "#D1FAE5",
      icon: "badgeCheck",
      title: "Vous êtes vérifié !",
      sub: "Votre profil affiche maintenant le badge « De confiance ». Vos chances d'être choisi augmentent significativement.",
      cta: "Voir mon profil",
      progress: 100,
    },
    rejected: {
      tint: "#DC2626", tintBg: "#FEE2E2",
      icon: "xCircle",
      title: "Vérification refusée",
      sub: "Un de vos documents n'est pas lisible. Vous pouvez soumettre à nouveau.",
      cta: "Renvoyer les documents",
      progress: 0,
    },
  }[state];

  const Icon = I[cfg.icon] || I.shieldCheck;

  const wrapperStyle = mobile
    ? { background: "var(--k-bg)", minHeight: "100%" }
    : { maxWidth: 720, margin: "0 auto", padding: "40px 32px 60px" };

  return (
    <div style={wrapperStyle}>
      {mobile && (
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          background: "rgba(250,250,249,0.94)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--k-border-subtle)",
          display: "flex", alignItems: "center", padding: "12px 16px", gap: 12,
        }}>
          <button onClick={() => nav("provider")} style={{
            width: 36, height: 36, borderRadius: 10, border: "1px solid var(--k-border)",
            background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>
            <I.arrowLeft size={17}/>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 15 }}>
              Vérification
            </div>
          </div>
          {/* Debug state switcher */}
          <DebugStateSwitch state={state} setState={setState}/>
        </div>
      )}

      <div style={{ padding: mobile ? "20px 16px" : 0 }}>
        {!mobile && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <button onClick={() => nav("provider")} style={{
              background: "transparent", border: 0, cursor: "pointer",
              color: "var(--k-text-muted)", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 2px",
            }}>
              <I.arrowLeft size={14}/> Retour au dashboard
            </button>
            <DebugStateSwitch state={state} setState={setState}/>
          </div>
        )}

        {/* Hero status card */}
        <div style={{
          background: "var(--k-surface)", border: "1px solid var(--k-border)",
          borderRadius: mobile ? 16 : 20, padding: mobile ? 22 : 32,
          boxShadow: "var(--k-e1)", marginBottom: 16, position: "relative", overflow: "hidden",
        }}>
          {/* Background wash */}
          <div style={{
            position: "absolute", top: 0, right: 0, width: 300, height: 300,
            background: `radial-gradient(circle at top right, ${cfg.tintBg}, transparent 60%)`,
            pointerEvents: "none",
          }}/>

          <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{
              width: mobile ? 56 : 64, height: mobile ? 56 : 64,
              borderRadius: 16, background: cfg.tintBg, color: cfg.tint,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon size={mobile ? 26 : 30} stroke={2}/>
            </div>

            <div>
              <h1 style={{
                fontFamily: "var(--k-font-display)", fontWeight: 700,
                fontSize: mobile ? 22 : 28, letterSpacing: "-0.02em",
                color: "var(--k-text-primary)", margin: "0 0 8px", lineHeight: 1.15,
              }}>
                {cfg.title}
              </h1>
              <p style={{
                fontSize: mobile ? 14 : 15, color: "var(--k-text-muted)",
                lineHeight: 1.55, margin: 0, maxWidth: 520,
              }}>
                {cfg.sub}
              </p>
            </div>

            {/* Progress bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--k-text-muted)" }}>
                <span>Progression</span>
                <span>{cfg.progress}%</span>
              </div>
              <div style={{ height: 6, background: "var(--k-border-subtle)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${cfg.progress}%`,
                  background: cfg.tint, transition: "width 500ms var(--k-ease-std)",
                  borderRadius: 3,
                }}/>
              </div>
            </div>

            {cfg.cta && (
              <button onClick={onStart} className="k-btn k-btn-primary k-btn-lg" style={{ alignSelf: "flex-start" }}>
                {cfg.cta} <I.arrowRight size={15}/>
              </button>
            )}

            {state === "in_review" && (
              <div style={{
                display: "flex", gap: 10, alignItems: "center",
                padding: 12, background: "#FAFAF9", borderRadius: 10, fontSize: 13, color: "#475569",
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7C3AED", animation: "pulse 2s infinite" }}/>
                Nous vous notifierons dès qu'une décision est prise.
              </div>
            )}
          </div>
        </div>

        {/* Dispute banner (if applicable) */}
        <DisputeBanner onOpen={onDispute} mobile={mobile}/>

        {/* Document status list */}
        <div style={{
          background: "var(--k-surface)", border: "1px solid var(--k-border)",
          borderRadius: mobile ? 14 : 16, padding: mobile ? 18 : 22,
          marginBottom: 16,
        }}>
          <h3 style={{
            fontFamily: "var(--k-font-display)", fontWeight: 600,
            fontSize: 14, margin: "0 0 4px",
            color: "var(--k-text-muted)", letterSpacing: "0.04em", textTransform: "uppercase",
          }}>
            Vos documents
          </h3>
          <div style={{ fontSize: 12, color: "var(--k-text-muted)", marginBottom: 14 }}>
            {state === "verified" ? "Tous vos documents ont été approuvés" : "4 documents demandés (dont 3 obligatoires)"}
          </div>

          {VERIFY_STEPS.map((s, i) => {
            const done = (state === "verified") ||
                         (state === "in_review" && i < 3) ||
                         (state === "in_progress" && i < 2);
            const pending = state === "in_review" && i < 3;
            return <DocStatusRow key={s.id} step={s} done={done} pending={pending}/>;
          })}
        </div>

        {/* Benefits */}
        {state !== "verified" && (
          <div style={{
            background: "var(--k-surface)", border: "1px solid var(--k-border)",
            borderRadius: mobile ? 14 : 16, padding: mobile ? 18 : 22, marginBottom: 16,
          }}>
            <h3 style={{ fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 16, margin: "0 0 14px" }}>
              Pourquoi se vérifier ?
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              {VERIFY_BENEFITS.map((b, i) => {
                const Icon = I[b.icon] || I.check;
                return (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: "var(--k-primary-subtle)", color: "var(--k-primary)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <Icon size={17}/>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--k-text-primary)", marginBottom: 2 }}>
                        {b.label}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--k-text-muted)", lineHeight: 1.4 }}>
                        {b.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Security note */}
        <div style={{
          display: "flex", gap: 12, padding: 14,
          background: "var(--k-surface-primary)", borderRadius: 12,
          alignItems: "flex-start",
        }}>
          <I.lock size={16} color="var(--k-primary)" style={{ marginTop: 2, flexShrink: 0 }}/>
          <div style={{ fontSize: 12.5, color: "var(--k-text-body)", lineHeight: 1.5 }}>
            <strong>Vos données sont sécurisées.</strong>
            <div style={{ color: "var(--k-text-muted)", marginTop: 2 }}>
              Chiffrées et stockées conformément aux réglementations RDC et Congo-B. Seule notre équipe ops y accède.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DisputeBanner({ onOpen, mobile }) {
  return (
    <button onClick={onOpen} style={{
      width: "100%", textAlign: "left", cursor: "pointer",
      display: "flex", alignItems: "center", gap: 14,
      background: "#FEF3C7", border: "1px solid #FDE68A",
      borderRadius: mobile ? 14 : 16, padding: mobile ? 14 : 18,
      marginBottom: 16,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: "#F59E0B", color: "white",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <I.alertTriangle size={19}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "#78350F" }}>
          Un client a ouvert un litige
        </div>
        <div style={{ fontSize: 12.5, color: "#92400E", marginTop: 2 }}>
          Réservation #{PRO_DISPUTE.ref} · {PRO_DISPUTE.deadline}
        </div>
      </div>
      <I.chevronRight size={16} color="#92400E"/>
    </button>
  );
}

function DocStatusRow({ step, done, pending }) {
  const Icon = I[step.icon] || I.fileText;
  const state = done ? "done" : pending ? "pending" : "todo";
  const cfg = {
    done:    { bg: "#ECFDF5", fg: "#047857", border: "#A7F3D0", label: "Vérifié" },
    pending: { bg: "#EDE9FE", fg: "#6D28D9", border: "#DDD6FE", label: "En cours" },
    todo:    { bg: "#F1F5F9", fg: "#64748B", border: "#E2E8F0", label: "À fournir" },
  }[state];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 0", borderBottom: "1px solid var(--k-border-subtle)",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: cfg.bg, color: cfg.fg,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        border: `1px solid ${cfg.border}`,
      }}>
        <Icon size={18}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: "var(--k-text-primary)" }}>
            {step.label}
          </span>
          {!step.required && (
            <span style={{ fontSize: 10.5, color: "var(--k-text-muted)", background: "var(--k-surface-muted)", padding: "2px 6px", borderRadius: 4, fontWeight: 500 }}>
              Optionnel
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: "var(--k-text-muted)" }}>{step.caption}</div>
      </div>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: cfg.fg, background: cfg.bg, padding: "4px 10px", borderRadius: 999 }}>
        {cfg.label}
      </span>
    </div>
  );
}

function DebugStateSwitch({ state, setState }) {
  return (
    <select
      value={state}
      onChange={e => setState(e.target.value)}
      title="État (debug)"
      style={{
        fontSize: 11, padding: "4px 6px", borderRadius: 6,
        border: "1px solid var(--k-border)", background: "white",
        color: "var(--k-text-muted)", cursor: "pointer",
        fontFamily: "var(--k-font-mono)",
      }}
    >
      <option value="not_started">not_started</option>
      <option value="in_progress">in_progress</option>
      <option value="in_review">in_review</option>
      <option value="verified">verified</option>
      <option value="rejected">rejected</option>
    </select>
  );
}

// ─── Wizard ────────────────────────────────────────────────────────────

function VerifyWizard({ mobile, step, setStep, onDone, onExit }) {
  const total = VERIFY_STEPS.length;
  const currentStep = VERIFY_STEPS[step];
  const progress = ((step + 1) / total) * 100;

  const next = () => {
    if (step < total - 1) setStep(step + 1);
    else onDone();
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
    else onExit();
  };

  const wrapperStyle = mobile
    ? { background: "var(--k-bg)", minHeight: "100%", display: "flex", flexDirection: "column" }
    : { maxWidth: 600, margin: "0 auto", padding: "40px 32px 60px" };

  return (
    <div style={wrapperStyle}>
      {/* Top progress */}
      <div style={{
        position: mobile ? "sticky" : "static", top: 0, zIndex: 10,
        background: mobile ? "rgba(250,250,249,0.94)" : "transparent",
        backdropFilter: mobile ? "blur(12px)" : "none",
        borderBottom: mobile ? "1px solid var(--k-border-subtle)" : 0,
        padding: mobile ? "12px 16px" : "0 0 20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <button onClick={back} style={{
            width: 36, height: 36, borderRadius: 10, border: "1px solid var(--k-border)",
            background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>
            <I.arrowLeft size={17}/>
          </button>
          <div style={{ fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 15, flex: 1 }}>
            Étape {step + 1} sur {total}
          </div>
          <button onClick={onExit} style={{ background: "transparent", border: 0, cursor: "pointer", color: "var(--k-text-muted)", fontSize: 13, fontWeight: 500 }}>
            Continuer plus tard
          </button>
        </div>
        <div style={{ height: 4, background: "var(--k-border-subtle)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "var(--k-primary)", transition: "width 400ms var(--k-ease-std)", borderRadius: 2 }}/>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: mobile ? "24px 20px" : 0 }}>
        {step === 0 && <StepIdentity/>}
        {step === 1 && <StepSelfie/>}
        {step === 2 && <StepAddress/>}
        {step === 3 && <StepCert/>}
      </div>

      {/* Footer — sticky on mobile */}
      <div style={{
        position: mobile ? "sticky" : "static", bottom: 0,
        padding: mobile ? "14px 16px" : "24px 0 0",
        borderTop: mobile ? "1px solid var(--k-border-subtle)" : 0,
        background: mobile ? "rgba(250,250,249,0.94)" : "transparent",
        backdropFilter: mobile ? "blur(12px)" : "none",
        display: "flex", gap: 10,
      }}>
        {currentStep && !currentStep.required && (
          <button onClick={next} className="k-btn k-btn-secondary" style={{ flex: 1 }}>
            Passer
          </button>
        )}
        <button onClick={next} className="k-btn k-btn-primary" style={{ flex: 2, justifyContent: "center" }}>
          {step === total - 1 ? "Soumettre pour examen" : "Continuer"}
          <I.arrowRight size={15}/>
        </button>
      </div>
    </div>
  );
}

function StepIdentity() {
  const [docType, setDocType] = React.useState("id");
  return (
    <div>
      <h2 style={{ fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 24, letterSpacing: "-0.02em", margin: "0 0 8px" }}>
        Votre pièce d'identité
      </h2>
      <p style={{ fontSize: 14, color: "var(--k-text-muted)", margin: "0 0 24px", lineHeight: 1.5 }}>
        Prenez une photo claire du <strong>recto et verso</strong>. Assurez-vous que toutes les informations sont lisibles.
      </p>

      {/* Doc type selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          { id: "id", label: "Carte nationale" },
          { id: "passport", label: "Passeport" },
          { id: "permit", label: "Permis de conduire" },
        ].map(t => (
          <button key={t.id} onClick={() => setDocType(t.id)} style={{
            flex: 1, padding: "10px 8px", borderRadius: 10,
            border: `1px solid ${docType === t.id ? "var(--k-primary)" : "var(--k-border)"}`,
            background: docType === t.id ? "var(--k-primary-subtle)" : "white",
            color: docType === t.id ? "var(--k-primary-hover)" : "var(--k-text-body)",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      <UploadTarget label="Photo du recto" sub="Appuyez pour ouvrir l'appareil photo" icon="idCard" done/>
      <UploadTarget label="Photo du verso" sub="Retournez votre pièce et photographiez l'autre face" icon="idCard"/>

      <div style={{
        display: "flex", gap: 10, padding: 12, background: "#FFFBEB", borderRadius: 10,
        border: "1px solid #FDE68A", marginTop: 16,
      }}>
        <I.info size={15} color="#B45309" style={{ flexShrink: 0, marginTop: 2 }}/>
        <div style={{ fontSize: 12.5, color: "#78350F", lineHeight: 1.5 }}>
          Évitez les reflets. Posez le document sur une surface sombre et unie.
        </div>
      </div>
    </div>
  );
}

function StepSelfie() {
  return (
    <div>
      <h2 style={{ fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 24, letterSpacing: "-0.02em", margin: "0 0 8px" }}>
        Selfie avec votre pièce
      </h2>
      <p style={{ fontSize: 14, color: "var(--k-text-muted)", margin: "0 0 24px", lineHeight: 1.5 }}>
        Tenez votre pièce d'identité à côté de votre visage. Cela nous permet de confirmer que c'est bien vous.
      </p>

      {/* Mock selfie frame */}
      <div style={{
        aspectRatio: "3/4", maxHeight: 360, width: "100%",
        background: "linear-gradient(135deg, #1E293B, #0F172A)",
        borderRadius: 16, position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 20,
      }}>
        {/* Face oval guide */}
        <div style={{
          width: 160, height: 200,
          borderRadius: "50%",
          border: "3px dashed rgba(255,255,255,0.5)",
        }}/>
        <div style={{
          position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
          padding: "8px 14px", borderRadius: 999,
          color: "white", fontSize: 12, fontWeight: 500,
        }}>
          Tenez votre ID sous votre menton
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="k-btn k-btn-secondary" style={{ flex: 1 }}>
          <I.refresh size={14}/> Reprendre
        </button>
        <button className="k-btn k-btn-primary" style={{ flex: 2, justifyContent: "center" }}>
          <I.camera size={14}/> Prendre la photo
        </button>
      </div>

      <div style={{ marginTop: 16, fontSize: 12, color: "var(--k-text-muted)", textAlign: "center", lineHeight: 1.6 }}>
        Une photo floue, sombre ou partiellement cachée sera rejetée. Prenez le temps de bien cadrer.
      </div>
    </div>
  );
}

function StepAddress() {
  return (
    <div>
      <h2 style={{ fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 24, letterSpacing: "-0.02em", margin: "0 0 8px" }}>
        Justificatif de domicile
      </h2>
      <p style={{ fontSize: 14, color: "var(--k-text-muted)", margin: "0 0 24px", lineHeight: 1.5 }}>
        Une facture SNEL, REGIDESO ou Afrimobile récente (moins de 3 mois) à votre nom.
      </p>

      <UploadTarget label="Photo de la facture" sub="JPEG, PNG ou PDF · max 10 Mo" icon="fileText"/>

      <div style={{ marginTop: 20 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--k-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
          Ou confirmez votre adresse
        </label>
        <input type="text" defaultValue="Av. Kasa-Vubu 42, Gombe, Kinshasa"
          style={{
            width: "100%", padding: "12px 14px", borderRadius: 10,
            border: "1px solid var(--k-border)", fontSize: 14, fontFamily: "var(--k-font-body)",
            background: "white",
          }}
        />
      </div>

      {/* Accepted list */}
      <div style={{ marginTop: 20, padding: 14, background: "#FAFAF9", borderRadius: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--k-text-primary)", marginBottom: 8 }}>
          Documents acceptés :
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "var(--k-text-body)", lineHeight: 1.7 }}>
          <li>Facture SNEL ou REGIDESO</li>
          <li>Facture internet (Afrimobile, Vodacom)</li>
          <li>Attestation de résidence signée</li>
          <li>Contrat de bail en cours</li>
        </ul>
      </div>
    </div>
  );
}

function StepCert() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <h2 style={{ fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 24, letterSpacing: "-0.02em", margin: 0 }}>
          Certificat métier
        </h2>
        <span style={{ fontSize: 11, padding: "3px 8px", background: "var(--k-surface-muted)", color: "var(--k-text-muted)", borderRadius: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Optionnel
        </span>
      </div>
      <p style={{ fontSize: 14, color: "var(--k-text-muted)", margin: "0 0 24px", lineHeight: 1.5 }}>
        Si vous avez un diplôme, une certification INPP, ou une licence professionnelle, ajoutez-la ici. Cela augmente significativement votre taux de conversion.
      </p>

      <UploadTarget label="Photo de votre certificat" sub="Diplôme, attestation, licence… un seul document à la fois" icon="award"/>

      <div style={{ marginTop: 20 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--k-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
          Nom de la certification
        </label>
        <input type="text" placeholder="Ex: Diplôme INPP Plomberie 2018"
          style={{
            width: "100%", padding: "12px 14px", borderRadius: 10,
            border: "1px solid var(--k-border)", fontSize: 14, fontFamily: "var(--k-font-body)",
            background: "white",
          }}
        />
      </div>

      {/* Bonus explanation */}
      <div style={{
        marginTop: 20, padding: 14, background: "var(--k-primary-subtle)", borderRadius: 10,
        display: "flex", gap: 12, alignItems: "flex-start",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: "white", color: "var(--k-primary)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <I.sparkles size={15}/>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--k-text-body)", lineHeight: 1.5 }}>
          <strong>Les pros certifiés ont 60% de conversion en plus.</strong>
          <div style={{ color: "var(--k-text-muted)", marginTop: 2 }}>
            Ils reçoivent le badge « Expert » et accèdent aux missions premium.
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadTarget({ label, sub, icon, done }) {
  const Icon = I[icon] || I.upload;
  return (
    <button style={{
      width: "100%", textAlign: "left", cursor: "pointer",
      display: "flex", alignItems: "center", gap: 14,
      padding: 16, borderRadius: 12,
      border: done ? "1px solid var(--k-success)" : "1.5px dashed var(--k-border)",
      background: done ? "#ECFDF5" : "white",
      marginBottom: 10, transition: "border-color 120ms",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: done ? "var(--k-success)" : "var(--k-surface-muted)",
        color: done ? "white" : "var(--k-text-muted)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {done ? <I.check size={20} stroke={2.5}/> : <Icon size={19}/>}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--k-text-primary)", marginBottom: 2 }}>
          {done ? `✓ ${label}` : label}
        </div>
        <div style={{ fontSize: 12, color: "var(--k-text-muted)" }}>
          {done ? "Photo enregistrée · appuyez pour remplacer" : sub}
        </div>
      </div>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: "var(--k-surface-muted)", color: "var(--k-text-muted)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <I.camera size={15}/>
      </div>
    </button>
  );
}

// ─── Dispute view (pro side) ──────────────────────────────────────────

function DisputeView({ mobile, onBack }) {
  const [msg, setMsg] = React.useState("");
  const d = PRO_DISPUTE;

  const wrapperStyle = mobile
    ? { background: "var(--k-bg)", minHeight: "100%" }
    : { maxWidth: 780, margin: "0 auto", padding: "32px 32px 60px" };

  return (
    <div style={wrapperStyle}>
      {/* Header */}
      <div style={mobile ? {
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(250,250,249,0.94)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--k-border-subtle)",
        display: "flex", alignItems: "center", padding: "12px 16px", gap: 12,
      } : { display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: 10, border: "1px solid var(--k-border)",
          background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <I.arrowLeft size={17}/>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: mobile ? 15 : 17 }}>
            Litige #{d.ref}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--k-text-muted)" }}>{d.opened}</div>
        </div>
        <span style={{ background: "#FEF3C7", color: "#B45309", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999 }}>
          Réponse attendue
        </span>
      </div>

      <div style={{ padding: mobile ? "16px" : 0, display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Deadline alert */}
        <div style={{
          background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 12,
          padding: 14, display: "flex", alignItems: "center", gap: 10,
        }}>
          <I.clock size={16} color="#B45309"/>
          <div style={{ fontSize: 13, color: "#78350F", flex: 1 }}>
            <strong>{d.deadline}</strong> pour répondre au client, sinon la décision sera prise sans votre version.
          </div>
        </div>

        {/* Booking summary */}
        <div style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--k-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
            Réservation concernée
          </div>
          <div style={{ fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 16, color: "var(--k-text-primary)", marginBottom: 4 }}>
            {d.service}
          </div>
          <div style={{ fontSize: 13, color: "var(--k-text-muted)", marginBottom: 10 }}>
            Client : {d.client} · Montant : <strong style={{ color: "var(--k-text-primary)" }}>{d.amount.toLocaleString("fr-FR")} FC</strong>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="k-btn k-btn-secondary k-btn-sm"><I.fileText size={12}/> Voir le devis</button>
            <button className="k-btn k-btn-secondary k-btn-sm"><I.messageCircle size={12}/> Historique chat</button>
          </div>
        </div>

        {/* Client side */}
        <div style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: 12, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Avatar name={d.client} bg="#E11D48" size={36} initials="MK"/>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{d.client}</div>
              <div style={{ fontSize: 11.5, color: "var(--k-text-muted)" }}>Version du client</div>
            </div>
            <span style={{ background: "#FEE2E2", color: "#B91C1C", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6 }}>
              {d.reason}
            </span>
          </div>
          <div style={{
            padding: 14, background: "#FEF2F2", borderRadius: 10, border: "1px solid #FECACA",
            fontSize: 13.5, color: "#7F1D1D", lineHeight: 1.55, marginBottom: 10,
          }}>
            « {d.clientSide} »
          </div>
          {d.evidence > 0 && (
            <div style={{ display: "flex", gap: 6 }}>
              {Array.from({ length: d.evidence }).map((_, i) => (
                <div key={i} style={{
                  width: 60, height: 60, borderRadius: 8,
                  background: "linear-gradient(135deg, #FCA5A5, #EF4444)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", flexShrink: 0,
                }}>
                  <I.camera size={18}/>
                </div>
              ))}
              <div style={{ fontSize: 11, color: "var(--k-text-muted)", alignSelf: "center", marginLeft: 4 }}>
                {d.evidence} photos fournies par le client
              </div>
            </div>
          )}
        </div>

        {/* Your response */}
        <div style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--k-text-primary)", marginBottom: 10 }}>
            Votre version des faits
          </div>
          <textarea
            value={msg}
            onChange={e => setMsg(e.target.value)}
            placeholder="Expliquez calmement et factuellement ce qui s'est passé. Nos équipes liront tout."
            rows={5}
            style={{
              width: "100%", padding: 12, borderRadius: 10, border: "1px solid var(--k-border)",
              fontSize: 13.5, fontFamily: "var(--k-font-body)", resize: "vertical", lineHeight: 1.5,
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="k-btn k-btn-secondary k-btn-sm"><I.camera size={13}/> Joindre des photos</button>
            <button className="k-btn k-btn-secondary k-btn-sm"><I.fileText size={13}/> Joindre un document</button>
            <div style={{ flex: 1 }}/>
            <span style={{ fontSize: 11.5, color: "var(--k-text-muted)", alignSelf: "center" }}>
              {msg.length}/1000
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Que souhaitez-vous proposer ?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <DisputeOption label="Je peux revenir réparer gratuitement" desc="Solution préférée — conserve la relation client"/>
            <DisputeOption label="Je propose un remboursement partiel" desc="Montant à définir avec le client"/>
            <DisputeOption label="Remboursement intégral" desc={`${d.amount.toLocaleString("fr-FR")} FC · Vos gains seront ajustés`}/>
            <DisputeOption label="Je conteste — le travail était conforme" desc="Un agent KAYOU arbitrera"/>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="k-btn k-btn-secondary" style={{ flex: 1 }}>
            Escalader à KAYOU
          </button>
          <button className="k-btn k-btn-primary" style={{ flex: 2, justifyContent: "center" }}>
            <I.send size={14}/> Envoyer ma réponse
          </button>
        </div>
      </div>
    </div>
  );
}

function DisputeOption({ label, desc }) {
  return (
    <label style={{
      display: "flex", gap: 12, alignItems: "flex-start",
      padding: 12, borderRadius: 10, border: "1px solid var(--k-border)",
      cursor: "pointer", background: "white",
    }}>
      <input type="radio" name="dispute-opt" style={{ marginTop: 3, accentColor: "var(--k-primary)" }}/>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--k-text-primary)", marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 12, color: "var(--k-text-muted)", lineHeight: 1.4 }}>
          {desc}
        </div>
      </div>
    </label>
  );
}

Object.assign(window, { ProVerification });
