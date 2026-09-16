"use client";

import { useEffect, useState } from "react";
import { Briefcase, Home, MapPin, type LucideIcon } from "lucide-react";
import type { Address, AddressLabel, CreateAddressDto, PlaceSummary } from "@kayu/schemas";
import { Field, FormError } from "@/components/forms/Field";
import { AddressAutocomplete, type GeoPick } from "@/components/geo/AddressAutocomplete";
import { LocationFields } from "@/components/reference/LocationFields";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { adressesCopy } from "@/copy/adresses";
import { cn } from "@/lib/utils";

const copy = adressesCopy.sheet;
const TYPES: { value: AddressLabel; icon: LucideIcon }[] = [
  { value: "HOME", icon: Home },
  { value: "WORK", icon: Briefcase },
  { value: "OTHER", icon: MapPin },
];

type Draft = {
  label: AddressLabel;
  recipient: string;
  addressLine: string;
  placeId: string | null;
  chain: PlaceSummary[];
  latitude: number | null;
  longitude: number | null;
};

function fromAddress(address: Address | null): Draft {
  return {
    label: address?.label ?? "HOME",
    recipient: address?.recipient ?? "",
    addressLine: address?.addressLine ?? "",
    placeId: address?.placeId ?? null,
    chain: address?.placeChain ?? [],
    latitude: address?.latitude ?? null,
    longitude: address?.longitude ?? null,
  };
}

function countryOf(chain: PlaceSummary[]): CreateAddressDto["country"] | undefined {
  const country = chain.find((place) => place.kind === "COUNTRY");
  if (!country) return undefined;
  return /RDC|démocratique/i.test(country.label) ? "RDC" : "Congo";
}

export function toAddressDto(draft: Draft): CreateAddressDto {
  const country = countryOf(draft.chain);
  return {
    label: draft.label,
    recipient: draft.recipient.trim() || null,
    addressLine: draft.addressLine.trim(),
    placeId: draft.placeId,
    ...(country ? { country } : {}),
    latitude: draft.latitude,
    longitude: draft.longitude,
  };
}

export type AddressSheetProps = {
  open: boolean;
  onClose: () => void;
  address: Address | null;
  busy?: boolean;
  error?: string | null;
  onSubmit: (dto: CreateAddressDto) => void;
};

/** Bottom sheet creating or editing an address: type tiles, recipient, geocoded address, place chain. */
export function AddressSheet({ open, onClose, address, busy, error, onSubmit }: AddressSheetProps) {
  const [draft, setDraft] = useState<Draft>(() => fromAddress(address));
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(fromAddress(address));
      setLocalError(null);
    }
  }, [open, address]);

  const patch = (partial: Partial<Draft>) => setDraft((current) => ({ ...current, ...partial }));
  const onPick = (pick: GeoPick | null) => {
    if (pick) patch({ addressLine: pick.label, latitude: pick.lat, longitude: pick.lng });
    else patch({ latitude: null, longitude: null });
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (draft.addressLine.trim().length === 0) {
      setLocalError(copy.addressRequired);
      return;
    }
    setLocalError(null);
    onSubmit(toAddressDto(draft));
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={address ? copy.editTitle : copy.createTitle} className="max-h-[90vh] sm:top-[6dvh] sm:bottom-auto sm:rounded-3xl">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <p className="mb-1.5 text-xs font-bold text-foreground">{copy.type}</p>
          <div role="radiogroup" aria-label={copy.type} className="grid grid-cols-3 gap-2">
            {TYPES.map(({ value, icon: Icon }) => {
              const active = draft.label === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => patch({ label: value })}
                  className={cn(
                    "flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl border text-xs font-semibold transition",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white text-foreground",
                  )}
                >
                  <Icon size={20} aria-hidden strokeWidth={1.75} />
                  {adressesCopy.labels[value]}
                </button>
              );
            })}
          </div>
        </div>
        <Field label={copy.recipient} value={draft.recipient} onChange={(event) => patch({ recipient: event.target.value })} maxLength={120} placeholder={copy.recipientPlaceholder} />
        <AddressAutocomplete value={draft.addressLine} onChange={(addressLine) => patch({ addressLine })} onSelect={onPick} label={copy.addressLabel} placeholder={copy.addressPlaceholder} />
        <div>
          <p className="mb-1.5 text-xs font-bold text-foreground">{copy.location}</p>
          <LocationFields value={draft.placeId} onChange={(placeId, chain) => patch({ placeId, chain })} mode="full" allowSuggest />
        </div>
        <FormError message={localError ?? error} />
        <button type="submit" disabled={busy} className="primary-action">
          {address ? copy.submitUpdate : copy.submitCreate}
        </button>
      </form>
    </BottomSheet>
  );
}
