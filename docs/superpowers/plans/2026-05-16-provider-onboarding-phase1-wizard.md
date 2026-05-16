# Provider Onboarding — Plan 2: Phase 1 Wizard (Web) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Depends on Plan 1 (Backend Foundation) being merged** — this plan consumes the trimmed `ProviderDraftDto` (3-step model) and the rebuilt `@kayu/schemas` / `@kayu/api` dist. Run `pnpm --filter @kayu/schemas build && pnpm --filter @kayu/api build` before starting.

**Goal:** Replace the 6-step provider onboarding at `/pro/onboarding` with the approved 3-step + publish wizard: identity pre-filled & confirm-only, métier→suggested titles, scaffolded skills/languages/price, Kinshasa zones, on-brand publish preview — all on the sanctioned design pattern, mobile-first, with no dead fields and no gradients.

**Architecture:** Three files under `apps/web/src/app/pro/onboarding/` change: `types.ts` (trimmed data shape + scaffolding constants), `ProviderOnboardingClient.tsx` (3-step orchestrator, trimmed backend mappers, no gradient, `?step=` handling, post-publish refresh), `OnboardingSteps.tsx` (three step components + publish). Styling follows the redesigned-dashboard convention: inline styles with `var(--k-*)` tokens + global `.k-btn/.k-input/.k-card/.k-chip` classes + `<style jsx>` `:global()` 768px breakpoints; `@kayu/ui/web` only for `I`, `StepIndicator`, `Chip`, `InlineAlert`, `Avatar`. The debounced draft autosave/resume + localStorage + confirm-exit are preserved.

**Tech Stack:** Next.js App Router, React, `@tanstack/react-query`, `@kayu/api` (`onboardingApi`, `categoriesApi`), `@kayu/ui/web`, `sonner`.

**No web test harness exists** (`apps/web` has no vitest/jest/playwright; `lint` is a no-op). Verification per task = `pnpm --filter @kayu/web type-check` + an explicit manual smoke checklist in a running dev server. This is intentional (spec §"out of scope": no web test framework in v1).

**Memory note:** No per-task commits — batch into the single commit in Task 7. Per-task "Commit" steps are written for tooling consistency; skip them in subagent execution and commit once at the end.

**Dev server for manual checks:** from repo root `pnpm --filter @kayu/web dev` (Next on :3000, backend must run on :3001 via `pnpm --filter @kayu/backend start:dev`). Sign in as a user who has NOT completed provider onboarding to reach `/pro/onboarding`.

---

### Task 1: Rewrite `types.ts` — trimmed data shape + scaffolding constants

**Files:**
- Modify (full replace): `apps/web/src/app/pro/onboarding/types.ts`

- [ ] **Step 1: Replace the entire file**

Replace the full contents of `apps/web/src/app/pro/onboarding/types.ts` with:

```ts
import type { CategorySlug } from "@kayu/ui";

export type OnboardingData = {
  // Step 1 — Toi & ton métier
  firstName: string;
  lastName: string;
  phone: string;
  categories: string[]; // backend category IDs
  subcategoryIds: string[];
  title: string;
  years: string;
  skills: string[];
  // Step 2 — Où tu interviens
  zones: string[]; // keys "City|Commune"
  // Step 3 — Ton prix de départ
  hourly: number;
  // Carried, set with sane defaults, editable later from the profile
  languages: string[];
  // Publish
  acceptedTerms: boolean;
};

export const CITIES = [
  {
    name: "Kinshasa",
    communes: [
      "Bandalungwa",
      "Barumbu",
      "Bumbu",
      "Gombe",
      "Kalamu",
      "Kasa-Vubu",
      "Kimbanseke",
      "Kinshasa",
      "Kintambo",
      "Kisenso",
      "Lemba",
      "Limete",
      "Lingwala",
      "Makala",
      "Maluku",
      "Masina",
      "Matete",
      "Mont Ngafula",
      "Ndjili",
      "Ngaba",
      "Ngaliema",
      "Ngiri-Ngiri",
      "Nsele",
      "Selembao",
    ],
  },
];

// Default languages pre-selected for the launch market (Kinshasa). Editable
// later from the profile. Congo-Brazzaville / other cities come later.
export const DEFAULT_LANGUAGES = ["Français", "Lingala"];

export const LANGUAGES = [
  "Français",
  "Lingala",
  "Swahili",
  "Kikongo",
  "Tshiluba",
  "Anglais",
];

export const YEARS_OPTIONS = [
  "< 1 an",
  "1–3 ans",
  "4–7 ans",
  "8+ ans",
] as const;

// Tap-to-pick professional titles per trade. "Autre…" unlocks a free input.
export const TITLE_SUGGESTIONS: Partial<Record<CategorySlug, string[]>> = {
  plomberie: ["Plombier", "Plombier-chauffagiste", "Plombier sanitaire"],
  electricite: ["Électricien", "Électricien bâtiment", "Installateur solaire"],
  menage: ["Agent d'entretien", "Aide-ménagère", "Nettoyage professionnel"],
  coiffure: ["Coiffeur", "Coiffeuse", "Barbier", "Coiffure à domicile"],
  informatique: [
    "Technicien informatique",
    "Dépanneur PC",
    "Installateur réseau",
  ],
  jardinage: ["Jardinier", "Paysagiste", "Élagueur"],
  peinture: ["Peintre en bâtiment", "Peintre décorateur"],
  transport: ["Chauffeur", "Déménageur", "Livreur"],
  menuiserie: ["Menuisier", "Ébéniste", "Poseur"],
};

// Static curated per-trade starting-price guidance (FC, Kinshasa). NOT live
// analytics — a helpful anchor the provider can ignore.
export const PRICE_GUIDANCE: Partial<
  Record<CategorySlug, { min: number; max: number }>
> = {
  plomberie: { min: 12000, max: 18000 },
  electricite: { min: 10000, max: 18000 },
  menage: { min: 8000, max: 15000 },
  coiffure: { min: 5000, max: 15000 },
  informatique: { min: 10000, max: 25000 },
  jardinage: { min: 8000, max: 15000 },
  peinture: { min: 12000, max: 20000 },
  transport: { min: 10000, max: 30000 },
  menuiserie: { min: 15000, max: 30000 },
};

export const HOURLY_PRESETS = [5000, 8000, 12000, 15000];

export const SKILL_SUGGESTIONS: Partial<Record<CategorySlug, string[]>> = {
  plomberie: [
    "Fuites d'eau",
    "Chauffe-eau",
    "Installation sanitaire",
    "Débouchage",
    "Canalisations",
    "Évacuations",
    "Robinetterie",
    "Salle de bain",
  ],
  electricite: [
    "Dépannage",
    "Installation tableau",
    "Éclairage LED",
    "Prises",
    "Moteurs",
    "Onduleurs",
    "Groupe électrogène",
    "Câblage",
  ],
  menage: [
    "Grand ménage",
    "Entretien régulier",
    "Lessive",
    "Vitres",
    "Désinfection",
    "Cuisine",
    "Repassage",
  ],
  coiffure: ["Coupe", "Tresses", "Couleur", "Lissage", "Extensions", "Barbier", "Mariage"],
  informatique: [
    "Dépannage PC",
    "Installation réseau",
    "Récupération de données",
    "Formatage",
    "Antivirus",
    "Impression",
    "Configuration box",
  ],
  jardinage: ["Tonte", "Élagage", "Entretien", "Plantation", "Arrosage", "Désherbage"],
  peinture: ["Intérieur", "Extérieur", "Ravalement", "Décoration", "Enduit"],
  transport: [
    "Déménagement",
    "Livraison",
    "Course",
    "Transport meubles",
    "Location utilitaire",
  ],
  menuiserie: [
    "Sur mesure",
    "Pose portes",
    "Pose fenêtres",
    "Mobilier",
    "Parquet",
    "Placard",
  ],
};
```

(Removed vs. old file: `IdUploads`, `TravelMode`, `PaymentMethod`, and the `id`/`radius`/`travelMode`/`payment`/`photo`/`bio`/`portfolio` fields. Added: `DEFAULT_LANGUAGES`, `TITLE_SUGGESTIONS`, `PRICE_GUIDANCE`, `HOURLY_PRESETS`.)

- [ ] **Step 2: Type-check (will fail until Tasks 2–5 land)**

Run: `pnpm --filter @kayu/web type-check`
Expected: FAIL — `ProviderOnboardingClient.tsx`/`OnboardingSteps.tsx` still reference removed fields. This is expected; Tasks 2–5 fix it. Do not commit yet.

---

### Task 2: Rewrite `ProviderOnboardingClient.tsx` — 3-step orchestrator

**Files:**
- Modify (full replace): `apps/web/src/app/pro/onboarding/ProviderOnboardingClient.tsx`

- [ ] **Step 1: Replace the entire file**

Replace the full contents of `apps/web/src/app/pro/onboarding/ProviderOnboardingClient.tsx` with:

```tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { I, StepIndicator, type StepIndicatorStep } from "@kayu/ui/web";
import { tokens } from "@kayu/ui";
import { categoriesApi, onboardingApi, queryKeys } from "@kayu/api";
import type { ProviderDraftDto } from "@kayu/schemas";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { StepCraft, StepPricing, StepPublish, StepZones } from "./OnboardingSteps";
import { DEFAULT_LANGUAGES, type OnboardingData } from "./types";

const STEPS: StepIndicatorStep[] = [
  { key: "craft", n: 1, label: "Toi & métier", icon: "wrench" },
  { key: "zones", n: 2, label: "Zones", icon: "mapPin" },
  { key: "pricing", n: 3, label: "Prix", icon: "coins" },
  { key: "publish", n: 4, label: "Publier", icon: "sparkles" },
];

const TITLES: Record<number, string> = {
  1: "Toi & ton métier",
  2: "Où tu interviens",
  3: "Ton prix de départ",
  4: "Voilà ton profil",
};

const SUBS: Record<number, string> = {
  1: "On a déjà tes infos. Confirme, choisis ton métier, c'est tout.",
  2: "Choisis tes communes. Les clients te trouvent là où tu travailles.",
  3: "Le prix affiché « à partir de ». Tu négocies le prix final avec le client.",
  4: "C'est ce que les clients verront. Publie — tu enrichis juste après.",
};

const STORAGE_KEY = "kayu.providerOnboarding.draft.v2";
const DEBOUNCE_MS = 600;

const EMPTY_DATA: OnboardingData = {
  firstName: "",
  lastName: "",
  phone: "",
  categories: [],
  subcategoryIds: [],
  title: "",
  years: "",
  skills: [],
  zones: [],
  hourly: 0,
  languages: DEFAULT_LANGUAGES,
  acceptedTerms: false,
};

const YEARS_TO_NUMBER: Record<string, number> = {
  "< 1 an": 0,
  "1–3 ans": 2,
  "4–7 ans": 5,
  "8+ ans": 10,
};

const NUMBER_TO_YEARS: { max: number; label: string }[] = [
  { max: 0, label: "< 1 an" },
  { max: 3, label: "1–3 ans" },
  { max: 7, label: "4–7 ans" },
  { max: Infinity, label: "8+ ans" },
];

function numberToYearsLabel(value: number | undefined): string {
  if (value === undefined || value === null) return "";
  for (const bucket of NUMBER_TO_YEARS) {
    if (value <= bucket.max) return bucket.label;
  }
  return "";
}

// Step param contract from the dashboard. Phase-1-relevant values jump to a
// step; photo/description/portfolio are Phase 2 (handled by Plan 3's module).
const STEP_PARAM_TO_STEP: Record<string, number> = {
  identity: 1,
  craft: 1,
  skills: 1,
  zones: 2,
  pricing: 3,
};

function validateStep(step: number, d: OnboardingData): boolean {
  switch (step) {
    case 1:
      return (
        d.firstName.trim().length > 0 &&
        d.lastName.trim().length > 0 &&
        d.phone.length === 9 &&
        d.categories.length > 0 &&
        d.title.trim().length > 0 &&
        d.years.length > 0
      );
    case 2:
      return d.zones.length > 0;
    case 3:
      return d.hourly > 0;
    case 4:
      return d.acceptedTerms;
    default:
      return false;
  }
}

export function ProviderOnboardingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading, isAuthenticated, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(EMPTY_DATA);
  const [hydrated, setHydrated] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [compactSteps, setCompactSteps] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => categoriesApi(apiClient).getAll({ withSubcategories: true }),
    enabled: isAuthenticated,
  });

  const draftQuery = useQuery({
    queryKey: queryKeys.onboarding.draft,
    queryFn: () => onboardingApi(apiClient).getDraft(),
    enabled: isAuthenticated,
  });

  const patchMut = useMutation({
    mutationFn: (patch: ProviderDraftDto) =>
      onboardingApi(apiClient).patchDraft(patch),
    onSuccess: () => {
      setSaveError(false);
      setLastSavedAt(new Date());
    },
    onError: () => setSaveError(true),
  });

  const publishMut = useMutation({
    mutationFn: () => onboardingApi(apiClient).publish(),
    onSuccess: async () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.provider });
      queryClient.invalidateQueries({ queryKey: queryKeys.identity.me });
      toast.success("Ton profil est publié. Bienvenue sur KAYOU !");
      router.push("/pro");
    },
    onError: (error: unknown) => {
      const missing = extractMissing(error);
      if (missing.length > 0) {
        setStep(mapFieldToStep(missing[0]));
        toast.warning(`Il manque : ${missing.join(", ")}`);
      } else {
        toast.error("Impossible de publier ton profil. Réessayer ?");
      }
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/auth");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 640px)");
    const sync = () => setCompactSteps(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          step?: number;
          data?: Partial<OnboardingData>;
        };
        if (parsed.data) setData((prev) => ({ ...prev, ...parsed.data }));
        if (parsed.step && parsed.step >= 1 && parsed.step <= 4) {
          setStep(parsed.step);
        }
      }
    } catch {
      /* ignore corrupted draft */
    }
  }, []);

  useEffect(() => {
    if (!draftQuery.data || !categoriesQuery.data || hydrated) return;
    const mapped = backendToData(
      draftQuery.data.draft,
      categoriesQuery.data.categories,
    );
    setData((prev) => mergeBackendDraft(prev, mapped));
    const serverStep = draftQuery.data.step;
    if (serverStep !== null && serverStep !== undefined) {
      setStep(Math.min(3, Math.max(1, serverStep + 1)));
    }
    setHydrated(true);
  }, [draftQuery.data, categoriesQuery.data, hydrated]);

  // Honor ?step= deep-links once hydrated.
  useEffect(() => {
    if (!hydrated) return;
    const param = searchParams.get("step");
    if (param && STEP_PARAM_TO_STEP[param]) {
      setStep(STEP_PARAM_TO_STEP[param]);
    }
  }, [hydrated, searchParams]);

  useEffect(() => {
    if (!user) return;
    setData((prev) => ({
      ...prev,
      firstName: prev.firstName || (user.firstName ?? ""),
      lastName: prev.lastName || (user.lastName ?? ""),
      phone: prev.phone || normalizePhone(user.phone),
    }));
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, data }));
    } catch {
      /* localStorage may be full or blocked */
    }
  }, [step, data]);

  const debounceRef = useRef<number | null>(null);
  const lastPayloadRef = useRef<string>("");
  useEffect(() => {
    if (!hydrated || !categoriesQuery.data) return;
    const payload = dataToBackend(data, categoriesQuery.data.categories);
    const serialized = JSON.stringify(payload);
    if (serialized === lastPayloadRef.current) return;
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      lastPayloadRef.current = serialized;
      patchMut.mutate(payload);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    };
  }, [data, hydrated, categoriesQuery.data, patchMut]);

  const updateData = useCallback((patch: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const canContinue = useMemo(() => validateStep(step, data), [step, data]);

  const saveDraftAtStep = useCallback(
    async (targetStep: number) => {
      if (!categoriesQuery.data) return;
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      const payload = {
        ...dataToBackend(data, categoriesQuery.data.categories),
        onboardingStep: Math.max(0, Math.min(2, targetStep - 1)),
      };
      lastPayloadRef.current = JSON.stringify(payload);
      await patchMut.mutateAsync(payload);
    },
    [categoriesQuery.data, data, patchMut],
  );

  const handleContinue = async () => {
    if (!canContinue) return;
    if (step < 4) {
      const next = step + 1;
      setStep(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
      try {
        await saveDraftAtStep(next);
      } catch {
        toast.error("Le brouillon n'a pas pu être sauvegardé.");
      }
      return;
    }
    try {
      await saveDraftAtStep(3);
      publishMut.mutate();
    } catch {
      toast.error("Sauvegarde impossible avant publication. Réessaie.");
    }
  };

  const handleBack = async () => {
    if (step > 1) {
      const next = step - 1;
      setStep(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
      try {
        await saveDraftAtStep(next);
      } catch {
        toast.error("Le brouillon n'a pas pu être sauvegardé.");
      }
    } else {
      setConfirmExit(true);
    }
  };

  const saveDraftAndExit = async () => {
    try {
      await saveDraftAtStep(Math.min(3, step));
      toast.success("Brouillon sauvegardé. Tu peux reprendre plus tard.");
      router.push("/pro");
    } catch {
      toast.error("Impossible de sauvegarder le brouillon. Réessaie.");
    }
  };

  if (
    authLoading ||
    !isAuthenticated ||
    draftQuery.isLoading ||
    categoriesQuery.isLoading
  ) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: tokens.color.textMuted }}>
        Chargement…
      </div>
    );
  }

  const submitting = publishMut.isPending;
  const saving = patchMut.isPending;
  const saveLabel = saveError
    ? "Sauvegarde à reprendre"
    : saving
      ? "Sauvegarde…"
      : lastSavedAt
        ? "Brouillon sauvegardé"
        : "Brouillon local";

  const body = (() => {
    switch (step) {
      case 1:
        return (
          <StepCraft
            data={data}
            setData={updateData}
            categoryOptions={categoriesQuery.data?.categories ?? []}
          />
        );
      case 2:
        return <StepZones data={data} setData={updateData} />;
      case 3:
        return (
          <StepPricing
            data={data}
            setData={updateData}
            categoryOptions={categoriesQuery.data?.categories ?? []}
          />
        );
      case 4:
        return (
          <StepPublish
            data={data}
            setData={updateData}
            categoryOptions={categoriesQuery.data?.categories ?? []}
          />
        );
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
      <div
        style={{
          borderBottom: `1px solid ${tokens.color.borderSubtle}`,
          background: tokens.color.surface,
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <Link
            href="/"
            style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
          >
            <Image src="/kayou-logo.png" alt="KAYOU" width={28} height={28} />
            <span
              style={{
                fontFamily: tokens.font.display,
                fontWeight: 700,
                fontSize: 17,
                color: tokens.color.textPrimary,
              }}
            >
              KAYOU
            </span>
          </Link>
          <span className="k-chip k-chip-sm k-chip-primary" style={{ marginLeft: 4 }}>
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
          maxWidth: 760,
          margin: "0 auto",
          padding: "24px 16px 148px",
          width: "100%",
          boxSizing: "border-box",
          flex: 1,
        }}
        className="k-ob-page"
      >
        <div style={{ marginBottom: 24 }}>
          <StepIndicator steps={STEPS} step={step} compact={compactSteps} />
        </div>

        <div
          style={{
            marginBottom: 20,
            display: "flex",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "space-between",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: tokens.font.display,
                fontWeight: 700,
                fontSize: "clamp(22px, 4vw, 32px)",
                letterSpacing: "-0.02em",
                color: tokens.color.textPrimary,
                margin: "0 0 4px",
                lineHeight: 1.1,
              }}
            >
              {TITLES[step]}
            </h1>
            <p style={{ fontSize: 14, color: tokens.color.textMuted, margin: 0, lineHeight: 1.5 }}>
              {SUBS[step]}
            </p>
          </div>
          <div
            className="k-chip k-chip-sm"
            style={{
              whiteSpace: "nowrap",
              color: saveError ? tokens.color.danger : tokens.color.textMuted,
              background: saveError ? tokens.color.dangerSubtle : tokens.color.surfaceMuted,
            }}
          >
            {saveLabel}
          </div>
        </div>

        <div
          style={{
            background: tokens.color.surface,
            borderRadius: tokens.radius.lg,
            padding: "clamp(16px, 4vw, 24px)",
            boxShadow: tokens.shadow.e2,
          }}
        >
          {body}
        </div>
      </div>

      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(12px)",
          borderTop: `1px solid ${tokens.color.borderSubtle}`,
          padding: "12px 16px",
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 760,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {step === 4 ? (
            <button
              type="button"
              className="k-btn k-btn-secondary"
              onClick={saveDraftAndExit}
              disabled={submitting || saving}
            >
              Enregistrer comme brouillon
            </button>
          ) : (
            <button
              type="button"
              className="k-btn k-btn-ghost k-btn-sm"
              onClick={handleBack}
              style={{ visibility: step > 1 ? "visible" : "hidden" }}
            >
              <I.arrowLeft size={15} /> Retour
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < 4 && (
            <div
              style={{
                fontSize: 12,
                color: tokens.color.textMuted,
                fontFamily: tokens.font.mono,
              }}
            >
              Étape {step} / 3
            </div>
          )}
          <button
            type="button"
            className="k-btn k-btn-primary k-btn-lg"
            onClick={handleContinue}
            disabled={!canContinue || saving || submitting}
            style={step === 4 ? { minWidth: 200 } : undefined}
          >
            {step === 4 ? (
              submitting ? (
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
              )
            ) : (
              <>
                {step === 3 ? "Voir mon profil" : "Continuer"} <I.arrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>

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
              Ta progression est sauvegardée. Tu peux reprendre où tu en étais
              depuis ton dashboard, même sur un autre appareil.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
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
                disabled={saving}
              >
                Quitter
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
  if (digits.startsWith("243")) return digits.slice(3).slice(0, 9);
  return digits.slice(0, 9);
}

type CategoryIndex = {
  id: string;
  slug: string;
  name: string;
  subcategories?: Array<{ id: string; name: string; slug?: string; categoryId?: string }>;
}[];

const CATEGORY_TOKEN_KEYWORDS: Array<[string, string[]]> = [
  ["plomberie", ["plomb", "sanitaire", "chauffe", "canalisation", "eau"]],
  ["electricite", ["elect", "energie", "snel", "tableau"]],
  ["menage", ["menage", "nettoyage", "entretien"]],
  ["coiffure", ["coiff", "beaute", "barbier"]],
  ["informatique", ["inform", "ordinateur", "reseau", "tech", "it"]],
  ["jardinage", ["jardin", "vert"]],
  ["peinture", ["peint"]],
  ["transport", ["transport", "livraison", "demenagement", "course"]],
  ["menuiserie", ["menuis", "bois", "charp"]],
];

function normalizeCategoryText(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function categoryToken(category: CategoryIndex[number]): string | null {
  const normalized = normalizeCategoryText(
    `${category.slug} ${category.name} ${(category.subcategories ?? [])
      .map((s) => s.name)
      .join(" ")}`,
  );
  return (
    CATEGORY_TOKEN_KEYWORDS.find(([, keywords]) =>
      keywords.some((keyword) => normalized.includes(keyword)),
    )?.[0] ?? null
  );
}

function resolveCategoryIds(values: Array<string | undefined>, categories: CategoryIndex) {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const value of values) {
    if (!value) continue;
    const match =
      categories.find((c) => c.id === value) ??
      categories.find((c) => c.slug === value) ??
      categories.find((c) => c.slug.startsWith(`${value}-`)) ??
      categories.find((c) =>
        (c.subcategories ?? []).some(
          (s) =>
            s.id === value ||
            s.slug === value ||
            s.name === value ||
            s.name.toLowerCase() === value.toLowerCase(),
        ),
      ) ??
      categories.find((c) => categoryToken(c) === value);
    if (match && !seen.has(match.id)) {
      ids.push(match.id);
      seen.add(match.id);
    }
  }
  return ids.slice(0, 3);
}

function backendToData(
  draft: ProviderDraftDto,
  categories: CategoryIndex,
): Partial<OnboardingData> {
  const draftCategoryIds =
    draft.categoryIds && draft.categoryIds.length > 0
      ? draft.categoryIds
      : [draft.primaryCategoryId];
  const selectedCategoryIds = resolveCategoryIds(draftCategoryIds, categories);
  return {
    firstName: draft.firstName ?? "",
    lastName: draft.lastName ?? "",
    phone: normalizePhone(draft.phone),
    categories: selectedCategoryIds,
    subcategoryIds: draft.subcategoryIds ?? [],
    title: draft.profession ?? "",
    years: numberToYearsLabel(draft.yearsOfExperience),
    skills: (draft.skills ?? []).map((s) => s.name),
    zones: (draft.serviceZones ?? []).map(
      (z) => `${z.city}|${z.commune ?? ""}`,
    ),
    hourly: draft.hourlyRate ?? 0,
    languages:
      draft.languages && draft.languages.length > 0
        ? draft.languages
        : DEFAULT_LANGUAGES,
  };
}

function mergeBackendDraft(
  prev: OnboardingData,
  mapped: Partial<OnboardingData>,
): OnboardingData {
  return {
    ...prev,
    ...mapped,
    firstName: mapped.firstName || prev.firstName,
    lastName: mapped.lastName || prev.lastName,
    phone: mapped.phone || prev.phone,
    categories:
      mapped.categories && mapped.categories.length > 0
        ? mapped.categories
        : prev.categories,
    title: mapped.title || prev.title,
    years: mapped.years || prev.years,
    skills: mapped.skills && mapped.skills.length > 0 ? mapped.skills : prev.skills,
    subcategoryIds:
      mapped.subcategoryIds && mapped.subcategoryIds.length > 0
        ? mapped.subcategoryIds
        : prev.subcategoryIds,
    zones: mapped.zones && mapped.zones.length > 0 ? mapped.zones : prev.zones,
    hourly: mapped.hourly && mapped.hourly > 0 ? mapped.hourly : prev.hourly,
    languages:
      mapped.languages && mapped.languages.length > 0
        ? mapped.languages
        : prev.languages,
    acceptedTerms: prev.acceptedTerms,
  };
}

function dataToBackend(
  data: OnboardingData,
  categories: CategoryIndex,
): ProviderDraftDto {
  const categoryIds = resolveCategoryIds(data.categories, categories);
  const primaryId = categoryIds[0];
  const zones = data.zones
    .map((key) => {
      const [city, commune] = key.split("|");
      if (!city) return null;
      return { city, commune: commune || null };
    })
    .filter((z): z is { city: string; commune: string | null } => Boolean(z));

  return {
    firstName: data.firstName || undefined,
    lastName: data.lastName || undefined,
    phone: data.phone ? `+243${data.phone}` : undefined,
    primaryCategoryId: primaryId ?? undefined,
    categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
    subcategoryIds: data.subcategoryIds.length > 0 ? data.subcategoryIds : undefined,
    profession: data.title || undefined,
    skills: data.skills.map((name) => ({ name, level: 3 })),
    yearsOfExperience: data.years ? YEARS_TO_NUMBER[data.years] : undefined,
    serviceZones: zones,
    hourlyRate: data.hourly > 0 ? data.hourly : undefined,
    languages: data.languages,
  };
}

function extractMissing(error: unknown): string[] {
  if (!error || typeof error !== "object") return [];
  const maybe = error as {
    body?: { missing?: unknown };
    response?: { missing?: unknown };
  };
  const bodyMissing = maybe.body?.missing ?? maybe.response?.missing;
  if (Array.isArray(bodyMissing)) {
    return bodyMissing.filter((m): m is string => typeof m === "string");
  }
  return [];
}

function mapFieldToStep(field: string): number {
  switch (field) {
    case "firstName":
    case "lastName":
    case "phone":
    case "profession":
    case "primaryCategoryId":
    case "yearsOfExperience":
      return 1;
    case "serviceZones":
      return 2;
    case "hourlyRate":
      return 3;
    default:
      return 4;
  }
}
```

Key changes vs. old orchestrator: 3 steps + publish (step 4); identity folded into step 1 (StepCraft); gradient background removed (`background: tokens.color.bg`); card border removed (shadow only, design rule); `?step=` deep-link handling; `refreshUser()` + dashboard/identity query invalidation after publish; `onboardingStep` clamped to `0..2`; removed `StepIdentity`/`StepProfile` imports; `useSearchParams`/`useQueryClient` added.

- [ ] **Step 2: Type-check (still failing until Task 3)**

Run: `pnpm --filter @kayu/web type-check`
Expected: FAIL — `./OnboardingSteps` no longer exports `StepIdentity`/`StepProfile` and `StepCraft`/`StepZones`/`StepPricing`/`StepPublish` have new shapes. Fixed in Task 3.

---

### Task 3: Rewrite `OnboardingSteps.tsx` — Step 1 (Toi & ton métier)

**Files:**
- Modify (full replace): `apps/web/src/app/pro/onboarding/OnboardingSteps.tsx`

This single file holds all four step components. Replace it entirely (Steps 2/3/Publish are in this same task to keep the file compiling — they're all here).

- [ ] **Step 1: Replace the entire file**

Replace the full contents of `apps/web/src/app/pro/onboarding/OnboardingSteps.tsx` with:

```tsx
"use client";

import { useState } from "react";
import { I } from "@kayu/ui/web";
import { tokens, type CategorySlug } from "@kayu/ui";
import {
  CITIES,
  HOURLY_PRESETS,
  LANGUAGES,
  PRICE_GUIDANCE,
  SKILL_SUGGESTIONS,
  TITLE_SUGGESTIONS,
  YEARS_OPTIONS,
  type OnboardingData,
} from "./types";

type CategoryOption = {
  id: string;
  slug: string;
  name: string;
  subcategories?: Array<{ id: string; name: string; slug?: string; categoryId?: string }>;
};

type StepProps = {
  data: OnboardingData;
  setData: (next: Partial<OnboardingData>) => void;
  categoryOptions?: CategoryOption[];
};

const CATEGORY_SLUGS: CategorySlug[] = [
  "plomberie",
  "electricite",
  "menage",
  "coiffure",
  "informatique",
  "jardinage",
  "peinture",
  "transport",
  "menuiserie",
];

const CATEGORY_KEYWORDS: Array<[CategorySlug, string[]]> = [
  ["plomberie", ["plomb", "sanitaire", "chauffe", "canalisation", "eau"]],
  ["electricite", ["elect", "energie", "snel", "tableau"]],
  ["menage", ["menage", "nettoyage", "entretien"]],
  ["coiffure", ["coiff", "beaute", "barbier"]],
  ["informatique", ["inform", "ordinateur", "reseau", "tech", "it"]],
  ["jardinage", ["jardin", "vert"]],
  ["peinture", ["peint"]],
  ["transport", ["transport", "livraison", "demenagement", "course"]],
  ["menuiserie", ["menuis", "bois", "charp"]],
];

function normalizeCategoryText(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function isCategorySlug(value: string): value is CategorySlug {
  return CATEGORY_SLUGS.includes(value as CategorySlug);
}

function categoryToTokenSlug(category: CategoryOption): CategorySlug {
  if (isCategorySlug(category.slug)) return category.slug;
  const normalized = normalizeCategoryText(
    `${category.slug} ${category.name} ${(category.subcategories ?? [])
      .map((s) => `${s.id} ${s.name}`)
      .join(" ")}`,
  );
  return (
    CATEGORY_KEYWORDS.find(([, keywords]) =>
      keywords.some((keyword) => normalized.includes(keyword)),
    )?.[0] ?? "informatique"
  );
}

function categoryVisual(category: CategoryOption) {
  return tokens.portfolio[categoryToTokenSlug(category)];
}

function resolveCategoryIds(values: string[], categories: CategoryOption[]) {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const value of values) {
    const match =
      categories.find((c) => c.id === value) ??
      categories.find((c) => c.slug === value) ??
      categories.find((c) =>
        (c.subcategories ?? []).some(
          (s) =>
            s.id === value ||
            s.slug === value ||
            s.name.toLowerCase() === value.toLowerCase(),
        ),
      ) ??
      categories.find((c) => categoryToTokenSlug(c) === value);
    if (match && !seen.has(match.id)) {
      ids.push(match.id);
      seen.add(match.id);
    }
  }
  return ids.slice(0, 3);
}

function FieldLabel({
  label,
  hint,
  optional,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <label
        style={{
          fontFamily: tokens.font.display,
          fontWeight: 600,
          fontSize: 14,
          color: tokens.color.textPrimary,
        }}
      >
        {label}{" "}
        {optional && (
          <span style={{ fontWeight: 400, fontSize: 12, color: tokens.color.textMuted }}>
            (optionnel)
          </span>
        )}
      </label>
      {hint && (
        <div
          style={{
            fontSize: 12,
            color: tokens.color.textMuted,
            marginTop: 4,
            lineHeight: 1.45,
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

function pillStyle(selected: boolean): React.CSSProperties {
  return {
    padding: "8px 13px",
    borderRadius: 999,
    border: selected
      ? `1px solid ${tokens.color.primary}`
      : `1px solid ${tokens.color.border}`,
    background: selected ? tokens.color.primarySubtle : tokens.color.surface,
    color: selected ? tokens.color.primaryHover : tokens.color.textBody,
    fontSize: 13,
    fontWeight: selected ? 700 : 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  };
}

// ─── Step 1 — Toi & ton métier ────────────────────────────────────────────

export function StepCraft({ data, setData, categoryOptions = [] }: StepProps) {
  const [titleOther, setTitleOther] = useState(false);
  const selectedCategoryIds = resolveCategoryIds(data.categories, categoryOptions);
  const selectedSet = new Set(selectedCategoryIds);
  const limitReached = selectedCategoryIds.length >= 3;

  const titleSuggestions = Array.from(
    new Set(
      selectedCategoryIds.flatMap((id) => {
        const c = categoryOptions.find((o) => o.id === id);
        return c ? (TITLE_SUGGESTIONS[categoryToTokenSlug(c)] ?? []) : [];
      }),
    ),
  );
  const skillSuggestions = Array.from(
    new Set(
      selectedCategoryIds.flatMap((id) => {
        const c = categoryOptions.find((o) => o.id === id);
        return c ? (SKILL_SUGGESTIONS[categoryToTokenSlug(c)] ?? []) : [];
      }),
    ),
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 12,
          borderRadius: tokens.radius.md,
          background: tokens.color.surfaceMuted,
          border: `1px solid ${tokens.color.border}`,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "#F5F2E9",
            color: tokens.color.textMuted,
            fontFamily: tokens.font.mono,
            fontWeight: 700,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {(data.firstName?.[0] || "").toUpperCase()}
          {(data.lastName?.[0] || "").toUpperCase() || "?"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: tokens.color.textPrimary }}>
            {data.firstName || data.lastName
              ? `${data.firstName} ${data.lastName}`.trim()
              : "Tes informations"}
          </div>
          <div style={{ fontSize: 12, color: tokens.color.textMuted }}>
            {data.phone ? `+243 ${data.phone}` : "Confirme ton identité ci-dessous"}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="k-ob-id">
        <div>
          <FieldLabel label="Prénom" />
          <input
            className="k-input"
            value={data.firstName}
            onChange={(e) => setData({ firstName: e.target.value })}
            placeholder="Jean"
          />
        </div>
        <div>
          <FieldLabel label="Nom" />
          <input
            className="k-input"
            value={data.lastName}
            onChange={(e) => setData({ lastName: e.target.value })}
            placeholder="Mubake"
          />
        </div>
      </div>

      <div>
        <FieldLabel
          label="Numéro de téléphone"
          hint="Utilisé pour les missions et la vérification par SMS."
        />
        <div style={{ display: "flex", gap: 8 }}>
          <div
            className="k-input"
            style={{
              width: 80,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: tokens.font.mono,
              fontWeight: 600,
            }}
          >
            +243
          </div>
          <input
            className="k-input"
            value={data.phone}
            onChange={(e) =>
              setData({ phone: e.target.value.replace(/\D/g, "").slice(0, 9) })
            }
            placeholder="81 234 5678"
            style={{ flex: 1, fontFamily: tokens.font.mono }}
            inputMode="numeric"
          />
        </div>
      </div>

      <div>
        <FieldLabel
          label="Ton métier"
          hint={`${selectedCategoryIds.length}/3 — choisis jusqu'à trois métiers.`}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {categoryOptions.map((category) => {
            const isSel = selectedSet.has(category.id);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  if (isSel) {
                    const removed = new Set(
                      category.subcategories?.map((s) => s.id) ?? [],
                    );
                    setData({
                      categories: selectedCategoryIds.filter((id) => id !== category.id),
                      subcategoryIds: data.subcategoryIds.filter(
                        (id) => !removed.has(id),
                      ),
                    });
                    return;
                  }
                  if (limitReached) return;
                  setData({ categories: [...selectedCategoryIds, category.id] });
                }}
                style={{
                  ...pillStyle(isSel),
                  cursor: !isSel && limitReached ? "not-allowed" : "pointer",
                  opacity: !isSel && limitReached ? 0.5 : 1,
                }}
              >
                {isSel && <I.check size={13} />}
                {category.name}
              </button>
            );
          })}
        </div>
      </div>

      {selectedCategoryIds.length > 0 && (
        <div>
          <FieldLabel
            label="Comment tu te présentes"
            hint="Choisis un intitulé, ou écris le tien."
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {titleSuggestions.map((t) => {
              const isSel = !titleOther && data.title === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTitleOther(false);
                    setData({ title: t });
                  }}
                  style={pillStyle(isSel)}
                >
                  {isSel && <I.check size={13} />}
                  {t}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setTitleOther(true);
                setData({ title: "" });
              }}
              style={pillStyle(titleOther)}
            >
              Autre…
            </button>
          </div>
          {titleOther && (
            <input
              className="k-input"
              value={data.title}
              onChange={(e) => setData({ title: e.target.value })}
              placeholder="Ton intitulé d'activité"
              style={{ marginTop: 10 }}
              autoFocus
            />
          )}
        </div>
      )}

      <div>
        <FieldLabel label="Années d'expérience" />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {YEARS_OPTIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setData({ years: r })}
              style={pillStyle(data.years === r)}
            >
              {data.years === r && <I.check size={13} />}
              {r}
            </button>
          ))}
        </div>
      </div>

      {selectedCategoryIds.length > 0 && skillSuggestions.length > 0 && (
        <div>
          <FieldLabel
            label="Compétences"
            optional
            hint="Les clients filtrent par compétence. Ajoute ce qui te correspond."
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {skillSuggestions.map((s) => {
              const isSel = data.skills.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() =>
                    setData({
                      skills: isSel
                        ? data.skills.filter((x) => x !== s)
                        : [...data.skills, s],
                    })
                  }
                  style={
                    isSel
                      ? {
                          ...pillStyle(true),
                          background: tokens.color.textPrimary,
                          color: tokens.color.textInverse,
                          border: `1px solid ${tokens.color.textPrimary}`,
                        }
                      : pillStyle(false)
                  }
                >
                  {isSel && <I.check size={12} />}
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 520px) {
          :global(.k-ob-id) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Step 2 — Où tu interviens ────────────────────────────────────────────

export function StepZones({ data, setData }: StepProps) {
  const toggleCommune = (city: string, commune: string) => {
    const key = `${city}|${commune}`;
    setData({
      zones: data.zones.includes(key)
        ? data.zones.filter((x) => x !== key)
        : [...data.zones, key],
    });
  };
  const selectedCities = new Set(data.zones.map((z) => z.split("|")[0]));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <FieldLabel
          label="Communes desservies"
          hint="Choisis au moins une commune. Plus de communes = plus de demandes."
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {CITIES.map((city) => (
            <div
              key={city.name}
              style={{
                padding: 14,
                borderRadius: tokens.radius.md,
                border: `1px solid ${tokens.color.border}`,
                background: selectedCities.has(city.name)
                  ? tokens.color.primarySubtle
                  : tokens.color.surface,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <I.mapPin size={15} strokeColor={tokens.color.primaryHover} />
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: tokens.color.textPrimary,
                  }}
                >
                  {city.name}
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {city.communes.map((c) => {
                  const isSel = data.zones.includes(`${city.name}|${c}`);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCommune(city.name, c)}
                      style={
                        isSel
                          ? {
                              ...pillStyle(true),
                              background: tokens.color.primary,
                              color: tokens.color.textInverse,
                            }
                          : pillStyle(false)
                      }
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          padding: 14,
          borderRadius: tokens.radius.md,
          background: tokens.color.surfaceMuted,
          border: `1px solid ${tokens.color.borderSubtle}`,
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <I.info size={15} strokeColor={tokens.color.textMuted} />
        <div style={{ fontSize: 12.5, color: tokens.color.textBody, lineHeight: 1.5 }}>
          Tu apparais dans les résultats quand un client cherche dans une de tes
          communes sélectionnées.
        </div>
      </div>
    </div>
  );
}

// ─── Step 3 — Ton prix de départ ──────────────────────────────────────────

function pickGuidance(
  data: OnboardingData,
  categoryOptions: CategoryOption[],
): { min: number; max: number } | null {
  const ids = resolveCategoryIds(data.categories, categoryOptions);
  for (const id of ids) {
    const c = categoryOptions.find((o) => o.id === id);
    if (!c) continue;
    const g = PRICE_GUIDANCE[categoryToTokenSlug(c)];
    if (g) return g;
  }
  return null;
}

export function StepPricing({ data, setData, categoryOptions = [] }: StepProps) {
  const guidance = pickGuidance(data, categoryOptions);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {guidance && (
        <div
          style={{
            padding: 14,
            borderRadius: tokens.radius.md,
            background: tokens.color.surfaceAmber,
            border: "1px solid #FDE68A",
            fontSize: 13,
            color: "#78350F",
            lineHeight: 1.5,
          }}
        >
          À titre indicatif à Kinshasa :{" "}
          <span style={{ fontFamily: tokens.font.mono, fontWeight: 700 }}>
            {guidance.min.toLocaleString("fr-FR")} – {guidance.max.toLocaleString("fr-FR")} FC
          </span>{" "}
          par intervention. Ajustable à tout moment.
        </div>
      )}

      <div>
        <FieldLabel
          label="Prix de départ"
          hint="Affiché sur ton profil sous la forme « À partir de … FC ». Le prix final est convenu avec le client avant l'intervention."
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {HOURLY_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setData({ hourly: p })}
              style={{
                ...pillStyle(data.hourly === p),
                fontFamily: tokens.font.mono,
                fontWeight: 600,
              }}
            >
              {p.toLocaleString("fr-FR")} FC
            </button>
          ))}
        </div>
        <div style={{ position: "relative" }}>
          <input
            className="k-input"
            type="number"
            value={data.hourly || ""}
            onChange={(e) => setData({ hourly: Math.max(0, +e.target.value) })}
            placeholder="8000"
            style={{
              paddingRight: 56,
              fontFamily: tokens.font.mono,
              fontWeight: 600,
              fontSize: 18,
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: tokens.color.textMuted,
              fontFamily: tokens.font.mono,
              fontWeight: 600,
              fontSize: 14,
              pointerEvents: "none",
            }}
          >
            FC
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 4 — Publish preview ─────────────────────────────────────────────

export function StepPublish({ data, setData, categoryOptions = [] }: StepProps) {
  const primaryId = resolveCategoryIds(data.categories, categoryOptions)[0];
  const primaryCategory = categoryOptions.find((c) => c.id === primaryId);
  const profession =
    data.title || (primaryCategory ? primaryCategory.name : "Prestataire");
  const hourly = data.hourly || 0;
  const zoneCommunes = data.zones
    .map((z) => z.split("|")[1])
    .filter(Boolean);
  const initials =
    `${(data.firstName?.[0] || "").toUpperCase()}${(data.lastName?.[0] || "").toUpperCase()}` ||
    "?";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: tokens.color.primaryHover,
        }}
      >
        Aperçu public
      </div>

      <div
        style={{
          background: tokens.color.surface,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.lg,
          padding: 16,
          boxShadow: tokens.shadow.e1,
        }}
      >
        <div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: "50%",
              background: "#F5F2E9",
              color: tokens.color.textMuted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: tokens.font.mono,
              fontWeight: 700,
              fontSize: 19,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: tokens.font.display,
                fontWeight: 700,
                fontSize: 17,
                color: tokens.color.textPrimary,
              }}
            >
              {data.firstName || "—"} {data.lastName || ""}
            </div>
            <div style={{ fontSize: 13, color: tokens.color.textMuted, marginTop: 1 }}>
              {profession} · Kinshasa
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9 }}>
              <span className="k-chip k-chip-sm k-chip-primary">
                <I.sparkles size={12} /> Nouveau
              </span>
              {data.years && <span className="k-chip k-chip-sm">{data.years}</span>}
              {zoneCommunes.length > 0 && (
                <span className="k-chip k-chip-sm">
                  <I.mapPin size={12} />{" "}
                  {zoneCommunes.slice(0, 2).join(", ")}
                  {zoneCommunes.length > 2 ? ` +${zoneCommunes.length - 2}` : ""}
                </span>
              )}
              {data.languages.length > 0 && (
                <span className="k-chip k-chip-sm">{data.languages.join(", ")}</span>
              )}
            </div>
            <div
              style={{
                paddingTop: 12,
                marginTop: 12,
                borderTop: `1px solid ${tokens.color.borderSubtle}`,
              }}
            >
              <span style={{ color: tokens.color.textMuted, fontSize: 13 }}>
                À partir de{" "}
              </span>
              <span
                style={{
                  fontFamily: tokens.font.mono,
                  fontSize: 18,
                  fontWeight: 700,
                  color: tokens.color.textPrimary,
                }}
              >
                {hourly.toLocaleString("fr-FR")} FC
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: 16,
          borderRadius: tokens.radius.md,
          background: tokens.color.surface,
          border: `1px solid ${tokens.color.border}`,
        }}
      >
        <div
          style={{
            fontFamily: tokens.font.display,
            fontWeight: 600,
            fontSize: 14,
            marginBottom: 12,
          }}
        >
          Juste après la publication
        </div>
        {[
          { icon: "camera" as const, label: "Ajoute ta photo et ton portfolio — c'est ce qui déclenche les demandes" },
          { icon: "shieldCheck" as const, label: "Fais-toi vérifier sous 24h pour le badge « Vérifié »" },
          { icon: "sparkles" as const, label: "Badge « Nouveau » pendant 30 jours pour te lancer" },
        ].map((n, i) => {
          const IconC = I[n.icon];
          return (
            <div
              key={n.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "7px 0",
                color: tokens.color.textBody,
                fontSize: 13,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: tokens.color.surfacePrimary,
                  color: tokens.color.primaryHover,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontFamily: tokens.font.mono,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </div>
              <IconC size={15} strokeColor={tokens.color.textMuted} />
              {n.label}
            </div>
          );
        })}
      </div>

      <label
        style={{
          display: "flex",
          gap: 10,
          padding: 14,
          borderRadius: tokens.radius.md,
          border: `1px solid ${tokens.color.border}`,
          cursor: "pointer",
          fontSize: 13.5,
          color: tokens.color.textBody,
          lineHeight: 1.45,
        }}
      >
        <input
          type="checkbox"
          checked={data.acceptedTerms}
          onChange={(e) => setData({ acceptedTerms: e.target.checked })}
          style={{ marginTop: 2, accentColor: tokens.color.primary }}
        />
        J'accepte les{" "}
        <a
          style={{
            color: tokens.color.primaryHover,
            fontWeight: 600,
            textDecoration: "underline",
          }}
          href="#"
          onClick={(e) => e.preventDefault()}
        >
          conditions d'utilisation pro
        </a>{" "}
        et le code de conduite KAYOU.
      </label>

      {LANGUAGES.length > 0 && (
        <div>
          <FieldLabel
            label="Langues parlées"
            optional
            hint="Pré-rempli pour Kinshasa. Ajuste si besoin."
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {LANGUAGES.map((l) => {
              const isSel = data.languages.includes(l);
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() =>
                    setData({
                      languages: isSel
                        ? data.languages.filter((x) => x !== l)
                        : [...data.languages, l],
                    })
                  }
                  style={
                    isSel
                      ? {
                          ...pillStyle(true),
                          background: tokens.color.textPrimary,
                          color: tokens.color.textInverse,
                          border: `1px solid ${tokens.color.textPrimary}`,
                        }
                      : pillStyle(false)
                  }
                >
                  {isSel && <I.check size={12} />}
                  {l}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm --filter @kayu/web type-check`
Expected: PASS — all three onboarding files compile against the trimmed `ProviderDraftDto` (Plan 1 must be merged + `@kayu/schemas` rebuilt).

> If `tokens.color.surfaceAmber` is not a valid token, replace it with `tokens.color.warningSubtle`; if `tokens.color.bg` is missing, use `"var(--k-bg)"`. The redesigned dashboard uses `var(--k-*)` CSS vars freely — substituting any missing `tokens.color.*` with its `var(--k-*)` equivalent (per the token table in the spec) is acceptable and the type-check will tell you which.

---

### Task 4: Manual smoke — Phase 1 happy path

**Files:** none (verification gate)

- [ ] **Step 1: Start backend + web**

Terminal A (from repo root): `pnpm --filter @kayu/backend start:dev`
Terminal B (from repo root): `pnpm --filter @kayu/web dev`
Open `http://localhost:3000`, sign in as a user who has NOT published a provider profile, navigate to `/pro/onboarding`.

- [ ] **Step 2: Walk the full flow (desktop)**

Verify in order:
1. Header shows logo + "Devenir pro" + "Quitter". **No gradient anywhere** — flat sand background.
2. Stepper shows 4 nodes: Toi & métier / Zones / Prix / Publier. Step 1 active.
3. Step 1: name/phone prefilled from the account (confirm row + editable fields). Pick a métier chip → title-suggestion chips appear; pick one. Pick an experience band. Skill chips appear; pick a couple. "Continuer" enables only when name+phone(9 digits)+métier+title+years are set.
4. Step 2: Kinshasa communes; no radius slider. Select ≥1 commune → "Continuer" enables.
5. Step 3: price guidance band reflects the chosen trade range; pick a preset or type a value → CTA reads "Voir mon profil".
6. Step 4: public preview card with **initials on beige (no gradient disc)**, correct name/profession/price/zones/languages; "Juste après la publication" list; terms checkbox; languages editable. "Publier mon profil" enabled only after terms checked.
7. The "Brouillon sauvegardé" chip updates as you change fields (debounced autosave).

- [ ] **Step 3: Verify resume + deep-link**

1. Reload mid-flow (e.g. on Step 2) → it resumes at the same step with data intact (localStorage + server draft).
2. Visit `/pro/onboarding?step=zones` → opens on Step 2. `?step=pricing` → Step 3.

- [ ] **Step 4: Publish**

Click "Publier mon profil". Expected: success toast "Ton profil est publié…", redirect to `/pro`, and the dashboard reflects the published provider (role now PROVIDER). If the backend returns a missing-field error, the wizard jumps to the right step with a warning toast — verify by intentionally clearing the price then publishing.

- [ ] **Step 5: Mobile viewport**

In dev tools, set viewport to 390px wide. Verify: single-column identity fields, compact dot stepper, full-width sticky primary at the bottom, comfortable tap targets, no horizontal scroll.

---

### Task 5: Mobile-first polish + responsive breakpoints

**Files:**
- Modify: `apps/web/src/app/pro/onboarding/ProviderOnboardingClient.tsx` (only if Task 4 Step 5 found issues)

- [ ] **Step 1: Add a desktop max-width bump if the card feels cramped on wide screens**

If, in Task 4, the content column felt too narrow/wide, add to the existing `<style jsx>` block in `ProviderOnboardingClient.tsx` (inside the `@keyframes` style tag — add a sibling rule):

```tsx
      <style jsx>{`
        @keyframes k-shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: 200px 0; }
        }
        @media (min-width: 768px) {
          :global(.k-ob-page) {
            padding: 32px 24px 160px !important;
          }
        }
      `}</style>
```

If Task 4 found no issues, skip this task (it is conditional polish, not required).

- [ ] **Step 2: Re-run the mobile + desktop smoke from Task 4 Step 2 & 5**

Expected: layout reads well at 390px and ≥1024px; no horizontal scroll; one primary action visible at all times.

---

### Task 6: Type-check + final verification gate

**Files:** none

- [ ] **Step 1: Web type-check**

Run: `pnpm --filter @kayu/web type-check`
Expected: PASS — zero errors.

- [ ] **Step 2: Grep for removed concepts**

Run: `grep -rnE "radius|travelMode|payment|idFront|idBack|StepIdentity|StepProfile|zoneRadiusKm" apps/web/src/app/pro/onboarding/`
Expected: no matches (the old fields/components are fully gone).

- [ ] **Step 3: Confirm no gradient on the onboarding surface**

Run: `grep -rn "linear-gradient" apps/web/src/app/pro/onboarding/`
Expected: only the `k-shimmer` keyframes background (the publish-button loading shimmer) — no page/avatar/card gradient.

---

### Task 7: Single feature commit

**Files:** all of the above.

- [ ] **Step 1: Review the diff**

Run: `git status && git diff --stat`
Expected: only the three files under `apps/web/src/app/pro/onboarding/`.

- [ ] **Step 2: One commit**

```bash
git add apps/web/src/app/pro/onboarding
git commit -m "feat(onboarding): rebuild Phase 1 as a 3-step + publish wizard

- identity pre-filled + confirm-only, métier→suggested titles
- scaffolded skills/languages, category-aware price guidance
- Kinshasa zones, on-brand publish preview, no gradients
- trimmed to the 3-step backend model, ?step= deep-links, post-publish refresh"
```

---

## Self-Review

Checked against spec §"Phase 1 — the wizard", §"Visual & UX system", §"Geography":

- **3 tap-driven steps + publish** → Task 2 `STEPS`/`validateStep`/`step<4`; Task 3 `StepCraft`/`StepZones`/`StepPricing`/`StepPublish`. ✓
- **Identity pre-filled, confirm/edit, +243** → Task 3 `StepCraft` confirm row + prefilled inputs; Task 2 `user` prefill effect. ✓
- **Métier → suggested titles, no blank intitulé; "Autre…" free input** → Task 1 `TITLE_SUGGESTIONS`, Task 3 title chips + `titleOther`. ✓
- **Experience bands, skill chips, default languages (Français+Lingala)** → Task 1 `YEARS_OPTIONS`/`SKILL_SUGGESTIONS`/`DEFAULT_LANGUAGES`, Task 3. ✓
- **Zones Kinshasa only, radius removed** → Task 1 `CITIES` (Kinshasa), Task 3 `StepZones` (no slider). ✓
- **Category-aware static price guidance, presets** → Task 1 `PRICE_GUIDANCE`/`HOURLY_PRESETS`, Task 3 `StepPricing`. ✓
- **Publish preview: initials on beige, no gradient; "juste après"; terms** → Task 3 `StepPublish`. ✓
- **No gradients; sanctioned `.k-*` + tokens; mobile-first sticky primary** → Task 2 (`background: tokens.color.bg`, shadow-only card), Task 5, Task 6 Step 3. ✓
- **Honor `?step=` deep-links; post-publish `refreshUser` + invalidate dashboard** → Task 2 (`STEP_PARAM_TO_STEP`, publish `onSuccess`). ✓ (Phase-2 step params photo/description/portfolio are rewired by Plan 3, noted in Task 2.)
- **Keep autosave/resume/confirm-exit** → Task 2 preserves localStorage + debounced patch + confirm modal. ✓

Placeholder scan: every file step contains the complete file/replacement content; every verification step has the exact command + expected result, or an explicit manual checklist (no web test harness exists — stated up front). Type consistency: `OnboardingData` shape is identical across `types.ts`, the orchestrator's mappers, and all step components; `StepProps` matches the `<StepX>` call sites in Task 2's `body` switch.

Backend changes (DTO, endpoints) are Plan 1. Phase 2 module/editors are Plan 3.
