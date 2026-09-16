"use client";

import { User } from "lucide-react";
import { Field } from "@/components/forms/Field";
import { PhotoDropzone } from "@/components/media/PhotoDropzone";
import type { MediaDraftItem } from "@/components/media/media-draft";
import { PhoneField } from "@/components/ui/PhoneField";
import { onboardingCopy } from "@/copy/onboarding";
import type { FieldErrors } from "./wizard-validation";

const copy = onboardingCopy.infos;

export type InfosValue = { displayName: string; phone: string; whatsapp: string; profilePhoto: MediaDraftItem | null };

export type StepInfosProps = {
  value: InfosValue;
  onChange: (patch: Partial<InfosValue>) => void;
  errors: FieldErrors;
  onBusyChange?: (busy: boolean) => void;
  /** Hides the step heading in the editor tabs. */
  heading?: boolean;
};

export function StepInfos({ value, onChange, errors, onBusyChange, heading = true }: StepInfosProps) {
  return (
    <div className="space-y-4">
      {heading && <h2 className="text-lg font-extrabold">{copy.title}</h2>}
      <Field
        label={copy.displayName}
        required
        icon={<User size={18} aria-hidden />}
        value={value.displayName}
        maxLength={120}
        autoComplete="name"
        placeholder={copy.displayNamePlaceholder}
        error={errors.displayName}
        onChange={(event) => onChange({ displayName: event.target.value })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <PhoneField label={copy.phone} required value={value.phone} error={errors.phone} onChange={(phone) => onChange({ phone })} />
        <div>
          <PhoneField label={copy.whatsapp} value={value.whatsapp} error={errors.whatsapp} onChange={(whatsapp) => onChange({ whatsapp })} />
          {!errors.whatsapp && <p className="mt-1 text-[11px] text-muted-foreground">{copy.whatsappHint}</p>}
        </div>
      </div>
      <PhotoDropzone label={copy.photo} hint={copy.photoHint} value={value.profilePhoto} onChange={(profilePhoto) => onChange({ profilePhoto })} onBusyChange={onBusyChange} />
      {errors.profilePhoto && (
        <p role="alert" className="text-xs font-semibold text-destructive">
          {errors.profilePhoto}
        </p>
      )}
    </div>
  );
}
