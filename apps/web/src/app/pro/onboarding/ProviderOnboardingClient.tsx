"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { I, StepIndicator, type StepIndicatorStep } from "@kayu/ui/web";
import { tokens } from "@kayu/ui";
import { categoriesApi, onboardingApi, queryKeys } from "@kayu/api";
import type { ProviderDraftDto } from "@kayu/schemas";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  StepCraft,
  StepIdentity,
  StepPricing,
  StepProfile,
  StepPublish,
  StepZones,
} from "./OnboardingSteps";
import type { OnboardingData } from "./types";

const STEPS: StepIndicatorStep[] = [
  { key: "identity", n: 1, label: "Identité", icon: "shieldCheck" },
  { key: "craft", n: 2, label: "Activité", icon: "wrench" },
  { key: "zones", n: 3, label: "Zones", icon: "mapPin" },
  { key: "pricing", n: 4, label: "Tarifs", icon: "coins" },
  { key: "profile", n: 5, label: "Profil", icon: "user" },
  { key: "publish", n: 6, label: "Publier", icon: "sparkles" },
];

const TITLES: Record<number, string> = {
  1: "Vérifions ton identité",
  2: "Quelle est ton activité ?",
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
const DEBOUNCE_MS = 600;

const EMPTY_DATA: OnboardingData = {
  firstName: "",
  lastName: "",
  phone: "",
  id: {},
  categories: [],
  subcategoryIds: [],
  title: "",
  years: "",
  skills: [],
  zones: [],
  radius: 10,
  hourly: 0,
  travelMode: "free",
  payment: "airtel",
  photo: false,
  bio: "",
  portfolio: 0,
  languages: [],
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

function validateStep(step: number, d: OnboardingData): boolean {
  switch (step) {
    case 1:
      return (
        d.firstName.trim().length > 0 &&
        d.lastName.trim().length > 0 &&
        d.phone.length === 9
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
      // Avatar upload is deferred until real storage lands — require only a bio
      // for launch and stop pretending a photo was uploaded.
      return d.bio.trim().length >= 10;
    case 6:
      return d.acceptedTerms;
    default:
      return false;
  }
}

export function ProviderOnboardingClient() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
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
    onError: () => {
      setSaveError(true);
    },
  });

  const publishMut = useMutation({
    mutationFn: () => onboardingApi(apiClient).publish(),
    onSuccess: () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      toast.success("Ton profil est publié. Bienvenue sur KAYOU !");
      router.push("/pro");
    },
    onError: (error: unknown) => {
      const missing = extractMissing(error);
      if (missing.length > 0) {
        const stepForField = mapFieldToStep(missing[0]);
        setStep(stepForField);
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

  // Hydrate from localStorage (fast optimistic path)
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
      /* ignore corrupted draft */
    }
  }, []);

  // Hydrate from backend draft (source of truth)
  useEffect(() => {
    if (!draftQuery.data || !categoriesQuery.data || hydrated) return;
    const mapped = backendToData(
      draftQuery.data.draft,
      categoriesQuery.data.categories,
    );
    setData((prev) => mergeBackendDraft(prev, mapped));
    const serverStep = draftQuery.data.step;
    if (serverStep !== null && serverStep !== undefined) {
      setStep(Math.min(6, Math.max(1, serverStep + 1)));
    }
    setHydrated(true);
  }, [draftQuery.data, categoriesQuery.data, hydrated]);

  // Prefill identity from user record if not yet filled
  useEffect(() => {
    if (!user) return;
    setData((prev) => ({
      ...prev,
      firstName: prev.firstName || (user.firstName ?? ""),
      lastName: prev.lastName || (user.lastName ?? ""),
      phone: prev.phone || normalizePhone(user.phone),
    }));
  }, [user]);

  // Persist locally (optimistic cache)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, data }));
    } catch {
      /* localStorage may be full or blocked */
    }
  }, [step, data]);

  // Debounced server PATCH — fires 600ms after the last change
  const debounceRef = useRef<number | null>(null);
  const lastPayloadRef = useRef<string>("");
  useEffect(() => {
    if (!hydrated || !categoriesQuery.data) return;
    const payload = dataToBackend(data, categoriesQuery.data.categories);
    const serialized = JSON.stringify(payload);
    if (serialized === lastPayloadRef.current) return;
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      lastPayloadRef.current = serialized;
      patchMut.mutate(payload);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
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
        onboardingStep: Math.max(0, Math.min(5, targetStep - 1)),
      };
      lastPayloadRef.current = JSON.stringify(payload);
      await patchMut.mutateAsync(payload);
    },
    [categoriesQuery.data, data, patchMut],
  );

  const handleContinue = async () => {
    if (!canContinue) return;
    if (step < 6) {
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
      await saveDraftAtStep(step);
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
      await saveDraftAtStep(step);
      toast.success("Brouillon sauvegardé. Tu peux reprendre plus tard.");
      router.push("/pro");
    } catch {
      toast.error("Impossible de sauvegarder le brouillon. Réessaie.");
    }
  };

  if (authLoading || !isAuthenticated || draftQuery.isLoading || categoriesQuery.isLoading) {
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
        return <StepIdentity data={data} setData={updateData} />;
      case 2:
        return (
          <StepCraft
            data={data}
            setData={updateData}
            categoryOptions={categoriesQuery.data?.categories ?? []}
          />
        );
      case 3:
        return <StepZones data={data} setData={updateData} />;
      case 4:
        return <StepPricing data={data} setData={updateData} />;
      case 5:
        return <StepProfile data={data} setData={updateData} />;
      case 6:
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
        background:
          "linear-gradient(180deg, var(--k-surface-primary) 0%, var(--k-bg) 34%, var(--k-bg) 100%)",
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
                letterSpacing: 0,
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
          maxWidth: 1040,
          margin: "0 auto",
          padding: "32px 32px 148px",
          width: "100%",
          boxSizing: "border-box",
          flex: 1,
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <StepIndicator steps={STEPS} step={step} compact={compactSteps} />
        </div>

        <div
          style={{
            marginBottom: 24,
            display: "flex",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 16,
            justifyContent: "space-between",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: tokens.font.display,
                fontWeight: 700,
                fontSize: "clamp(28px, 4vw, 42px)",
                letterSpacing: 0,
                color: tokens.color.textPrimary,
                margin: "0 0 6px",
                lineHeight: 1.08,
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
          <div
            className="k-chip k-chip-sm"
            style={{
              whiteSpace: "nowrap",
              color: saveError ? tokens.color.danger : tokens.color.textMuted,
              background: saveError
                ? tokens.color.dangerSubtle
                : tokens.color.surfaceMuted,
            }}
          >
            {saveLabel}
          </div>
        </div>

        <div
          style={{
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.lg,
            padding: "clamp(20px, 4vw, 32px)",
            boxShadow: tokens.shadow.e2,
          }}
        >
          {body}
        </div>
      </div>

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
              flexWrap: "wrap",
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
              disabled={!canContinue || saving}
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
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <button
              type="button"
              className="k-btn k-btn-secondary"
              onClick={saveDraftAndExit}
              disabled={submitting || saving}
            >
              Enregistrer comme brouillon
            </button>
            <div style={{ flex: 1 }} />
            <button
              type="button"
              className="k-btn k-btn-primary k-btn-lg"
              onClick={handleContinue}
              disabled={!canContinue || submitting || saving}
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
              Ta progression est sauvegardée côté serveur. Tu peux reprendre
              où tu en étais depuis ton dashboard, y compris sur un autre appareil.
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
  if (digits.startsWith("242")) return digits.slice(3).slice(0, 9);
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
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function categoryToken(category: CategoryIndex[number]): string | null {
  const normalized = normalizeCategoryText(
    `${category.slug} ${category.name} ${(category.subcategories ?? [])
      .map((subcategory) => subcategory.name)
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
      categories.find((category) => category.id === value) ??
      categories.find((category) => category.slug === value) ??
      categories.find((category) => category.slug.startsWith(`${value}-`)) ??
      categories.find((category) =>
        (category.subcategories ?? []).some(
          (subcategory) =>
            subcategory.id === value ||
            subcategory.slug === value ||
            subcategory.name === value ||
            subcategory.name.toLowerCase() === value.toLowerCase(),
        ),
      ) ??
      categories.find((category) => categoryToken(category) === value);
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
    id: {
      front: draft.idFrontUploaded ?? undefined,
      back: draft.idBackUploaded ?? undefined,
    },
    categories: selectedCategoryIds,
    subcategoryIds: draft.subcategoryIds ?? [],
    title: draft.profession ?? "",
    years: numberToYearsLabel(draft.yearsOfExperience),
    skills: (draft.skills ?? []).map((skill) => skill.name),
    zones: (draft.serviceZones ?? []).map(
      (zone) => `${zone.city}|${zone.commune ?? ""}`,
    ),
    radius: draft.zoneRadiusKm ?? 10,
    hourly: draft.hourlyRate ?? 0,
    bio: draft.description ?? draft.bio ?? "",
    photo: Boolean(draft.avatar),
    languages: draft.languages ?? [],
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
    id:
      mapped.id && (mapped.id.front || mapped.id.back)
        ? mapped.id
        : prev.id,
    categories:
      mapped.categories && mapped.categories.length > 0
        ? mapped.categories
        : prev.categories,
    title: mapped.title || prev.title,
    years: mapped.years || prev.years,
    skills:
      mapped.skills && mapped.skills.length > 0 ? mapped.skills : prev.skills,
    subcategoryIds:
      mapped.subcategoryIds && mapped.subcategoryIds.length > 0
        ? mapped.subcategoryIds
        : prev.subcategoryIds,
    zones: mapped.zones && mapped.zones.length > 0 ? mapped.zones : prev.zones,
    radius: mapped.radius && mapped.radius > 0 ? mapped.radius : prev.radius,
    hourly: mapped.hourly && mapped.hourly > 0 ? mapped.hourly : prev.hourly,
    bio: mapped.bio || prev.bio,
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
    .filter((zone): zone is { city: string; commune: string | null } => Boolean(zone));

  const payload: ProviderDraftDto = {
    firstName: data.firstName || undefined,
    lastName: data.lastName || undefined,
    phone: data.phone ? `+243${data.phone}` : undefined,
    idFrontUploaded: Boolean(data.id.front),
    idBackUploaded: Boolean(data.id.back),
    primaryCategoryId: primaryId ?? undefined,
    categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
    subcategoryIds:
      data.subcategoryIds.length > 0 ? data.subcategoryIds : undefined,
    profession: data.title || undefined,
    skills: data.skills.map((name) => ({ name, level: 3 })),
    yearsOfExperience: data.years ? YEARS_TO_NUMBER[data.years] : undefined,
    description: data.bio || undefined,
    serviceZones: zones,
    zoneRadiusKm: data.radius,
    hourlyRate: data.hourly > 0 ? data.hourly : undefined,
    bio: data.bio || undefined,
    languages: data.languages,
    // Avatar upload is not yet wired to real storage; don't push a placeholder
    // string that the backend now strips during publish.
  };

  return payload;
}

function extractMissing(error: unknown): string[] {
  if (!error || typeof error !== "object") return [];
  const maybe = error as { body?: { missing?: unknown }; response?: { missing?: unknown } };
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
      return 1;
    case "primaryCategoryId":
      return 2;
    case "serviceZones":
      return 3;
    case "hourlyRate":
      return 4;
    case "avatar":
      return 5;
    default:
      return 6;
  }
}
