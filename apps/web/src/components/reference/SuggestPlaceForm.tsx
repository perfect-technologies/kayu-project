"use client";

import { useState } from "react";
import { placesApi } from "@kayu/api";
import type { PlaceKind, PlaceSummary } from "@kayu/schemas";
import { useAuth } from "@/contexts/AuthContext";
import { providerCopy } from "@/copy/provider";
import { errorMessage } from "@/copy/errors";
import { apiClient } from "@/lib/api";
import { loginPath, currentLocation } from "@/lib/auth-redirects";
import Link from "next/link";

const copy = providerCopy.references;

const CHILD_KINDS: Record<PlaceKind, PlaceKind[]> = {
  COUNTRY: ["PROVINCE", "CITY"],
  PROVINCE: ["CITY", "TERRITORY"],
  CITY: ["COMMUNE"],
  TERRITORY: ["COMMUNE", "SECTOR", "CHIEFDOM"],
  COMMUNE: ["QUARTIER"],
  SECTOR: ["VILLAGE"],
  CHIEFDOM: ["VILLAGE"],
  QUARTIER: [],
  VILLAGE: [],
};

export function childKindsOf(kind: PlaceKind): PlaceKind[] {
  return CHILD_KINDS[kind];
}

/** "Mon lieu est absent" → `POST /places/suggestions` under the deepest selected place. */
export function SuggestPlaceForm({ parent, onDone }: { parent: PlaceSummary; onDone?: () => void }) {
  const { isAuthenticated } = useAuth();
  const kinds = childKindsOf(parent.kind).filter((kind) => kind !== "COUNTRY");
  const [kind, setKind] = useState<PlaceKind>(kinds[0] ?? "QUARTIER");
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isAuthenticated) {
    return (
      <p className="rounded-2xl bg-secondary p-3 text-xs">
        <Link href={loginPath(currentLocation())} className="font-bold text-primary">
          {copy.suggestLogin}
        </Link>
      </p>
    );
  }

  const submit = async () => {
    setBusy(true);
    setStatus(null);
    try {
      await placesApi(apiClient).suggest({ kind: kind as Exclude<PlaceKind, "COUNTRY">, label: label.trim(), parentId: parent.id });
      setStatus({ tone: "ok", text: copy.suggestSent });
      setLabel("");
      onDone?.();
    } catch (error) {
      setStatus({ tone: "error", text: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2 rounded-2xl bg-secondary p-3">
      <label className="block text-xs font-bold">
        {copy.suggestKind}
        <select value={kind} onChange={(event) => setKind(event.target.value as PlaceKind)} className="field mt-1 h-11">
          {kinds.map((option) => (
            <option key={option} value={option}>
              {copy.kinds[option]}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-bold">
        {copy.suggestLabel}
        <input
          maxLength={100}
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          className="field mt-1 h-11"
        />
      </label>
      <button
        type="button"
        onClick={submit}
        disabled={busy || label.trim().length < 2}
        className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-55"
      >
        {copy.suggestSubmit}
      </button>
      {status && (
        <p role="status" className={`text-xs ${status.tone === "error" ? "text-destructive" : "text-emerald-700"}`}>
          {status.text}
        </p>
      )}
    </div>
  );
}
