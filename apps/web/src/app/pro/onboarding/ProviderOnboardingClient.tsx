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
      try {
        await refreshUser();
      } catch (err) {
        console.error("refreshUser failed after publish:", err);
      }
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
                    backgroundSize: "400px 100%",
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
