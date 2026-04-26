"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { I } from "@kayu/ui/web";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import { apiClient } from "@/lib/api";
import { identityApi } from "@kayu/api";

// I02 — Auth phone OTP (finalized).
// Two modes distinguished by ?mode= query:
//   login  (default)  : phone → OTP → route by role (with name/role edge-case steps)
//   signup            : role → phone → OTP → (client) name → route; pro skips name
// See docs/integration-plan/I02-auth-otp-finalize.md.

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
type Role = "CLIENT" | "PROVIDER";
type FallbackKind = "name" | "rolePicker";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 32;

const CITIES_CD = [
  "Kinshasa",
  "Lubumbashi",
  "Goma",
  "Mbuji-Mayi",
  "Kisangani",
  "Matadi",
  "Boma",
  "Likasi",
  "Kolwezi",
];
const CITIES_CG = ["Brazzaville", "Pointe-Noire", "Dolisie", "Nkayi", "Impfondo"];

// Dev-only seeded accounts: real phone OTP is the production flow; these let
// the team exercise each role end-to-end without waiting on SMS. Hidden in prod.
const DEMO_ACCOUNTS = [
  {
    role: "Client" as const,
    name: "Paul Kabasele",
    email: "paul.kabasele@email.cd",
    password: "Password123!",
    hint: "Réservations et favoris",
    tone: "success" as const,
    initials: "PK",
    landing: "/" as const,
  },
  {
    role: "Prestataire" as const,
    name: "Jean-Pierre Mukendi",
    email: "jeanpierre.mukendi@kayou.cd",
    password: "Password123!",
    hint: "Profil pro et demandes",
    tone: "primary" as const,
    initials: "JM",
    landing: "/pro" as const,
  },
  {
    role: "Admin" as const,
    name: "Admin KAYOU",
    email: "admin@kayou.cd",
    password: "Password123!",
    hint: "Pilotage et modération",
    tone: "danger" as const,
    initials: "AK",
    landing: "/dashboard/admin" as const,
  },
];

const SHOW_DEMO_ACCOUNTS = process.env.NODE_ENV !== "production";

function supabaseErrorCopy(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  if (/invalid\s*phone|invalid\s*number|phone\s*number/i.test(msg)) {
    return "Numéro invalide. Vérifie le format.";
  }
  if (/token|otp|code/i.test(msg) && /invalid|expired/i.test(msg)) {
    return "Code invalide ou expiré. Demande-en un nouveau.";
  }
  if (/rate|too many|too\s*many\s*requests/i.test(msg)) {
    return "Trop de tentatives. Réessaie dans quelques minutes.";
  }
  return "Impossible d'envoyer le code. Réessaie dans un instant.";
}

export function AuthFlow() {
  return (
    <Suspense fallback={null}>
      <AuthFlowInner />
    </Suspense>
  );
}

function AuthFlowInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode: "signup" | "login" =
    searchParams.get("mode") === "signup" ? "signup" : "login";
  const { refreshUser, login } = useAuth();
  const supabase = createClient();

  const [step, setStep] = useState<0 | 1 | 2 | 3>(mode === "signup" ? 0 : 1);
  const [chosenRole, setChosenRole] = useState<Role | null>(null);
  const [fallbackKind, setFallbackKind] = useState<FallbackKind | null>(null);
  const [country, setCountry] = useState<CountryCode>("cd");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState<string[]>(() =>
    Array.from({ length: OTP_LENGTH }, () => ""),
  );
  const [resendLeft, setResendLeft] = useState(RESEND_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [nameFirst, setNameFirst] = useState("");
  const [nameLast, setNameLast] = useState("");
  const [nameCity, setNameCity] = useState("Kinshasa");
  const [nameEmail, setNameEmail] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [demoLoadingEmail, setDemoLoadingEmail] = useState<string | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const c = COUNTRIES.find((x) => x.code === country)!;
  const prettyPhone = phone.replace(/(\d{3})(?=\d)/g, "$1 ");
  const phoneValid = phone.length === 9;
  const otpValid = otp.every((d) => d);
  const fullPhone = `${c.dial}${phone}`;
  const citiesForCountry = country === "cd" ? CITIES_CD : CITIES_CG;

  // Total dots in the header indicator.
  //   signup as client = 4 (role, phone, otp, name)
  //   signup as pro    = 3 (role, phone, otp)
  //   login happy path = 2 (phone, otp)
  //   login + fallback = 3 or 4 (phone, otp, [name])
  const totalDots = (() => {
    if (mode === "signup") {
      if (chosenRole === "PROVIDER") return 3;
      return 4; // client signup or role not picked yet → assume client
    }
    if (step === 3) return 3; // login edge: add one fallback dot
    return 2;
  })();
  // Dots index — for login flows, shift step 1/2/3 → 0/1/2.
  const dotsStep = mode === "signup" ? step : Math.max(0, step - 1);

  // Resend countdown — only active on OTP step.
  useEffect(() => {
    if (step !== 2) return;
    setResendLeft(RESEND_SECONDS);
    const id = setInterval(() => {
      setResendLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  // Auto-verify when OTP is complete.
  useEffect(() => {
    if (step !== 2 || !otpValid || submitting) return;
    const t = setTimeout(() => {
      handleVerifyOtp();
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpValid, step]);

  const handleSelectRole = (role: Role) => {
    setChosenRole(role);
    setStep(1);
  };

  const handleDemoLogin = async (account: (typeof DEMO_ACCOUNTS)[number]) => {
    if (demoLoadingEmail) return;
    setDemoError(null);
    setDemoLoadingEmail(account.email);
    try {
      await login(account.email, account.password);
      router.replace(account.landing);
    } catch (err) {
      setDemoError(err instanceof Error ? err.message : "Erreur de connexion");
      setDemoLoadingEmail(null);
    }
  };

  const handleRequestOtp = async () => {
    if (!phoneValid || submitting) return;
    setPhoneError(null);
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
      if (error) throw error;
      setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
      setStep(2);
    } catch (err) {
      setPhoneError(supabaseErrorCopy(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendLeft > 0 || submitting) return;
    setOtpError(null);
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
      if (error) throw error;
      setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
      setResendLeft(RESEND_SECONDS);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setOtpError(supabaseErrorCopy(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== OTP_LENGTH || submitting) return;
    setOtpError(null);
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: code,
        type: "sms",
      });
      if (error) throw error;
      const token = data.session?.access_token;
      if (!token) throw new Error("No session returned");
      apiClient.setAccessToken(token);

      const me = await identityApi(apiClient).me();
      const userRole = me.user?.role as "CLIENT" | "PROVIDER" | "ADMIN" | null | undefined;
      const userFirstName = me.user?.firstName ?? null;
      const roleSelectedAt = me.user?.roleSelectedAt ?? null;
      const hasSelectedRole = Boolean(roleSelectedAt);

      // SIGNUP flow — persist the chosen role even if the backend already returned
      // a default CLIENT. The backend /me/role call is idempotent and will reject
      // the request only after the user has already deliberately committed a role.
      if (mode === "signup" && chosenRole && !hasSelectedRole) {
        await identityApi(apiClient).setRole({ role: chosenRole });
        if (chosenRole === "PROVIDER") {
          await refreshUser();
          router.replace("/pro/onboarding");
          return;
        }
        // client signup — collect name
        setFallbackKind("name");
        setStep(3);
        setSubmitting(false);
        return;
      }

      // LOGIN flow — fallback when role has not been explicitly selected yet
      if (!hasSelectedRole || !userRole) {
        setFallbackKind("rolePicker");
        setStep(3);
        setSubmitting(false);
        return;
      }

      // Returning pro — dashboard banner (I03) handles incomplete onboarding
      if (userRole === "PROVIDER") {
        await refreshUser();
        router.replace("/pro");
        return;
      }

      // Returning client missing firstName
      if (userRole === "CLIENT" && !userFirstName) {
        setFallbackKind("name");
        setStep(3);
        setSubmitting(false);
        return;
      }

      // ADMIN or happy-path client
      await refreshUser();
      router.replace(userRole === "ADMIN" ? "/dashboard/admin" : "/");
    } catch (err) {
      setOtpError(supabaseErrorCopy(err));
      setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
      otpRefs.current[0]?.focus();
      setSubmitting(false);
    }
  };

  const handleRoleFallback = async (role: Role) => {
    if (submitting) return;
    setNameError(null);
    setSubmitting(true);
    try {
      await identityApi(apiClient).setRole({ role });
      if (role === "PROVIDER") {
        await refreshUser();
        router.replace("/pro/onboarding");
        return;
      }
      // CLIENT — need name
      setChosenRole("CLIENT");
      setFallbackKind("name");
      setSubmitting(false);
    } catch (err) {
      setNameError(err instanceof Error ? err.message : "Une erreur est survenue. Réessaie.");
      setSubmitting(false);
    }
  };

  const handleSubmitName = async () => {
    if (submitting) return;
    if (nameFirst.trim().length < 2 || nameLast.trim().length < 2) {
      setNameError("Le prénom et le nom sont requis (2 caractères min).");
      return;
    }
    setNameError(null);
    setSubmitting(true);
    try {
      await identityApi(apiClient).completeProfile({
        firstName: nameFirst.trim(),
        lastName: nameLast.trim(),
        role: "CLIENT",
        city: nameCity || undefined,
        email: nameEmail.trim() || undefined,
        country: country === "cd" ? "RDC" : "CG",
      } as Parameters<ReturnType<typeof identityApi>["completeProfile"]>[0]);
      await refreshUser();
      router.replace("/");
    } catch (err) {
      setNameError(
        err instanceof Error ? err.message : "Une erreur est survenue. Réessaie.",
      );
      setSubmitting(false);
    }
  };

  const handleOtpChange = (i: number, raw: string) => {
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
    if (otpError) setOtpError(null);
    if (digits && i < OTP_LENGTH - 1) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) otpRefs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < OTP_LENGTH - 1) {
      otpRefs.current[i + 1]?.focus();
    }
  };

  const rolePickerStep = (
    <div>
      <div style={{ marginBottom: 24 }}>
        <LogoBadge />
      </div>
      <h1 style={headingStyle}>Que voulez-vous faire sur KAYOU ?</h1>
      <p
        className="k-body"
        style={{ color: "var(--k-text-muted)", margin: "0 0 28px", maxWidth: 380 }}
      >
        Choisissez votre rôle pour continuer. Vous pourrez le changer plus tard.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <RoleCard
          icon={<I.search size={22} />}
          title="Je cherche un pro"
          subtitle="Plombier, électricien, coiffeuse, ménage…"
          tone="primary"
          onClick={() => handleSelectRole("CLIENT")}
        />
        <RoleCard
          icon={<I.sparkles size={22} />}
          title="Je suis un pro"
          subtitle="Recevez des demandes, gérez vos missions, suivez vos gains."
          tone="accent"
          onClick={() => handleSelectRole("PROVIDER")}
        />
      </div>
      <AuthSwitchFooter mode="signup" />
    </div>
  );

  const phoneStep = (
    <div>
      <div style={{ marginBottom: 24 }}>
        <LogoBadge />
      </div>
      <h1 style={headingStyle}>
        {mode === "signup"
          ? chosenRole === "PROVIDER"
            ? "Créer votre compte pro"
            : "Créer votre compte"
          : "Bienvenue sur KAYOU"}
      </h1>
      <p
        className="k-body"
        style={{ color: "var(--k-text-muted)", margin: "0 0 28px", maxWidth: 380 }}
      >
        {mode === "signup"
          ? "Entrez votre numéro. On vous enverra un code par SMS."
          : "Entrez votre numéro pour vous connecter. On vous enverra un code par SMS."}
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
                boxShadow: active ? "0 1px 3px rgba(15,23,42,0.08)" : "none",
                fontFamily: "var(--k-font-body)",
                fontSize: 13.5,
                fontWeight: active ? 600 : 500,
                color: active ? "var(--k-text-primary)" : "var(--k-text-muted)",
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
          border: `1px solid ${phoneError ? "var(--k-danger)" : "var(--k-border)"}`,
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
          onChange={(e) => {
            setPhone(e.target.value.replace(/\D/g, "").slice(0, 9));
            if (phoneError) setPhoneError(null);
          }}
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
            letterSpacing: 0,
            color: "var(--k-text-primary)",
            background: "transparent",
          }}
        />
      </label>
      <div className="k-caption" style={{ marginTop: 8, color: "var(--k-text-muted)" }}>
        {c.hint}
      </div>

      {phoneError && <ErrorRow message={phoneError} />}

      <button
        type="button"
        disabled={!phoneValid || submitting}
        onClick={handleRequestOtp}
        className="k-btn k-btn-primary k-btn-lg"
        style={{
          width: "100%",
          marginTop: 24,
          opacity: phoneValid && !submitting ? 1 : 0.5,
          cursor: phoneValid && !submitting ? "pointer" : "not-allowed",
        }}
      >
        {submitting ? "Envoi…" : "Envoyer le code"}
        {!submitting && <I.arrowRight size={16} />}
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
        <div style={{ color: "var(--k-text-body)", fontSize: 13, lineHeight: 1.5 }}>
          KAYOU ne partage jamais votre numéro avec les pros tant que vous n&apos;avez
          pas confirmé une mission.
        </div>
      </div>

      <AuthSwitchFooter mode={mode} />

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
        onClick={() => setStep(1)}
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

      <h1 style={headingStyle}>Entrez le code à 6 chiffres</h1>
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
          onClick={() => setStep(1)}
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
          marginBottom: 16,
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
            disabled={submitting}
            style={{
              width: 52,
              height: 64,
              textAlign: "center",
              fontFamily: "var(--k-font-mono)",
              fontWeight: 600,
              fontSize: 26,
              color: "var(--k-text-primary)",
              background: "var(--k-surface)",
              border: `2px solid ${
                otpError
                  ? "var(--k-danger)"
                  : d
                    ? "var(--k-primary)"
                    : "var(--k-border)"
              }`,
              borderRadius: 12,
              outline: "none",
              transition: "border-color 160ms, transform 160ms",
              transform: d ? "scale(1.02)" : "scale(1)",
            }}
          />
        ))}
      </div>

      {otpError && <ErrorRow message={otpError} />}

      <div style={{ textAlign: "center", marginTop: 12 }}>
        <span className="k-caption" style={{ color: "var(--k-text-muted)" }}>
          Pas de SMS ?{" "}
          <button
            type="button"
            disabled={resendLeft > 0 || submitting}
            onClick={handleResend}
            style={{
              background: "transparent",
              border: 0,
              padding: 0,
              cursor: resendLeft > 0 || submitting ? "not-allowed" : "pointer",
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

  const nameStep = (
    <div>
      <h1 style={headingStyle}>Enchanté !</h1>
      <p
        className="k-body"
        style={{ color: "var(--k-text-muted)", margin: "0 0 28px", maxWidth: 420 }}
      >
        Dites-nous qui vous êtes.
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        <FormField label="Prénom" required>
          <input
            value={nameFirst}
            onChange={(e) => setNameFirst(e.target.value)}
            autoFocus
            className="k-input"
            placeholder="Paul"
            style={inputStyle}
            disabled={submitting}
          />
        </FormField>
        <FormField label="Nom" required>
          <input
            value={nameLast}
            onChange={(e) => setNameLast(e.target.value)}
            className="k-input"
            placeholder="Kabasele"
            style={inputStyle}
            disabled={submitting}
          />
        </FormField>
        <FormField label="Ville">
          <select
            value={nameCity}
            onChange={(e) => setNameCity(e.target.value)}
            style={{ ...inputStyle, appearance: "none" }}
            disabled={submitting}
          >
            {citiesForCountry.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          label="Email (optionnel)"
          hint="Pour recevoir vos reçus — vous pouvez l'ajouter plus tard."
        >
          <input
            type="email"
            value={nameEmail}
            onChange={(e) => setNameEmail(e.target.value)}
            className="k-input"
            placeholder="paul@email.cd"
            style={inputStyle}
            disabled={submitting}
          />
        </FormField>
      </div>

      {nameError && <ErrorRow message={nameError} />}

      <button
        type="button"
        disabled={
          submitting || nameFirst.trim().length < 2 || nameLast.trim().length < 2
        }
        onClick={handleSubmitName}
        className="k-btn k-btn-primary k-btn-lg"
        style={{
          width: "100%",
          marginTop: 24,
          opacity:
            submitting ||
            nameFirst.trim().length < 2 ||
            nameLast.trim().length < 2
              ? 0.5
              : 1,
        }}
      >
        {submitting ? "Enregistrement…" : "Continuer"}
        {!submitting && <I.arrowRight size={16} />}
      </button>
    </div>
  );

  const roleFallbackStep = (
    <div>
      <h1 style={headingStyle}>Presque prêt</h1>
      <p
        className="k-body"
        style={{ color: "var(--k-text-muted)", margin: "0 0 28px", maxWidth: 420 }}
      >
        Comment voulez-vous utiliser KAYOU ?
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <RoleCard
          icon={<I.search size={22} />}
          title="Je cherche un pro"
          subtitle="Plombier, électricien, coiffeuse, ménage…"
          tone="primary"
          onClick={() => handleRoleFallback("CLIENT")}
        />
        <RoleCard
          icon={<I.sparkles size={22} />}
          title="Je suis un pro"
          subtitle="Recevez des demandes, gérez vos missions, suivez vos gains."
          tone="accent"
          onClick={() => handleRoleFallback("PROVIDER")}
        />
      </div>
      {nameError && <ErrorRow message={nameError} />}
    </div>
  );

  const panel = (
    <>
      {step === 0 && rolePickerStep}
      {step === 1 && phoneStep}
      {step === 2 && otpStep}
      {step === 3 && fallbackKind === "name" && nameStep}
      {step === 3 && fallbackKind === "rolePicker" && roleFallbackStep}
      <div
        style={{
          marginTop: 32,
          paddingTop: 20,
          borderTop: "1px solid var(--k-border-subtle)",
        }}
      >
        <StepDots step={dotsStep} total={totalDots} />
      </div>
    </>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--k-bg)" }}>
      {/* Mobile ≤ 1023px */}
      <div
        className="flex flex-col lg:hidden"
        style={{
          minHeight: "100vh",
          padding: "48px 24px 32px",
          background: "var(--k-bg)",
        }}
      >
        {panel}
      </div>

      {/* Web ≥ 1024px */}
      <div
        className="hidden lg:grid"
        style={{
          gridTemplateColumns: "minmax(420px, 1fr) 1.1fr",
          minHeight: "100vh",
          alignItems: "stretch",
        }}
      >
        <div
          className="grid"
          style={{
            padding: "48px 56px",
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

// ─── helpers ─────────────────────────────────────────────────────────────────

const headingStyle: React.CSSProperties = {
  fontFamily: "var(--k-font-display)",
  fontSize: 30,
  fontWeight: 700,
  letterSpacing: 0,
  margin: "0 0 8px",
  lineHeight: 1.1,
  color: "var(--k-text-primary)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  padding: "0 14px",
  background: "var(--k-surface)",
  border: "1px solid var(--k-border)",
  borderRadius: 10,
  fontFamily: "var(--k-font-body)",
  fontSize: 14.5,
  color: "var(--k-text-primary)",
  outline: "none",
};

function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div
      style={{ display: "flex", gap: 6, justifyContent: "center" }}
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={Math.min(step + 1, total)}
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

function LogoBadge() {
  return (
    <div
      aria-hidden
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: "var(--k-surface)",
        color: "var(--k-primary)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "var(--k-e1)",
        border: "1px solid var(--k-border)",
      }}
    >
      <Image src="/kayou-logo.png" alt="" width={30} height={30} />
    </div>
  );
}

function ErrorRow({ message }: { message: string }) {
  return (
    <div
      role="alert"
      style={{
        marginTop: 12,
        padding: "10px 12px",
        borderRadius: 10,
        background: "var(--k-danger-subtle)",
        color: "var(--k-danger)",
        fontSize: 13,
        lineHeight: 1.4,
      }}
    >
      {message}
    </div>
  );
}

function FormField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span
        style={{
          fontFamily: "var(--k-font-body)",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--k-text-primary)",
        }}
      >
        {label}
        {required && (
          <span style={{ color: "var(--k-danger)", marginLeft: 4 }}>*</span>
        )}
      </span>
      {children}
      {hint && (
        <span
          className="k-caption"
          style={{ color: "var(--k-text-muted)", fontSize: 11.5 }}
        >
          {hint}
        </span>
      )}
    </label>
  );
}

function AuthSwitchFooter({ mode }: { mode: "signup" | "login" }) {
  const href = mode === "signup" ? "/auth" : "/auth?mode=signup";
  const label = mode === "signup" ? "Déjà un compte ?" : "Pas encore de compte ?";
  const action = mode === "signup" ? "Se connecter" : "S'inscrire";
  return (
    <div
      style={{
        marginTop: 24,
        textAlign: "center",
        fontSize: 13.5,
        color: "var(--k-text-muted)",
      }}
    >
      {label}{" "}
      <a
        href={href}
        style={{
          color: "var(--k-primary-hover)",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        {action}
      </a>
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
        Comptes seedés — raccourci dev en attendant le provider SMS.
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
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
        justifyContent: "center",
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
          <span className="k-overline" style={{ color: "white", opacity: 0.8 }}>
            En direct · Kinshasa
          </span>
        </div>
        <div
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 44,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: 0,
            marginBottom: 20,
            maxWidth: 440,
          }}
        >
          2 187 pros vérifiés.
          <br />
          <span style={{ opacity: 0.7 }}>Un·e à 10 minutes de chez vous.</span>
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
                <div style={{ fontSize: 11.5, opacity: 0.7, marginTop: 1 }}>
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
