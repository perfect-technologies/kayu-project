"use client";

import { I } from "@kayu/ui/web";

export type AvailabilitySheetProps = {
  isOpen: boolean;
  isAvailable: boolean;
  zoneCity: string;
  zoneRadiusKm: number;
  pending: boolean;
  onToggle: (next: boolean) => void;
  onClose: () => void;
};

export function AvailabilitySheet(props: AvailabilitySheetProps) {
  if (!props.isOpen) return null;
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
          boxShadow: "0 -8px 32px rgba(15,23,42,0.18)",
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

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 0",
            borderBottom: "1px solid var(--k-border-subtle)",
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>
              Disponibilité
            </div>
            <div style={{ fontSize: 12, color: "var(--k-text-muted)", marginTop: 2 }}>
              {props.isAvailable
                ? "Tu apparais dans les recherches."
                : "Tu n'apparais pas dans les recherches."}
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={props.isAvailable}
            disabled={props.pending}
            onClick={() => props.onToggle(!props.isAvailable)}
            style={{
              width: 44,
              height: 26,
              borderRadius: 999,
              background: props.isAvailable ? "var(--k-success)" : "var(--k-border-strong)",
              border: 0,
              position: "relative",
              cursor: props.pending ? "wait" : "pointer",
              opacity: props.pending ? 0.6 : 1,
              transition: "background 160ms var(--k-ease-std)",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 3,
                left: props.isAvailable ? 21 : 3,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                transition: "left 160ms var(--k-ease-std)",
              }}
            />
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 0",
          }}
        >
          <I.mapPin size={16} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{props.zoneCity}</div>
            <div style={{ fontSize: 11, color: "var(--k-text-muted)" }}>
              Rayon · {props.zoneRadiusKm} km
            </div>
          </div>
          <a
            href="/pro/onboarding?step=zones"
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--k-text-primary)",
              padding: "6px 10px",
              background: "#F1F5F9",
              borderRadius: "var(--k-r-md)",
              textDecoration: "none",
            }}
          >
            Modifier →
          </a>
        </div>
      </div>
    </div>
  );
}
