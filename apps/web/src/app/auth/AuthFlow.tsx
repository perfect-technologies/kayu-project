"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { I } from "@kayu/ui/web";
import { useAuth } from "@/contexts/AuthContext";

// DS02 — Auth phone OTP flow.
// UI pixel-source-of-truth: docs/design-plan-v2/prototype/components/Auth.jsx.
// Backend OTP wiring (supabase.auth.signInWithOtp / verifyOtp) is out of scope
// for this chunk — see docs/design-plan-v2/PROGRESS.md.

const COUNTRIES = [
  {
    code: "cd",
    dial: "+243",
    name: "RD Congo",
    flag: "🇨🇩",
    hint: "9 chiffres — ex. 897 123 456",
  },
  {
    code: "cg",
    dial: "+242",
    name: "Congo-Brazzaville",
    flag: "🇨🇬",
    hint: "9 chiffres — ex. 06 123 4567",
  },
] as const;

type CountryCode = (typeof COUNTRIES)[number]["code"];

const OTP_LENGTH = 6;
const RESEND_SECONDS = 32;

// Dev-only seeded accounts. Phone+OTP is the real flow; these exist so the
// team can exercise each role end-to-end before the SMS provider is wired up.
const DEMO_ACCOUNTS = [
  {
    role: "Client",
    name: "Paul Kabasele",
    email: "paul.kabasele@email.cd",
    password: "Password123!",
    hint: "Réservations et favoris",
    tone: "success" as const,
    initials: "PK",
  },
  {
    role: "Prestataire",
    name: "Jean-Pierre Mukendi",
    email: "jeanpierre.mukendi@kayou.cd",
    password: "Password123!",
    hint: "Profil pro et demandes",
    tone: "primary" as const,
    initials: "JM",
  },
  {
    role: "Admin",
    name: "Admin KAYOU",
    email: "admin@kayou.cd",
    password: "Password123!",
    hint: "Pilotage et modération",
    tone: "danger" as const,
    initials: "AK",
  },
] as const;

const SHOW_DEMO_ACCOUNTS = process.env.NODE_ENV !== "production";

function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div
      style={{ display: "flex", gap: 6, justifyContent: "center" }}
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={step + 1}
    >
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          style={{
            width: i === step ? 22 : 6,
            height: 6,
            borderRadius: 999,
            background: i <= step ? "var(--k-primary)" : "var(--k-border)",
            transition:
              "width 240ms var(--k-ease-emph), background 240ms var(--k-ease-std)",
          }}
        />
      ))}
    </div>
  );
}

export function AuthFlow() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [country, setCountry] = useState<CountryCode>("cd");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState<string[]>(() =>
    Array.from({ length: OTP_LENGTH }, () => ""),
  );
  const [resendLeft, setResendLeft] = useState(RESEND_SECONDS);
  const [demoLoadingEmail, setDemoLoadingEmail] = useState<string | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const c = COUNTRIES.find((x) => x.code === country)!;
  const prettyPhone = phone.replace(/(\d{3})(?=\d)/g, "$1 ");
  const phoneValid = phone.length === 9;
  const otpValid = otp.every((d) => d);

  // Resend countdown — only active on step 1 (OTP).
  useEffect(() => {
    if (step !== 1) return;
    setResendLeft(RESEND_SECONDS);
    const id = setInterval(() => {
      setResendLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  // Auto-advance when OTP is complete.
  useEffect(() => {
    if (step !== 1 || !otpValid) return;
    const t = setTimeout(() => setStep(2), 600);
    return () => clearTimeout(t);
  }, [otpValid, step]);

  const requestOtp = () => {
    // Backend wiring (supabase.auth.signInWithOtp) — deferred. DS02 ships UI only.
    setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
    setStep(1);
  };

  const handleOtpChange = (i: number, raw: string) => {
    // Handle paste of the full code into any slot.
    const digits = raw.replace(/\D/g, "");
    if (digits.length > 1) {
      const filled = [...otp];
      for (let k = 0; k < OTP_LENGTH; k++) {
        filled[k] = digits[k] ?? "";
      }
      setOtp(filled);
      const lastFilled = Math.min(digits.length, OTP_LENGTH) - 1;
      otpRefs.current[Math.min(lastFilled + 1, OTP_LENGTH - 1)]?.focus();
      return;
    }
    if (!/^\d?$/.test(digits)) return;
    const next = [...otp];
    next[i] = digits;
    setOtp(next);
    if (digits && i < OTP_LENGTH - 1) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) otpRefs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < OTP_LENGTH - 1)
      otpRefs.current[i + 1]?.focus();
  };

  const pickClient = () => router.replace("/");
  const pickPro = () => router.replace("/pro/onboarding");

  const handleDemoLogin = async (
    account: (typeof DEMO_ACCOUNTS)[number],
  ) => {
    setDemoError(null);
    setDemoLoadingEmail(account.email);
    try {
      await login(account.email, account.password);
      // Role-appropriate landing, matching the DoneStep routes.
      if (account.role === "Prestataire") router.replace("/pro");
      else if (account.role === "Admin") router.replace("/admin");
      else router.replace("/");
    } catch (err) {
      setDemoError(
        err instanceof Error ? err.message : "Erreur de connexion",
      );
      setDemoLoadingEmail(null);
    }
  };

  const phoneStep = (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div
          aria-hidden
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "var(--k-primary)",
            color: "white",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--k-font-display)",
            fontWeight: 800,
            fontSize: 20,
            letterSpacing: "0.02em",
            boxShadow: "var(--k-e-brand)",
          }}
        >
          K
        </div>
      </div>

      <h1
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: "-0.025em",
          margin: "0 0 8px",
          lineHeight: 1.1,
          color: "var(--k-text-primary)",
        }}
      >
        Bienvenue sur KAYOU
      </h1>
      <p
        className="k-body"
        style={{
          color: "var(--k-text-muted)",
          margin: "0 0 28px",
          maxWidth: 380,
        }}
      >
        Entrez votre numéro pour vous connecter ou créer un compte. On vous
        enverra un code par SMS.
      </p>

      {/* Country tabs */}
      <div
        role="tablist"
        aria-label="Pays"
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          background: "var(--k-surface-muted)",
          padding: 4,
          borderRadius: 12,
        }}
      >
        {COUNTRIES.map((x) => {
          const active = country === x.code;
          return (
            <button
              key={x.code}
              role="tab"
              aria-selected={active}
              onClick={() => setCountry(x.code)}
              style={{
                flex: 1,
                padding: "10px 8px",
                borderRadius: 8,
                border: 0,
                cursor: "pointer",
                background: active ? "var(--k-surface)" : "transparent",
                boxShadow: active
                  ? "0 1px 3px rgba(15,23,42,0.08)"
                  : "none",
                fontFamily: "var(--k-font-body)",
                fontSize: 13.5,
                fontWeight: active ? 600 : 500,
                color: active
                  ? "var(--k-text-primary)"
                  : "var(--k-text-muted)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transition: "all 160ms var(--k-ease-std)",
              }}
            >
              <span style={{ fontSize: 16 }} aria-hidden>
                {x.flag}
              </span>
              {x.name}
            </button>
          );
        })}
      </div>

      {/* Phone input */}
      <label
        htmlFor="k-phone"
        style={{
          display: "flex",
          gap: 0,
          alignItems: "stretch",
          border: "1px solid var(--k-border)",
          borderRadius: 12,
          background: "var(--k-surface)",
          overflow: "hidden",
          cursor: "text",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "0 14px",
            background: "var(--k-surface-muted)",
            borderRight: "1px solid var(--k-border)",
            fontFamily: "var(--k-font-mono)",
            fontWeight: 600,
            fontSize: 15,
          }}
        >
          <span style={{ fontSize: 18 }} aria-hidden>
            {c.flag}
          </span>
          <span>{c.dial}</span>
        </div>
        <input
          id="k-phone"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={11}
          value={prettyPhone}
          onChange={(e) =>
            setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))
          }
          placeholder="897 123 456"
          autoFocus
          aria-label={`Numéro de téléphone (${c.name})`}
          style={{
            flex: 1,
            border: 0,
            outline: "none",
            padding: "0 14px",
            height: 48,
            fontFamily: "var(--k-font-mono)",
            fontWeight: 500,
            fontSize: 17,
            letterSpacing: "0.02em",
            color: "var(--k-text-primary)",
            background: "transparent",
          }}
        />
      </label>
      <div
        className="k-caption"
        style={{ marginTop: 8, color: "var(--k-text-muted)" }}
      >
        {c.hint}
      </div>

      <button
        type="button"
        disabled={!phoneValid}
        onClick={requestOtp}
        className="k-btn k-btn-primary k-btn-lg"
        style={{
          width: "100%",
          marginTop: 24,
          opacity: phoneValid ? 1 : 0.5,
          cursor: phoneValid ? "pointer" : "not-allowed",
        }}
      >
        Envoyer le code
        <I.arrowRight size={16} />
      </button>

      <div
        style={{
          marginTop: 28,
          padding: "14px 16px",
          background: "var(--k-surface-primary)",
          borderRadius: 12,
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <I.shieldCheck size={18} strokeColor="var(--k-primary)" />
        <div
          style={{
            color: "var(--k-text-body)",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          KAYOU ne partage jamais votre numéro avec les pros tant que vous
          n&apos;avez pas confirmé une mission.
        </div>
      </div>

      {SHOW_DEMO_ACCOUNTS && (
        <DemoAccountsPanel
          loadingEmail={demoLoadingEmail}
          error={demoError}
          onPick={handleDemoLogin}
        />
      )}
    </div>
  );

  const otpStep = (
    <div>
      <button
        type="button"
        onClick={() => setStep(0)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "transparent",
          border: 0,
          cursor: "pointer",
          color: "var(--k-text-muted)",
          fontSize: 13,
          padding: "6px 2px",
          marginBottom: 20,
        }}
      >
        <I.arrowLeft size={14} /> Retour
      </button>

      <h1
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          margin: "0 0 8px",
          color: "var(--k-text-primary)",
        }}
      >
        Entrez le code à 6 chiffres
      </h1>
      <p
        className="k-body"
        style={{ color: "var(--k-text-muted)", margin: "0 0 28px" }}
      >
        Envoyé par SMS à{" "}
        <strong style={{ color: "var(--k-text-primary)" }}>
          {c.dial} {prettyPhone}
        </strong>
        {" · "}
        <button
          type="button"
          onClick={() => setStep(0)}
          style={{
            background: "transparent",
            border: 0,
            padding: 0,
            cursor: "pointer",
            color: "var(--k-primary-hover)",
            fontSize: "inherit",
            fontWeight: 600,
          }}
        >
          modifier
        </button>
      </p>

      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        {otp.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              otpRefs.current[i] = el;
            }}
            value={d}
            onChange={(e) => handleOtpChange(i, e.target.value)}
            onKeyDown={(e) => handleOtpKey(i, e)}
            inputMode="numeric"
            maxLength={i === 0 ? OTP_LENGTH : 1}
            autoFocus={i === 0}
            aria-label={`Chiffre ${i + 1}`}
            autoComplete={i === 0 ? "one-time-code" : "off"}
            style={{
              width: 52,
              height: 64,
              textAlign: "center",
              fontFamily: "var(--k-font-mono)",
              fontWeight: 600,
              fontSize: 26,
              color: "var(--k-text-primary)",
              background: "var(--k-surface)",
              border: `2px solid ${d ? "var(--k-primary)" : "var(--k-border)"}`,
              borderRadius: 12,
              outline: "none",
              transition: "border-color 160ms, transform 160ms",
              transform: d ? "scale(1.02)" : "scale(1)",
            }}
          />
        ))}
      </div>

      <div style={{ textAlign: "center" }}>
        <span
          className="k-caption"
          style={{ color: "var(--k-text-muted)" }}
        >
          Pas de SMS ?{" "}
          <button
            type="button"
            disabled={resendLeft > 0}
            onClick={() => setResendLeft(RESEND_SECONDS)}
            style={{
              background: "transparent",
              border: 0,
              padding: 0,
              cursor: resendLeft > 0 ? "not-allowed" : "pointer",
              color: "var(--k-primary-hover)",
              fontSize: "inherit",
              fontWeight: 600,
              opacity: resendLeft > 0 ? 0.75 : 1,
            }}
          >
            {resendLeft > 0 ? `Renvoyer dans ${resendLeft}s` : "Renvoyer le code"}
          </button>
        </span>
      </div>
    </div>
  );

  const doneStep = (
    <div style={{ textAlign: "center" }}>
      <div
        role="img"
        aria-label="Connexion réussie"
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "var(--k-success)",
          color: "white",
          margin: "0 auto 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow:
            "0 0 0 8px var(--k-success-subtle), 0 10px 30px -10px rgba(16,185,129,0.6)",
          animation: "kScaleIn 420ms var(--k-ease-bounce)",
        }}
        className="k-auth-success"
      >
        <I.check size={38} stroke={2.5} />
      </div>
      <h1
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          margin: "0 0 8px",
          color: "var(--k-text-primary)",
        }}
      >
        Vous êtes connecté·e
      </h1>
      <p
        className="k-body"
        style={{
          color: "var(--k-text-muted)",
          margin: "0 auto 28px",
          maxWidth: 340,
        }}
      >
        Comment voulez-vous utiliser KAYOU ?
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          textAlign: "left",
        }}
      >
        <RoleCard
          icon={<I.search size={22} />}
          title="Je cherche un pro"
          subtitle="Plombier, électricien, coiffeuse, ménage…"
          tone="primary"
          onClick={pickClient}
        />
        <RoleCard
          icon={<I.sparkles size={22} />}
          title="Je suis un pro"
          subtitle="Recevez des demandes, gérez vos missions, payez-vous en M-Pesa."
          tone="accent"
          onClick={pickPro}
        />
      </div>
    </div>
  );

  const panel = (
    <>
      {step === 0 && phoneStep}
      {step === 1 && otpStep}
      {step === 2 && doneStep}
      {step < 2 && (
        <div
          style={{
            marginTop: 32,
            paddingTop: 20,
            borderTop: "1px solid var(--k-border-subtle)",
          }}
        >
          <StepDots step={step} total={2} />
        </div>
      )}
    </>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--k-bg)",
      }}
    >
        {/* Mobile ≤ 1023px: full-bleed single column */}
        <div
          className="block lg:hidden"
          style={{
            minHeight: "100vh",
            padding: "48px 24px 32px",
            display: "flex",
            flexDirection: "column",
            background: "var(--k-bg)",
          }}
        >
          {panel}
        </div>

        {/* Web ≥ 1024px: split panel */}
        <div
          className="hidden lg:grid"
          style={{
            gridTemplateColumns: "minmax(420px, 1fr) 1.1fr",
            minHeight: "100vh",
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              padding: "48px 56px",
              display: "grid",
              placeItems: "center",
              minHeight: "100vh",
            }}
          >
            <div style={{ width: "100%", maxWidth: 520 }}>{panel}</div>
          </div>

          <BrandSide />
        </div>
    </div>
  );
}

function RoleCard({
  icon,
  title,
  subtitle,
  tone,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tone: "primary" | "accent";
  onClick: () => void;
}) {
  const tint = tone === "primary" ? "var(--k-primary)" : "var(--k-accent)";
  const tintSubtle =
    tone === "primary" ? "var(--k-primary-subtle)" : "var(--k-accent-subtle)";
  return (
    <button
      type="button"
      onClick={onClick}
      className="k-auth-role-card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 18px",
        border: "1px solid var(--k-border)",
        borderRadius: 14,
        background: "var(--k-surface)",
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        transition:
          "border-color 160ms var(--k-ease-std), box-shadow 160ms var(--k-ease-std)",
        // @ts-expect-error CSS custom properties
        "--role-tint": tint,
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = tint;
        e.currentTarget.style.boxShadow = `0 4px 12px -4px ${tint}`;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = "var(--k-border)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: tintSubtle,
          color: tint,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: "var(--k-font-display)",
            fontWeight: 600,
            fontSize: 15.5,
            color: "var(--k-text-primary)",
          }}
        >
          {title}
        </div>
        <div
          className="k-caption"
          style={{ color: "var(--k-text-muted)", marginTop: 2 }}
        >
          {subtitle}
        </div>
      </div>
      <I.chevronRight size={18} strokeColor="var(--k-text-subtle)" />
    </button>
  );
}

function BrandSide() {
  const feed = [
    { t: "Jean a accepté une mission", sub: "Plomberie · Gombe · il y a 12s" },
    { t: "Grâce vient de finir une mission", sub: "Électricité · Lemba · 4,9 ★" },
    {
      t: "Nouveau pro vérifié : Serge",
      sub: "Menuiserie · Limete · rejoint KAYOU",
    },
  ];
  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, #0EA5E9 0%, #0284C7 55%, #0C4A6E 100%)",
        position: "relative",
        overflow: "hidden",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: 56,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.14) 0%, transparent 40%), radial-gradient(circle at 80% 75%, rgba(251,113,133,0.2) 0%, transparent 50%), repeating-linear-gradient(135deg, transparent 0, transparent 24px, rgba(255,255,255,0.04) 24px, rgba(255,255,255,0.04) 25px)",
        }}
      />

      <div style={{ position: "relative" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 24,
            opacity: 0.9,
          }}
        >
          <span
            className="k-auth-pulse"
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#86EFAC",
              animation: "kPulse 2s ease-in-out infinite",
            }}
          />
          <span
            className="k-overline"
            style={{ color: "white", opacity: 0.8 }}
          >
            En direct · Kinshasa
          </span>
        </div>

        <div
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 44,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            marginBottom: 20,
            maxWidth: 440,
          }}
        >
          2 187 pros vérifiés.
          <br />
          <span style={{ opacity: 0.7 }}>
            Un·e à 10 minutes de chez vous.
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginTop: 32,
            maxWidth: 420,
          }}
        >
          {feed.map((row, i) => (
            <div
              key={i}
              className="k-auth-feed"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.1)",
                opacity: 1 - i * 0.15,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.18)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <I.check size={14} stroke={2.25} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{row.t}</div>
                <div
                  style={{
                    fontSize: 11.5,
                    opacity: 0.7,
                    marginTop: 1,
                  }}
                >
                  {row.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DemoAccountsPanel({
  loadingEmail,
  error,
  onPick,
}: {
  loadingEmail: string | null;
  error: string | null;
  onPick: (account: (typeof DEMO_ACCOUNTS)[number]) => void;
}) {
  const TONE: Record<"success" | "primary" | "danger", string> = {
    success: "var(--k-success)",
    primary: "var(--k-primary)",
    danger: "var(--k-danger)",
  };
  const busy = loadingEmail !== null;
  return (
    <div
      style={{
        marginTop: 20,
        padding: "14px 16px",
        background: "var(--k-surface-muted)",
        border: "1px dashed var(--k-border)",
        borderRadius: 12,
      }}
    >
      <div
        className="k-overline"
        style={{ color: "var(--k-text-muted)", marginBottom: 4 }}
      >
        Accès rapide (dev)
      </div>
      <div
        className="k-caption"
        style={{ color: "var(--k-text-muted)", marginBottom: 12 }}
      >
        Comptes seedés — email pour l&apos;instant, OTP à venir.
      </div>
      {error && (
        <div
          role="alert"
          style={{
            marginBottom: 10,
            padding: "8px 12px",
            borderRadius: 10,
            background: "var(--k-danger-subtle)",
            color: "var(--k-danger)",
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          {error}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {DEMO_ACCOUNTS.map((a) => {
          const isLoading = loadingEmail === a.email;
          return (
            <button
              key={a.email}
              type="button"
              disabled={busy}
              onClick={() => onPick(a)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                background: "var(--k-surface)",
                border: "1px solid var(--k-border)",
                borderRadius: 10,
                cursor: busy ? "not-allowed" : "pointer",
                opacity: busy && !isLoading ? 0.55 : 1,
                textAlign: "left",
                transition:
                  "border-color 160ms var(--k-ease-std), box-shadow 160ms var(--k-ease-std)",
              }}
              onMouseOver={(e) => {
                if (!busy) {
                  e.currentTarget.style.borderColor = TONE[a.tone];
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "var(--k-border)";
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: TONE[a.tone],
                  color: "white",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--k-font-body)",
                  fontWeight: 700,
                  fontSize: 12.5,
                  flexShrink: 0,
                }}
              >
                {isLoading ? "…" : a.initials}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: "var(--k-text-primary)",
                    }}
                  >
                    {a.name}
                  </span>
                  <span
                    className="k-chip-sm"
                    style={{
                      height: 18,
                      padding: "0 6px",
                      fontSize: 10,
                      fontWeight: 600,
                      borderRadius: 999,
                      background: "var(--k-surface-muted)",
                      color: "var(--k-text-muted)",
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    {a.role}
                  </span>
                </div>
                <div
                  className="k-caption"
                  style={{ color: "var(--k-text-muted)", marginTop: 1 }}
                >
                  {a.hint}
                </div>
              </div>
              <I.chevronRight size={14} strokeColor="var(--k-text-subtle)" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
