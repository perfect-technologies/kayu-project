"use client";

import { AddressAutocomplete } from "@/components/geo/AddressAutocomplete";
import { LocationFields } from "@/components/reference/LocationFields";
import { onboardingCopy } from "@/copy/onboarding";
import { roundCoord } from "@/lib/geo";
import type { FieldErrors } from "./wizard-validation";

const copy = onboardingCopy.location;

export type LocationValue = { placeId: string | null; addressLine: string; latitude: number | null; longitude: number | null };

export type StepLocationProps = {
  value: LocationValue;
  onChange: (patch: Partial<LocationValue>) => void;
  errors: FieldErrors;
  heading?: boolean;
};

export function StepLocation({ value, onChange, errors, heading = true }: StepLocationProps) {
  return (
    <div className="space-y-4">
      {heading && <h2 className="text-lg font-extrabold">{copy.title}</h2>}
      <LocationFields value={value.placeId} mode="full" onChange={(placeId) => onChange({ placeId })} />
      {errors.placeId && (
        <p role="alert" className="text-xs font-semibold text-destructive">
          {errors.placeId}
        </p>
      )}
      <AddressAutocomplete
        label={copy.address}
        placeholder={copy.addressPlaceholder}
        value={value.addressLine}
        onChange={(addressLine) => onChange({ addressLine })}
        onSelect={(pick) => onChange(pick ? { addressLine: pick.label, latitude: roundCoord(pick.lat), longitude: roundCoord(pick.lng) } : { latitude: null, longitude: null })}
      />
      {(errors.addressLine || errors.latitude) && (
        <p role="alert" className="text-xs font-semibold text-destructive">
          {errors.addressLine ?? errors.latitude}
        </p>
      )}
      <p className="text-[11px] text-muted-foreground">{copy.gpsHint}</p>
    </div>
  );
}
