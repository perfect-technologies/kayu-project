"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, LocateFixed, MapPin } from "lucide-react";
import { ApiError, geoApi } from "@kayu/api";
import type { GeocodeResponse } from "@kayu/schemas";
import { providerCopy } from "@/copy/provider";
import { apiClient } from "@/lib/api";
import { getBrowserPosition } from "@/lib/geo";
import { cn } from "@/lib/utils";

const copy = providerCopy.geo;

export type GeoPick = { label: string; lat: number; lng: number; placeGuess: string | null };

export type AddressAutocompleteProps = {
  value: string;
  onChange: (text: string) => void;
  onSelect: (pick: GeoPick | null) => void;
  label: string;
  placeholder?: string;
  /** Show the "Utiliser ma position" fallback (5 s timeout). */
  allowBrowserPosition?: boolean;
  className?: string;
};

/** Debounced `GET /geocode?q=`; one suggestion row, then a green "Vérifié GPS" line once picked. */
export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  label,
  placeholder,
  allowBrowserPosition = true,
  className,
}: AddressAutocompleteProps) {
  const id = useId();
  const [result, setResult] = useState<GeocodeResponse | null>(null);
  const [picked, setPicked] = useState<GeoPick | null>(null);
  const [status, setStatus] = useState<"idle" | "searching" | "notFound" | "positionFailed">("idle");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = (q: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 3) {
      setResult(null);
      setOpen(false);
      setStatus("idle");
      return;
    }
    timer.current = setTimeout(async () => {
      setStatus("searching");
      try {
        const found = await geoApi(apiClient).geocode({ q: q.trim() });
        setResult(found);
        setOpen(true);
        setStatus("idle");
      } catch (error) {
        setResult(null);
        setOpen(false);
        setStatus(error instanceof ApiError && error.status === 404 ? "notFound" : "idle");
      }
    }, 450);
  };

  const pick = (found: GeocodeResponse) => {
    const next = { label: found.label, lat: found.lat, lng: found.lng, placeGuess: found.source === "place" ? found.label : null };
    setPicked(next);
    onChange(found.label);
    onSelect(next);
    setOpen(false);
    setResult(null);
  };

  const useBrowser = async () => {
    setStatus("searching");
    try {
      const position = await getBrowserPosition(5000);
      const next = { label: copy.positionLabel, lat: position.lat, lng: position.lng, placeGuess: null };
      setPicked(next);
      onChange(next.label);
      onSelect(next);
      setStatus("idle");
    } catch {
      setStatus("positionFailed");
    }
  };

  return (
    <div className={cn("relative", className)} ref={box}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-foreground">
        {label}
      </label>
      <div className="field field--icon">
        <MapPin size={16} aria-hidden />
        <input
          id={id}
          value={value}
          autoComplete="off"
          onChange={(event) => {
            onChange(event.target.value);
            setPicked(null);
            onSelect(null);
            search(event.target.value);
          }}
          onFocus={() => result && setOpen(true)}
          placeholder={placeholder}
        />
      </div>
      {open && result && (
        <ul className="absolute z-30 mt-1 w-full overflow-hidden rounded-2xl border border-border bg-white shadow-soft-lg">
          <li>
            <button type="button" onClick={() => pick(result)} className="flex min-h-11 w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted">
              <MapPin size={14} aria-hidden className="mt-0.5 shrink-0 text-primary" />
              <span className="text-foreground/80">{result.label}</span>
            </button>
          </li>
        </ul>
      )}
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span role="status" className={picked ? "inline-flex items-center gap-1 font-semibold text-emerald-700" : "text-muted-foreground"}>
          {picked ? (
            <>
              <Check size={13} aria-hidden /> {copy.verified(picked.lat.toFixed(4), picked.lng.toFixed(4))}
            </>
          ) : status === "searching" ? (
            copy.searching
          ) : status === "notFound" ? (
            copy.notFound
          ) : status === "positionFailed" ? (
            copy.positionFailed
          ) : null}
        </span>
        {allowBrowserPosition && (
          <button type="button" onClick={useBrowser} className="inline-flex min-h-9 items-center gap-1 font-bold text-primary">
            <LocateFixed size={13} aria-hidden /> {copy.useMyPosition}
          </button>
        )}
      </div>
    </div>
  );
}
