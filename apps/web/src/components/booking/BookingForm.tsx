"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, CheckCircle2, Clock } from "lucide-react";
import { ApiError, addressesApi, bookingsApi, providersApi, queryKeys } from "@kayu/api";
import type { BookingDetail, CreateBookingDto } from "@kayu/schemas";
import { formatSlotLocal, localParts } from "@kayu/utils";
import { toast } from "sonner";
import { AddressAutocomplete, type GeoPick } from "@/components/geo/AddressAutocomplete";
import { LocationFields } from "@/components/reference/LocationFields";
import { PhoneField } from "@/components/ui/PhoneField";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { errorMessage } from "@/copy/errors";
import { providerCopy } from "@/copy/provider";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";

const copy = providerCopy.booking;
const SLOT_SHIMMER = [0, 1, 2, 3, 4, 5];
type AddressMode = "none" | "default" | "saved" | "new";

export type BookingFormProps = {
  providerId: string;
  timezone: string;
  /** `feat_booking` site flag. */
  enabled: boolean;
  onBooked?: (booking: BookingDetail) => void;
};

function Notice({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-border bg-white p-4 text-center text-sm text-muted-foreground">{children}</p>;
}

/** "Réserver un créneau": date, slot pills from the availability endpoint, phone, address, notes. */
export function BookingForm({ providerId, timezone, enabled, onBooked }: BookingFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = useMemo(() => localParts(timezone, new Date()).date, [timezone]);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [notes, setNotes] = useState("");
  const [addressMode, setAddressMode] = useState<AddressMode>("none");
  const [savedId, setSavedId] = useState("");
  const [addressText, setAddressText] = useState("");
  const [pick, setPick] = useState<GeoPick | null>(null);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [done, setDone] = useState<BookingDetail | null>(null);

  const canBook = user?.role === "CLIENT" || user?.role === "ADMIN";

  const availability = useQuery({
    queryKey: queryKeys.providers.availability(providerId, date),
    queryFn: () => providersApi(apiClient).availability(providerId, date),
    enabled: Boolean(date) && canBook && enabled,
    staleTime: 15 * 1000,
  });

  const addresses = useQuery({
    queryKey: queryKeys.addresses.list({ limit: 50 }),
    queryFn: async () => (await addressesApi(apiClient).list({ limit: 50 })).items,
    enabled: canBook && enabled,
    staleTime: 60 * 1000,
  });
  const defaultAddress = addresses.data?.find((address) => address.isDefault) ?? null;
  const otherAddresses = addresses.data?.filter((address) => !address.isDefault) ?? [];

  const create = useMutation({
    mutationFn: (dto: CreateBookingDto) => bookingsApi(apiClient).create(dto),
    onSuccess: (booking) => {
      setDone(booking);
      onBooked?.(booking);
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.providers.availability(providerId, date) });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === "SLOT_TAKEN") {
        toast.error(copy.slotTaken);
        setSlot("");
        void queryClient.invalidateQueries({ queryKey: queryKeys.providers.availability(providerId, date) });
        return;
      }
      if (error instanceof ApiError && error.code === "PROVIDER_UNAVAILABLE") {
        toast.error(copy.unavailable);
        return;
      }
      toast.error(errorMessage(error));
    },
  });

  if (!enabled) return <Notice>{copy.disabled}</Notice>;
  if (!canBook) return <Notice>{copy.providerRole}</Notice>;

  if (done) {
    const when = formatSlotLocal(done.scheduledAt, done.timezone).label;
    return (
      <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-5 text-center">
        <CheckCircle2 size={36} aria-hidden className="mx-auto text-emerald-600" />
        <h3 className="mt-2 font-extrabold text-emerald-800">{copy.successTitle}</h3>
        <p className="mt-1 text-sm text-emerald-700">{copy.successBody(when)}</p>
        <Link href="/mes-reservations" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground">
          {copy.successLink}
        </Link>
        <button
          type="button"
          onClick={() => {
            setDone(null);
            setDate("");
            setSlot("");
            setNotes("");
          }}
          className="mt-3 block w-full text-xs font-semibold text-emerald-800"
        >
          {copy.another}
        </button>
      </div>
    );
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      setPhoneError(copy.phoneInvalid);
      return;
    }
    setPhoneError(undefined);
    const dto: CreateBookingDto = { providerId, date, time: slot, clientPhone: phone, clientNotes: notes.trim() || undefined };
    if (addressMode === "default" && defaultAddress) dto.addressId = defaultAddress.id;
    if (addressMode === "saved" && savedId) dto.addressId = savedId;
    if (addressMode === "new") {
      if (placeId) dto.placeId = placeId;
      if (addressText.trim()) dto.addressLine = addressText.trim();
      if (pick) {
        dto.latitude = pick.lat;
        dto.longitude = pick.lng;
      }
    }
    create.mutate(dto);
  };

  const slots = availability.data?.slots ?? [];
  const addressOptions: Array<{ key: AddressMode; label: string }> = [
    { key: "none", label: copy.addressNone },
    ...(defaultAddress ? [{ key: "default" as const, label: copy.addressDefault }] : []),
    ...(otherAddresses.length > 0 ? [{ key: "saved" as const, label: copy.addressSaved }] : []),
    { key: "new", label: copy.addressNew },
  ];

  return (
    <form id="reserver" onSubmit={submit} className="scroll-mt-24 rounded-2xl border border-border bg-white p-4 shadow-soft">
      <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold text-foreground">
        <CalendarCheck size={18} aria-hidden className="text-primary" /> {copy.title}
      </h2>

      <label className="block text-xs font-bold text-foreground">
        {copy.date}
        <input
          type="date"
          required
          min={today}
          value={date}
          onChange={(event) => {
            setDate(event.target.value);
            setSlot("");
          }}
          className="field mt-1.5"
        />
      </label>

      {date && (
        <fieldset className="mt-3">
          <legend className="mb-1.5 flex items-center gap-1 text-xs font-bold text-foreground">
            <Clock size={12} aria-hidden /> {copy.slots}
          </legend>
          {availability.isPending ? (
            <div className="grid grid-cols-4 gap-1.5" role="status">
              {SLOT_SHIMMER.map((index) => (
                <Skeleton key={index} className="h-9 rounded-full" />
              ))}
            </div>
          ) : availability.isError ? (
            <p role="alert" className="text-xs text-destructive">
              {copy.slotsError}
            </p>
          ) : slots.length === 0 ? (
            <p className="text-xs text-muted-foreground">{copy.slotsEmpty}</p>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-1.5">
                {slots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    aria-pressed={slot === time}
                    onClick={() => setSlot(time)}
                    className={cn(
                      "min-h-9 rounded-full text-xs font-semibold transition",
                      slot === time ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">{copy.timezone(availability.data?.timezone ?? timezone)}</p>
            </>
          )}
        </fieldset>
      )}

      <PhoneField className="mt-3" label={copy.phone} value={phone} onChange={setPhone} required error={phoneError} />

      <fieldset className="mt-3">
        <legend className="mb-1.5 text-xs font-bold text-foreground">{copy.addressTitle}</legend>
        <div className="flex flex-wrap gap-2">
          {addressOptions.map((option) => (
            <label
              key={option.key}
              className={cn(
                "inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-semibold",
                addressMode === option.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white text-foreground/80",
              )}
            >
              <input
                type="radio"
                name="address-mode"
                value={option.key}
                checked={addressMode === option.key}
                onChange={() => setAddressMode(option.key)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
        {addressMode === "default" && defaultAddress && <p className="mt-2 text-xs text-muted-foreground">{defaultAddress.addressLine}</p>}
        {addressMode === "saved" && (
          <select aria-label={copy.addressPick} value={savedId} onChange={(event) => setSavedId(event.target.value)} className="field mt-2 h-11">
            <option value="">{copy.addressPick}</option>
            {otherAddresses.map((address) => (
              <option key={address.id} value={address.id}>
                {address.addressLine}
              </option>
            ))}
          </select>
        )}
        {addressMode === "new" && (
          <div className="mt-2 space-y-3">
            <AddressAutocomplete value={addressText} onChange={setAddressText} onSelect={setPick} label={copy.addressLine} />
            <LocationFields value={placeId} onChange={(id) => setPlaceId(id)} allowSuggest={false} />
          </div>
        )}
      </fieldset>

      <label className="mt-3 block text-xs font-bold text-foreground">
        {copy.notes}
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={2000}
          rows={2}
          placeholder={copy.notesPlaceholder}
          className="field mt-1.5 h-auto py-3"
        />
      </label>

      <button
        type="submit"
        disabled={create.isPending || !date || !slot || (addressMode === "saved" && !savedId)}
        className="primary-action primary-action--gold mt-4"
      >
        {create.isPending ? copy.submitting : copy.submit}
      </button>
    </form>
  );
}
