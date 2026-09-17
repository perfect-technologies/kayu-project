"use client";

import { useState } from "react";
import { Navigation } from "lucide-react";
import { AddressAutocomplete } from "@/components/geo/AddressAutocomplete";
import { providerCopy } from "@/copy/provider";
import type { LatLng } from "@/lib/geo";

const copy = providerCopy.distance;

/** Address picker that feeds the header distance (client-side haversine). */
export function DistanceEstimator({ onPosition }: { onPosition: (position: LatLng | null) => void }) {
  const [text, setText] = useState("");
  return (
    <div className="mt-4 rounded-2xl border border-primary/10 bg-primary/5 p-3">
      <AddressAutocomplete
        value={text}
        onChange={setText}
        onSelect={(pick) => onPosition(pick ? { lat: pick.lat, lng: pick.lng } : null)}
        label={copy.label}
        placeholder={copy.placeholder}
      />
      <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
        <Navigation size={11} aria-hidden className="text-primary" /> {copy.hint}
      </p>
    </div>
  );
}
