"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaDraftItem } from "@/components/media/media-draft";
import type { PricingValue } from "@/components/reference/PricingFields";
import { defaultSchedule, type ScheduleValue } from "@/components/schedule/ScheduleEditor";
import { clearDraft, readDraft, writeDraft } from "@/lib/onboarding-draft";

export type WizardStep = 1 | 2 | 3 | 4;
export const WIZARD_STEP_COUNT = 4;

export type SocialDraft = { youtubeUrl: string; instagramUrl: string; tiktokUrl: string; facebookUrl: string };

export type WizardDraft = {
  step: WizardStep;
  displayName: string;
  phone: string;
  whatsapp: string;
  profilePhoto: MediaDraftItem | null;
  categoryId: string;
  subcategoryId: string;
  serviceId: string;
  yearsExperience: string;
  skillIds: string[];
  freeSkills: string;
  description: string;
  placeId: string | null;
  addressLine: string;
  latitude: number | null;
  longitude: number | null;
  languageIds: string[];
  modeIds: string[];
  pricing: PricingValue | null;
  schedule: ScheduleValue;
  media: MediaDraftItem[];
  social: SocialDraft;
  acceptTerms: boolean;
};

export function emptyDraft(seed: { phone?: string | null; displayName?: string | null } = {}): WizardDraft {
  return {
    step: 1,
    displayName: seed.displayName ?? "",
    phone: seed.phone ?? "",
    whatsapp: "",
    profilePhoto: null,
    categoryId: "",
    subcategoryId: "",
    serviceId: "",
    yearsExperience: "",
    skillIds: [],
    freeSkills: "",
    description: "",
    placeId: null,
    addressLine: "",
    latitude: null,
    longitude: null,
    languageIds: [],
    modeIds: [],
    pricing: null,
    schedule: defaultSchedule(),
    media: [],
    social: { youtubeUrl: "", instagramUrl: "", tiktokUrl: "", facebookUrl: "" },
    acceptTerms: false,
  };
}

export type WizardPatch = Partial<WizardDraft> | ((current: WizardDraft) => Partial<WizardDraft>);

/**
 * Draft state persisted to `sessionStorage` (`kayou.providerDraft`, versioned) so a reload on the
 * same tab keeps every field, uploaded media path and the current step.
 */
export function useWizardDraft(seed: () => WizardDraft) {
  const [draft, setDraft] = useState<WizardDraft>(seed);
  const [hydrated, setHydrated] = useState(false);
  const skipWrite = useRef(true);

  useEffect(() => {
    const saved = readDraft<WizardDraft>();
    if (saved) setDraft((current) => ({ ...current, ...saved, schedule: saved.schedule ?? current.schedule }));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipWrite.current) {
      skipWrite.current = false;
      return;
    }
    writeDraft(draft);
  }, [draft, hydrated]);

  const patch = useCallback((update: WizardPatch) => {
    setDraft((current) => ({ ...current, ...(typeof update === "function" ? update(current) : update) }));
  }, []);

  const reset = useCallback(() => {
    clearDraft();
    setDraft(seed());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { draft, patch, reset, hydrated };
}
