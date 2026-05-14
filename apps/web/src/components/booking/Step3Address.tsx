"use client";

import { useQuery } from "@tanstack/react-query";
import { MapPin, Lock } from "lucide-react";
import { KIN_COMMUNES, type KinCommune } from "@kayu/schemas";
import { identityApi } from "@kayu/api";
import { apiClient } from "@/lib/api";
import type { BookingDraft, BookingAction } from "./booking-state";

interface Props {
  state: BookingDraft;
  dispatch: (action: BookingAction) => void;
}

export function Step3Address({ state, dispatch }: Props) {
  const recents = useQuery({
    queryKey: ["recent-addresses"],
    queryFn: () => identityApi(apiClient).recentAddresses({ limit: 3 }),
    staleTime: 60_000,
  });

  const recentList = recents.data ?? [];

  return (
    <div>
      <h2 className="k-heading mb-4 mt-1" style={{ fontSize: "clamp(20px, 3vw, 26px)" }}>Où intervenir ?</h2>

      <div
        className="mb-4 inline-flex items-center gap-2"
        style={{ padding: "8px 14px", borderRadius: 999, background: "#F5F2E9", color: "#7a5e2b", fontSize: 13, fontWeight: 600 }}
      >
        <MapPin className="h-3.5 w-3.5" /> Kinshasa <Lock className="h-3 w-3 opacity-70" /> <span style={{ opacity: 0.7 }}>zone v1</span>
      </div>

      {recentList.length > 0 && (
        <>
          <div className="k-overline mb-2">Adresses récentes</div>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {recentList.map((r) => {
              const matches = state.commune === r.commune && state.street === (r.street ?? "");
              return (
                <button
                  key={r.raw}
                  onClick={() => {
                    if (r.commune) dispatch({ type: "SET_COMMUNE", commune: r.commune as KinCommune });
                    dispatch({ type: "SET_STREET", street: r.street ?? "" });
                  }}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: `1px solid ${matches ? "var(--k-primary)" : "var(--k-border)"}`,
                    background: matches ? "var(--k-primary-subtle)" : "var(--k-surface)",
                    color: matches ? "var(--k-primary-hover)" : "var(--k-text-body)",
                    fontSize: 12,
                  }}
                >
                  {(r.street ? `${r.street} · ` : "") + (r.commune ?? "Kinshasa")}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="grid gap-4 md:grid-cols-[200px_1fr]">
        <div>
          <div className="k-overline mb-2">Commune</div>
          <select
            value={state.commune ?? ""}
            onChange={(e) => dispatch({ type: "SET_COMMUNE", commune: e.target.value as KinCommune })}
            className="k-input"
            style={{ height: 48 }}
          >
            <option value="" disabled>Choisir une commune</option>
            {KIN_COMMUNES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <div className="k-overline mb-2 flex justify-between">
            <span>Avenue / rue, numéro</span>
            <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500, color: "var(--k-text-subtle)" }}>facultatif</span>
          </div>
          <input
            value={state.street}
            onChange={(e) => dispatch({ type: "SET_STREET", street: e.target.value })}
            placeholder="Av. de la Justice, n° 42"
            className="k-input"
            style={{ height: 48 }}
          />
        </div>
        <div className="md:col-span-2">
          <div className="k-overline mb-2 flex justify-between">
            <span>Repère pour trouver l'endroit</span>
            <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500, color: "var(--k-text-subtle)" }}>facultatif</span>
          </div>
          <textarea
            value={state.locationNote}
            onChange={(e) => dispatch({ type: "SET_LOCATION_NOTE", note: e.target.value })}
            placeholder="Ex. en face de la pharmacie Wenge, portail bleu…"
            rows={3}
            className="k-input"
            style={{ minHeight: 70, resize: "vertical" }}
          />
          <div className="k-caption mt-1.5">Plus tu donnes de détails, plus le pro arrive sans appeler.</div>
        </div>
      </div>
    </div>
  );
}
