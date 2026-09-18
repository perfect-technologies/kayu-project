"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus } from "lucide-react";
import { addressesApi, queryKeys } from "@kayu/api";
import type { Address, CreateAddressDto, PlaceSummary } from "@kayu/schemas";
import { FormError } from "@/components/forms/Field";
import { AddressAutocomplete, type GeoPick } from "@/components/geo/AddressAutocomplete";
import { LocationFields } from "@/components/reference/LocationFields";
import { Skeleton } from "@/components/ui/skeleton";
import { assistantCopy } from "@/copy/assistant";
import { errorMessage } from "@/copy/errors";
import { apiClient } from "@/lib/api";

const copy = assistantCopy.addressCard;

export type AddressCardMode = { kind: "pick" } | { kind: "saveDefault"; place: PlaceSummary & { chain: PlaceSummary[] } };

function countryOf(chain: PlaceSummary[]): CreateAddressDto["country"] | undefined {
  const country = chain.find((place) => place.kind === "COUNTRY");
  if (!country) return undefined;
  return /RDC|démocratique/i.test(country.label) ? "RDC" : "Congo";
}

/** Saved addresses as pills, or a new one through the public address components (RFC §4.3, phase 2 task 2). */
export function AddressCard({
  mode,
  disabled,
  onPick,
  onCreated,
}: {
  mode: AddressCardMode;
  disabled?: boolean;
  onPick: (address: Address) => void;
  onCreated: (address: Address, asDefault: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const saveDefault = mode.kind === "saveDefault";
  const [creating, setCreating] = useState(saveDefault);
  const [line, setLine] = useState("");
  const [pick, setPick] = useState<GeoPick | null>(null);
  const [placeId, setPlaceId] = useState<string | null>(saveDefault ? mode.place.id : null);
  const [chain, setChain] = useState<PlaceSummary[]>(saveDefault ? mode.place.chain : []);
  const [error, setError] = useState<string | null>(null);

  const addresses = useQuery({
    queryKey: queryKeys.addresses.list({ limit: 50 }),
    queryFn: async () => (await addressesApi(apiClient).list({ limit: 50 })).items,
    enabled: !saveDefault,
    staleTime: 60 * 1000,
  });

  const create = useMutation({
    mutationFn: (dto: CreateAddressDto) => addressesApi(apiClient).create(dto),
    onSuccess: (address) => {
      void queryClient.invalidateQueries({ queryKey: ["addresses"] });
      onCreated(address, saveDefault);
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const addressLine = line.trim();
    if (!addressLine) {
      setError(copy.lineRequired);
      return;
    }
    setError(null);
    const country = countryOf(chain);
    create.mutate({
      label: "HOME",
      addressLine,
      placeId,
      ...(country ? { country } : {}),
      latitude: pick?.lat ?? null,
      longitude: pick?.lng ?? null,
      isDefault: saveDefault,
    });
  };

  // "Gombe, Kinshasa": the seed gives the city and its province the same label, so repeats are dropped.
  const labels = saveDefault ? mode.place.chain.filter((place) => place.kind !== "COUNTRY").map((place) => place.label).reverse() : [];
  const placeLabel = labels.filter((label, index) => labels.indexOf(label) === index).join(", ");
  const title = saveDefault ? copy.saveDefaultTitle(placeLabel) : copy.title;

  return (
    <section aria-label={title} className="rounded-3xl border border-border bg-white p-4 shadow-soft">
      <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
        <MapPin size={16} aria-hidden className="text-primary" /> {title}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">{saveDefault ? copy.saveDefaultHint : copy.hint}</p>

      {!saveDefault && (
        <div className="mt-3 flex flex-wrap gap-2">
          {addresses.isPending && <Skeleton className="h-11 w-40 rounded-full" />}
          {addresses.data?.map((address) => (
            <button
              key={address.id}
              type="button"
              disabled={disabled}
              onClick={() => onPick(address)}
              className="inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full border border-border bg-white px-4 text-left text-sm font-semibold text-foreground/80 shadow-soft disabled:opacity-55"
            >
              <span className="shrink-0 text-primary">{copy.labels[address.label] ?? address.label}</span>
              <span className="truncate text-xs font-normal text-muted-foreground">{address.addressLine}</span>
            </button>
          ))}
          <button
            type="button"
            disabled={disabled}
            aria-expanded={creating}
            onClick={() => setCreating((value) => !value)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-dashed border-primary/40 px-4 text-sm font-semibold text-primary disabled:opacity-55"
          >
            <Plus size={14} aria-hidden /> {copy.new}
          </button>
        </div>
      )}

      {creating && (
        <form onSubmit={submit} className="mt-3 space-y-3">
          <AddressAutocomplete value={line} onChange={setLine} onSelect={setPick} label={copy.line} />
          {!saveDefault && (
            <div>
              <p className="mb-1.5 text-xs font-bold text-foreground">{copy.location}</p>
              <LocationFields value={placeId} onChange={(id, next) => (setPlaceId(id), setChain(next))} allowSuggest={false} />
            </div>
          )}
          <FormError message={error} />
          <button type="submit" disabled={disabled || create.isPending} className="primary-action primary-action--gold min-h-11 text-sm">
            {create.isPending ? copy.saving : saveDefault ? copy.saveDefault : copy.save}
          </button>
        </form>
      )}
    </section>
  );
}
