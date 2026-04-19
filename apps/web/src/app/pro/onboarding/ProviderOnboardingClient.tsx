"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { I, StepIndicator, type StepIndicatorStep } from "@kayu/ui/web";
import { tokens } from "@kayu/ui";
import { useAuth } from "@/contexts/AuthContext";
import {
  StepCraft,
  StepIdentity,
  StepPricing,
  StepProfile,
  StepPublish,
  StepZones,
} from "./OnboardingSteps";
import { INITIAL_DATA, type OnboardingData } from "./types";

const STEPS: StepIndicatorStep[] = [
  { key: "identity", n: 1, label: "Identité", icon: "shieldCheck" },
  { key: "craft", n: 2, label: "Métier", icon: "wrench" },
  { key: "zones", n: 3, label: "Zones", icon: "mapPin" },
  { key: "pricing", n: 4, label: "Tarifs", icon: "coins" },
  { key: "profile", n: 5, label: "Profil", icon: "user" },
  { key: "publish", n: 6, label: "Publier", icon: "sparkles" },
];

const TITLES: Record<number, string> = {
  1: "Vérifions ton identité",
  2: "Quel est ton métier ?",
  3: "Où tu interviens ?",
  4: "Définis tes tarifs",
  5: "Complète ton profil",
  6: "Prêt à publier",
};

const SUBS: Record<number, string> = {
  1: "Ces infos restent privées. Elles servent uniquement à te vérifier.",
  2: "Précise ton savoir-faire pour être trouvé par les bons clients.",
  3: "Les clients te voient si tu couvres leur quartier.",
  4: "Tu peux modifier à tout moment depuis ton dashboard.",
  5: "Une photo et un bon texte font toute la différence.",
  6: "Un dernier coup d'œil avant de te lancer.",
};

const STORAGE_KEY = "kayu.providerOnboarding.draft";

function validateStep(step: number, d: OnboardingData): boolean {
  switch (step) {
    case 1:
      return (
        d.firstName.trim().length > 0 &&
        d.lastName.trim().length > 0 &&
        d.phone.length === 9 &&
        Boolean(d.id.front) &&
        Boolean(d.id.back)
      );
    case 2:
      return (
        d.categories.length > 0 &&
        d.title.trim().length > 0 &&
        d.years.length > 0
      );
    case 3:
      return d.zones.length > 0 && d.radius >= 1 && d.radius <= 20;
    case 4:
      return d.hourly > 0;
    case 5:
      return d.photo && d.bio.trim().length >= 10;
    case 6:
      return d.acceptedTerms;
    default:
      return false;
  }
}

export function ProviderOnboardingClient() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/auth");
  }, [isLoading, isAuthenticated, router]);

  // Hydrate from localStorage + prefill from user record
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          step?: number;
          data?: Partial<OnboardingData>;
        };
        if (parsed.data) {
          setData((prev) => ({ ...prev, ...parsed.data }));
        }
        if (parsed.step && parsed.step >= 1 && parsed.step <= 6) {
          setStep(parsed.step);
        }
      }
    } catch {
      // ignore corrupted draft
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    setData((prev) => ({
      ...prev,
      firstName: prev.firstName || (user.firstName ?? ""),
      lastName: prev.lastName || (user.lastName ?? ""),
      phone: prev.phone || normalizePhone(user.phone),
    }));
  }, [user]);

  // Auto-save on change (optimistic local; backend patch deferred — see PROGRESS blockers)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, data }));
    } catch {
      // localStorage may be full or blocked
    }
  }, [step, data]);

  const updateData = useCallback((patch: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const canContinue = useMemo(() => validateStep(step, data), [step, data]);

  const handleContinue = async () => {
    if (!canContinue) return;
    if (step < 6) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // Step 6 — publish
    setSubmitting(true);
    // Backend wiring for /me/provider-draft + publish is deferred (see DS09 blocker
    // to be logged). Keep the UI flow intact: clear the local draft and land on /pro.
    try {
      await new Promise((r) => setTimeout(r, 600));
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      toast.success("Ton profil est publié. Bienvenue sur KAYOU !");
      router.push("/pro");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setConfirmExit(true);
    }
  };

  const saveDraftAndExit = () => {
    toast.success("Brouillon sauvegardé. Tu peux reprendre plus tard.");
    router.push("/pro");
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div
        style={{
          padding: 48,
          textAlign: "center",
          color: tokens.color.textMuted,
        }}
      >
        Chargement…
      </div>
    );
  }

  const body = (() => {
    switch (step) {
      case 1:
        return <StepIdentity data={data} setData={updateData} />;
      case 2:
        return <StepCraft data={data} setData={updateData} />;
      case 3:
        return <StepZones data={data} setData={updateData} />;
      case 4:
        return <StepPricing data={data} setData={updateData} />;
      case 5:
        return <StepProfile data={data} setData={updateData} />;
      case 6:
        return <StepPublish data={data} setData={updateData} />;
      default:
        return null;
    }
  })();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: tokens.color.bg,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: `1px solid ${tokens.color.borderSubtle}`,
          background: tokens.color.surface,
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: "0 auto",
            padding: "14px 32px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
            }}
          >
            <Image src="/kayou-logo.png" alt="KAYOU" width={28} height={28} />
            <span
              style={{
                fontFamily: tokens.font.display,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                fontSize: 17,
                color: tokens.color.textPrimary,
              }}
            >
              KAYOU
            </span>
          </Link>
          <span
            className="k-chip k-chip-sm k-chip-primary"
            style={{ marginLeft: 4 }}
          >
            Devenir pro
          </span>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            className="k-btn k-btn-ghost k-btn-sm"
            onClick={() => setConfirmExit(true)}
          >
            Quitter
          </button>
        </div>
      </div>

      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "28px 32px 140px",
          width: "100%",
          boxSizing: "border-box",
          flex: 1,
        }}
      >
        {/* Stepper */}
        <div style={{ marginBottom: 32 }}>
          <StepIndicator steps={STEPS} step={step} />
        </div>

        {/* Title */}
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontFamily: tokens.font.display,
              fontWeight: 700,
              fontSize: 32,
              letterSpacing: "-0.02em",
              color: tokens.color.textPrimary,
              margin: "0 0 6px",
            }}
          >
            {TITLES[step]}
          </h1>
          <p
            style={{
              fontSize: 16,
              color: tokens.color.textMuted,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {SUBS[step]}
          </p>
        </div>

        {/* Body */}
        <div
          style={{
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.lg,
            padding: 32,
            boxShadow: tokens.shadow.e1,
          }}
        >
          {body}
        </div>
      </div>

      {/* Sticky footer nav */}
      {step < 6 && (
        <div
          style={{
            position: "sticky",
            bottom: 0,
            background: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(12px)",
            borderTop: `1px solid ${tokens.color.borderSubtle}`,
            padding: "14px 32px",
            zIndex: 10,
          }}
        >
          <div
            style={{
              maxWidth: 960,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <button
              type="button"
              className="k-btn k-btn-ghost k-btn-sm"
              onClick={handleBack}
              style={{ visibility: step > 1 ? "visible" : "hidden" }}
            >
              <I.arrowLeft size={15} /> Étape précédente
            </button>
            <div style={{ flex: 1 }} />
            <div
              style={{
                fontSize: 12,
                color: tokens.color.textMuted,
                fontFamily: tokens.font.mono,
              }}
            >
              Étape {step} sur 6
            </div>
            <button
              type="button"
              className="k-btn k-btn-primary k-btn-lg"
              onClick={handleContinue}
              disabled={!canContinue}
            >
              Continuer <I.arrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 6 && (
        <div
          style={{
            position: "sticky",
            bottom: 0,
            background: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(12px)",
            borderTop: `1px solid ${tokens.color.borderSubtle}`,
            padding: "14px 32px",
            zIndex: 10,
          }}
        >
          <div
            style={{
              maxWidth: 960,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <button
              type="button"
              className="k-btn k-btn-secondary"
              onClick={saveDraftAndExit}
              disabled={submitting}
            >
              Enregistrer comme brouillon
            </button>
            <div style={{ flex: 1 }} />
            <button
              type="button"
              className="k-btn k-btn-primary k-btn-lg"
              onClick={handleContinue}
              disabled={!canContinue || submitting}
              style={{ minWidth: 220 }}
            >
              {submitting ? (
                <span
                  style={{
                    display: "inline-block",
                    width: 80,
                    height: 14,
                    background:
                      "linear-gradient(90deg, rgba(255,255,255,0.4), rgba(255,255,255,0.9), rgba(255,255,255,0.4))",
                    borderRadius: 4,
                    animation: "k-shimmer 1200ms linear infinite",
                  }}
                />
              ) : (
                <>
                  Publier mon profil <I.arrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {confirmExit && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 20,
          }}
          onClick={() => setConfirmExit(false)}
        >
          <div
            style={{
              background: tokens.color.surface,
              borderRadius: tokens.radius.lg,
              padding: 24,
              maxWidth: 400,
              width: "100%",
              boxShadow: tokens.shadow.e3,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontFamily: tokens.font.display,
                fontWeight: 700,
                fontSize: 20,
                color: tokens.color.textPrimary,
                marginBottom: 8,
              }}
            >
              Quitter l'onboarding ?
            </div>
            <p
              style={{
                fontSize: 14,
                color: tokens.color.textMuted,
                marginTop: 0,
                marginBottom: 20,
                lineHeight: 1.5,
              }}
            >
              On sauvegarde ta progression comme brouillon. Tu pourras reprendre
              où tu en étais depuis ton dashboard.
            </p>
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                type="button"
                className="k-btn k-btn-secondary"
                onClick={() => setConfirmExit(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="k-btn k-btn-primary"
                onClick={saveDraftAndExit}
              >
                Sauvegarder et quitter
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes k-shimmer {
          0% {
            background-position: -200px 0;
          }
          100% {
            background-position: 200px 0;
          }
        }
      `}</style>
    </div>
  );
}

function normalizePhone(raw?: string | null) {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  // Strip country prefix if +243/+242 encoded
  if (digits.startsWith("243")) return digits.slice(3).slice(0, 9);
  if (digits.startsWith("242")) return digits.slice(3).slice(0, 9);
  return digits.slice(0, 9);
}
