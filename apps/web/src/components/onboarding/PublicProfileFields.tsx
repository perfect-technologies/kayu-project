"use client";

import { Facebook, Instagram, Music2, Youtube } from "lucide-react";
import { Field } from "@/components/forms/Field";
import { MultipleChoices } from "@/components/reference/MultipleChoices";
import { PricingFields, type PricingValue } from "@/components/reference/PricingFields";
import { onboardingCopy } from "@/copy/onboarding";
import type { SocialDraft } from "./wizard-state";
import type { FieldErrors } from "./wizard-validation";

const copy = onboardingCopy.public;

export type PublicProfileValue = { languageIds: string[]; modeIds: string[]; pricing: PricingValue | null; social: SocialDraft };

export type PublicProfileFieldsProps = {
  value: PublicProfileValue;
  onChange: (patch: Partial<PublicProfileValue>) => void;
  errors: FieldErrors;
};

/** Languages, intervention modes, pricing and social links: shared by wizard step 4 and the editor. */
export function PublicProfileFields({ value, onChange, errors }: PublicProfileFieldsProps) {
  const social = value.social;
  const setSocial = (patch: Partial<SocialDraft>) => onChange({ social: { ...social, ...patch } });
  return (
    <div className="space-y-4">
      <MultipleChoices label={copy.languages} type="LANGUAGE" value={value.languageIds} onChange={(languageIds) => onChange({ languageIds })} />
      {errors.languageIds && (
        <p role="alert" className="text-xs font-semibold text-destructive">
          {errors.languageIds}
        </p>
      )}
      <MultipleChoices label={copy.modes} type="INTERVENTION_MODE" value={value.modeIds} onChange={(modeIds) => onChange({ modeIds })} />
      {errors.modeIds && (
        <p role="alert" className="text-xs font-semibold text-destructive">
          {errors.modeIds}
        </p>
      )}
      <PricingFields value={value.pricing} onChange={(pricing) => onChange({ pricing })} />
      {errors.pricing && (
        <p role="alert" className="text-xs font-semibold text-destructive">
          {errors.pricing}
        </p>
      )}
      <fieldset className="space-y-3 rounded-2xl border border-border bg-white p-4">
        <legend className="px-1 text-sm font-bold">{copy.social}</legend>
        <p className="text-xs text-muted-foreground">{copy.socialHint}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={copy.youtube} type="url" inputMode="url" icon={<Youtube size={16} aria-hidden />} value={social.youtubeUrl} placeholder="https://youtube.com/@…" onChange={(event) => setSocial({ youtubeUrl: event.target.value })} />
          <Field label={copy.instagram} type="url" inputMode="url" icon={<Instagram size={16} aria-hidden />} value={social.instagramUrl} placeholder="https://instagram.com/…" onChange={(event) => setSocial({ instagramUrl: event.target.value })} />
          <Field label={copy.tiktok} type="url" inputMode="url" icon={<Music2 size={16} aria-hidden />} value={social.tiktokUrl} placeholder="https://tiktok.com/@…" onChange={(event) => setSocial({ tiktokUrl: event.target.value })} />
          <Field label={copy.facebook} type="url" inputMode="url" icon={<Facebook size={16} aria-hidden />} value={social.facebookUrl} placeholder="https://facebook.com/…" onChange={(event) => setSocial({ facebookUrl: event.target.value })} />
        </div>
        {errors.social && (
          <p role="alert" className="text-xs font-semibold text-destructive">
            {errors.social}
          </p>
        )}
      </fieldset>
    </div>
  );
}
