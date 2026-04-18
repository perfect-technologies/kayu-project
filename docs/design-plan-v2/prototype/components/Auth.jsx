// Auth — phone OTP flow. Country picker (CD/CG), number entry, OTP, profile type.
// Four steps: welcome → phone → OTP → done (with role selection on first run).
// Web shows the form centered with a brand side panel; mobile is full-bleed.

const COUNTRIES = [
  { code: "cd", dial: "+243", name: "RD Congo", flag: "🇨🇩", hint: "9 chiffres — ex. 897 123 456" },
  { code: "cg", dial: "+242", name: "Congo-Brazzaville", flag: "🇨🇬", hint: "9 chiffres — ex. 06 123 4567" },
];

const MM_OPERATORS = [
  { id: "mpesa",   name: "M-Pesa",       color: "#10B981", init: "M" },
  { id: "airtel",  name: "Airtel Money", color: "#E11D48", init: "A" },
  { id: "orange",  name: "Orange Money", color: "#F97316", init: "O" },
];

function StepDots({ step, total }) {
  return (
    <div style={{display:"flex", gap: 6, justifyContent:"center"}}>
      {Array.from({length: total}).map((_, i) => (
        <span key={i} style={{
          width: i === step ? 22 : 6, height: 6, borderRadius: 999,
          background: i <= step ? "var(--k-primary)" : "var(--k-border)",
          transition: "width 240ms var(--k-ease-emph), background 240ms",
        }}/>
      ))}
    </div>
  );
}

function Auth({ nav, mobile }) {
  const [step, setStep] = React.useState(0); // 0 phone, 1 otp, 2 done
  const [country, setCountry] = React.useState("cd");
  const [phone, setPhone] = React.useState("");
  const [otp, setOtp] = React.useState(["", "", "", "", "", ""]);
  const otpRefs = React.useRef([]);
  const c = COUNTRIES.find(x => x.code === country);

  const prettyPhone = phone.replace(/(\d{3})(?=\d)/g, "$1 ");
  const phoneValid = phone.length === 9;
  const otpValid = otp.every(d => d);

  const handleOtpChange = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...otp];
    next[i] = v;
    setOtp(next);
    if (v && i < 5) otpRefs.current[i+1]?.focus();
  };
  const handleOtpKey = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i-1]?.focus();
  };

  // Auto-advance from OTP when filled
  React.useEffect(() => {
    if (otpValid && step === 1) {
      const t = setTimeout(() => setStep(2), 600);
      return () => clearTimeout(t);
    }
  }, [otp, step]);

  // ── Step panels ─────────────────────────────────────────────────────────
  const PhoneStep = () => (
    <div>
      <div style={{marginBottom: 24}}>
        <I.logo size={44}/>
      </div>

      <h2 style={{
        fontFamily: "var(--k-font-display)", fontSize: mobile ? 26 : 30, fontWeight: 700,
        letterSpacing: "-0.025em", margin: "0 0 8px", lineHeight: 1.1,
      }}>
        Bienvenue sur KAYOU
      </h2>
      <p className="k-body" style={{color:"var(--k-text-muted)", margin: "0 0 28px", maxWidth: 380}}>
        Entrez votre numéro pour vous connecter ou créer un compte. On vous enverra un code par SMS.
      </p>

      {/* Country tabs */}
      <div style={{
        display: "flex", gap: 8, marginBottom: 16,
        background: "var(--k-surface-muted)", padding: 4, borderRadius: 12,
      }}>
        {COUNTRIES.map(x => {
          const active = country === x.code;
          return (
            <button key={x.code} onClick={() => setCountry(x.code)} style={{
              flex: 1, padding: "10px 8px", borderRadius: 8, border: 0, cursor: "pointer",
              background: active ? "white" : "transparent",
              boxShadow: active ? "0 1px 3px rgba(15,23,42,0.08)" : "none",
              fontFamily: "var(--k-font-body)", fontSize: 13.5, fontWeight: active ? 600 : 500,
              color: active ? "var(--k-text-primary)" : "var(--k-text-muted)",
              display: "inline-flex", alignItems:"center", justifyContent:"center", gap: 6,
              transition: "all 160ms",
            }}>
              <span style={{fontSize: 16}}>{x.flag}</span>
              {x.name}
            </button>
          );
        })}
      </div>

      {/* Phone input */}
      <div style={{
        display: "flex", gap: 0, alignItems:"stretch",
        border: "1px solid var(--k-border)", borderRadius: 12,
        background: "white", overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems:"center", gap: 6, padding: "0 14px",
          background: "var(--k-surface-muted)", borderRight: "1px solid var(--k-border)",
          fontFamily: "var(--k-font-mono)", fontWeight: 600, fontSize: 15,
        }}>
          <span style={{fontSize: 18}}>{c.flag}</span>
          <span>{c.dial}</span>
        </div>
        <input
          inputMode="numeric" maxLength={9}
          value={prettyPhone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
          placeholder="897 123 456"
          autoFocus
          style={{
            flex: 1, border: 0, outline: "none", padding: "0 14px",
            fontFamily: "var(--k-font-mono)", fontWeight: 500, fontSize: 17,
            letterSpacing: "0.02em", color: "var(--k-text-primary)", background: "transparent",
          }}
        />
      </div>
      <div className="k-caption" style={{marginTop: 8, color:"var(--k-text-muted)"}}>
        {c.hint}
      </div>

      <button
        disabled={!phoneValid}
        onClick={() => setStep(1)}
        className="k-btn k-btn-primary k-btn-lg"
        style={{
          width: "100%", marginTop: 24,
          opacity: phoneValid ? 1 : 0.5,
          cursor: phoneValid ? "pointer" : "not-allowed",
        }}>
        Envoyer le code
        <I.arrowRight size={16}/>
      </button>

      <div style={{marginTop: 28, padding: "14px 16px", background: "var(--k-surface-primary)", borderRadius: 12, display: "flex", gap: 10, alignItems: "flex-start"}}>
        <I.shieldCheck size={18} color="var(--k-primary)"/>
        <div className="k-body-m" style={{color: "var(--k-text-body)", fontSize: 13, lineHeight: 1.5}}>
          KAYOU ne partage jamais votre numéro avec les pros tant que vous n'avez pas confirmé une mission.
        </div>
      </div>
    </div>
  );

  const OtpStep = () => (
    <div>
      <button onClick={() => setStep(0)} style={{
        display: "inline-flex", alignItems:"center", gap: 6,
        background: "transparent", border: 0, cursor: "pointer",
        color: "var(--k-text-muted)", fontSize: 13, padding: "6px 2px", marginBottom: 20,
      }}>
        <I.arrowLeft size={14}/> Retour
      </button>

      <h2 style={{
        fontFamily: "var(--k-font-display)", fontSize: mobile ? 24 : 28, fontWeight: 700,
        letterSpacing: "-0.02em", margin: "0 0 8px",
      }}>
        Entrez le code à 6 chiffres
      </h2>
      <p className="k-body" style={{color:"var(--k-text-muted)", margin: "0 0 28px"}}>
        Envoyé par SMS à <strong style={{color:"var(--k-text-primary)"}}>{c.dial} {prettyPhone}</strong>
        {" · "}<button onClick={() => setStep(0)} style={{
          background: "transparent", border: 0, padding: 0, cursor: "pointer",
          color: "var(--k-primary-hover)", fontSize: "inherit", fontWeight: 600,
        }}>modifier</button>
      </p>

      {/* OTP slots */}
      <div style={{display:"flex", gap: 8, justifyContent:"space-between", marginBottom: 24}}>
        {otp.map((d, i) => (
          <input
            key={i} ref={el => otpRefs.current[i] = el}
            value={d}
            onChange={(e) => handleOtpChange(i, e.target.value)}
            onKeyDown={(e) => handleOtpKey(i, e)}
            inputMode="numeric" maxLength={1}
            autoFocus={i === 0}
            style={{
              width: mobile ? 44 : 52, height: mobile ? 56 : 64, textAlign: "center",
              fontFamily: "var(--k-font-mono)", fontWeight: 600, fontSize: mobile ? 22 : 26,
              color: "var(--k-text-primary)", background: "white",
              border: `2px solid ${d ? "var(--k-primary)" : "var(--k-border)"}`,
              borderRadius: 12, outline: "none",
              transition: "border-color 160ms, transform 160ms",
              transform: d ? "scale(1.02)" : "scale(1)",
            }}
          />
        ))}
      </div>

      <div style={{textAlign:"center"}}>
        <span className="k-caption" style={{color:"var(--k-text-muted)"}}>
          Pas de SMS ? <button style={{
            background: "transparent", border: 0, padding: 0, cursor: "pointer",
            color: "var(--k-primary-hover)", fontSize: "inherit", fontWeight: 600,
          }}>Renvoyer dans 32s</button>
        </span>
      </div>
    </div>
  );

  const DoneStep = () => (
    <div style={{textAlign:"center"}}>
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: "var(--k-success)", color: "white",
        margin: "0 auto 24px",
        display: "flex", alignItems:"center", justifyContent:"center",
        boxShadow: "0 0 0 8px var(--k-success-subtle), 0 10px 30px -10px var(--k-success)",
        animation: "kscale-in 420ms var(--k-ease-bounce)",
      }}>
        <I.check size={38} stroke={2.5}/>
      </div>
      <h2 style={{
        fontFamily: "var(--k-font-display)", fontSize: mobile ? 24 : 28, fontWeight: 700,
        letterSpacing: "-0.02em", margin: "0 0 8px",
      }}>
        Vous êtes connecté·e
      </h2>
      <p className="k-body" style={{color:"var(--k-text-muted)", margin: "0 0 28px", maxWidth: 340, marginLeft: "auto", marginRight: "auto"}}>
        Comment voulez-vous utiliser KAYOU ?
      </p>

      <div style={{display:"flex", flexDirection: "column", gap: 10, textAlign:"left"}}>
        <button onClick={() => nav("home")} style={{
          display: "flex", alignItems:"center", gap: 14, padding: "16px 18px",
          border: "1px solid var(--k-border)", borderRadius: 14, background: "white",
          cursor: "pointer", textAlign: "left", width: "100%",
          transition: "border-color 120ms, box-shadow 120ms",
        }}
        onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--k-primary)"; e.currentTarget.style.boxShadow = "0 4px 12px -4px var(--k-primary)"; }}
        onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--k-border)"; e.currentTarget.style.boxShadow = "none"; }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "var(--k-primary-subtle)", color: "var(--k-primary)",
            display: "flex", alignItems:"center", justifyContent:"center", flexShrink: 0,
          }}><I.search size={22}/></div>
          <div style={{flex: 1}}>
            <div style={{fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 15.5}}>Je cherche un pro</div>
            <div className="k-caption" style={{color:"var(--k-text-muted)", marginTop: 2}}>
              Plombier, électricien, coiffeuse, ménage…
            </div>
          </div>
          <I.chevronRight size={18} color="var(--k-text-subtle)"/>
        </button>

        <button onClick={() => nav("onboarding")} style={{
          display: "flex", alignItems:"center", gap: 14, padding: "16px 18px",
          border: "1px solid var(--k-border)", borderRadius: 14, background: "white",
          cursor: "pointer", textAlign: "left", width: "100%",
          transition: "border-color 120ms, box-shadow 120ms",
        }}
        onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--k-accent)"; e.currentTarget.style.boxShadow = "0 4px 12px -4px var(--k-accent)"; }}
        onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--k-border)"; e.currentTarget.style.boxShadow = "none"; }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "var(--k-accent-subtle)", color: "var(--k-accent)",
            display: "flex", alignItems:"center", justifyContent:"center", flexShrink: 0,
          }}><I.sparkles size={22}/></div>
          <div style={{flex: 1}}>
            <div style={{fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 15.5}}>Je suis un pro</div>
            <div className="k-caption" style={{color:"var(--k-text-muted)", marginTop: 2}}>
              Recevez des demandes, gérez vos missions, payez-vous en M-Pesa.
            </div>
          </div>
          <I.chevronRight size={18} color="var(--k-text-subtle)"/>
        </button>
      </div>
    </div>
  );

  const panel = (
    <>
      {step === 0 && <PhoneStep/>}
      {step === 1 && <OtpStep/>}
      {step === 2 && <DoneStep/>}
      {step >= 0 && step < 2 && (
        <div style={{marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--k-border-subtle)"}}>
          <StepDots step={step} total={2}/>
        </div>
      )}
    </>
  );

  if (mobile) {
    return (
      <div style={{minHeight: "100%", display: "flex", flexDirection: "column", background: "var(--k-bg)"}}>
        <div style={{flex: 1, padding: "48px 24px 32px", display: "flex", flexDirection: "column"}}>
          {panel}
        </div>
      </div>
    );
  }

  // WEB — split panel
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "minmax(420px, 1fr) 1.1fr",
      minHeight: "100%", background: "var(--k-bg)",
    }}>
      <div style={{
        padding: "48px 56px", display: "flex", flexDirection: "column", justifyContent: "center",
        maxWidth: 520, margin: "0 auto", width: "100%",
      }}>
        {panel}
      </div>

      {/* Brand side */}
      <div style={{
        background: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 55%, #0C4A6E 100%)",
        position: "relative", overflow: "hidden", color: "white",
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
        padding: 56,
      }}>
        {/* Decorative pattern */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.14) 0%, transparent 40%), radial-gradient(circle at 80% 75%, rgba(251,113,133,0.2) 0%, transparent 50%), repeating-linear-gradient(135deg, transparent 0, transparent 24px, rgba(255,255,255,0.04) 24px, rgba(255,255,255,0.04) 25px)",
        }}/>

        {/* Big stat */}
        <div style={{position: "relative"}}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 24,
            opacity: 0.9,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%", background: "#86EFAC",
              animation: "kpulse 2s ease-in-out infinite",
            }}/>
            <span className="k-overline" style={{color: "white", opacity: 0.8}}>En direct · Kinshasa</span>
          </div>

          <div style={{
            fontFamily: "var(--k-font-display)", fontSize: 44, fontWeight: 700,
            lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: 20, maxWidth: 440,
          }}>
            2 187 pros vérifiés.<br/>
            <span style={{opacity: 0.7}}>Un·e à 10 minutes de chez vous.</span>
          </div>

          {/* Mini live feed */}
          <div style={{
            display: "flex", flexDirection: "column", gap: 8, marginTop: 32,
            maxWidth: 420,
          }}>
            {[
              { t: "Jean a accepté une mission", sub: "Plomberie · Gombe · il y a 12s" },
              { t: "Grâce vient de finir une mission", sub: "Électricité · Lemba · 4,9 ★" },
              { t: "Nouveau pro vérifié : Serge", sub: "Menuiserie · Limete · rejoint KAYOU" },
            ].map((row, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 12,
                background: "rgba(255,255,255,0.08)", backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.1)",
                opacity: 1 - i * 0.15,
              }}>
                <span style={{
                  width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.18)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}><I.check size={14} stroke={2.25}/></span>
                <div style={{minWidth: 0}}>
                  <div style={{fontSize: 13.5, fontWeight: 600}}>{row.t}</div>
                  <div style={{fontSize: 11.5, opacity: 0.7, marginTop: 1}}>{row.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Auth });

if (!document.getElementById("kscale-in-style")) {
  const s = document.createElement("style");
  s.id = "kscale-in-style";
  s.textContent = `@keyframes kscale-in { 0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }`;
  document.head.appendChild(s);
}
