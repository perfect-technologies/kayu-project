"use client";

import { useState } from "react";

export type RefuseReasonSheetProps = {
  isOpen: boolean;
  pending: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
};

type PresetReason = "Créneau indisponible" | "Trop loin" | "Autre raison…";

const PRESETS: PresetReason[] = ["Créneau indisponible", "Trop loin", "Autre raison…"];

export function RefuseReasonSheet(props: RefuseReasonSheetProps) {
  const [selected, setSelected] = useState<PresetReason>("Créneau indisponible");
  const [other, setOther] = useState("");

  if (!props.isOpen) return null;

  const onSubmit = () => {
    const reason = selected === "Autre raison…" ? (other.trim() || "Autre raison") : selected;
    props.onConfirm(reason);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={props.onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        zIndex: 60,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--k-surface)",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          padding: "16px 18px 22px",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 38,
            height: 4,
            borderRadius: 999,
            background: "var(--k-border)",
            margin: "0 auto 14px",
          }}
        />
        <h2
          style={{
            margin: "0 0 12px",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 17,
          }}
        >
          Pourquoi refuser ?
        </h2>

        {PRESETS.map((preset) => (
          <label
            key={preset}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 0",
              borderBottom: "1px solid var(--k-border-subtle)",
              cursor: "pointer",
              fontSize: 13.5,
              color: "var(--k-text-primary)",
            }}
          >
            <input
              type="radio"
              name="refuse-reason"
              checked={selected === preset}
              onChange={() => setSelected(preset)}
            />
            {preset}
          </label>
        ))}

        {selected === "Autre raison…" && (
          <textarea
            value={other}
            onChange={(e) => setOther(e.target.value.slice(0, 280))}
            placeholder="Précise (optionnel, max 280 caractères)"
            rows={3}
            style={{
              width: "100%",
              marginTop: 10,
              padding: "8px 10px",
              border: "1px solid var(--k-border)",
              borderRadius: 8,
              fontFamily: "var(--font-body)",
              fontSize: 13,
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button
            type="button"
            onClick={props.onClose}
            disabled={props.pending}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid var(--k-border)",
              background: "var(--k-surface)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={props.pending}
            style={{
              flex: 1.4,
              padding: "10px 14px",
              borderRadius: 8,
              border: 0,
              background: "var(--k-text-primary)",
              color: "white",
              fontSize: 13,
              fontWeight: 600,
              cursor: props.pending ? "wait" : "pointer",
            }}
          >
            {props.pending ? "Envoi…" : "Confirmer le refus"}
          </button>
        </div>
      </div>
    </div>
  );
}
