// apps/web/src/components/bookings/StepStrip.tsx
"use client";

import type { V2Status } from "@/lib/booking-v2";

const STEPS_BY_V2: Record<V2Status, { key: string; label: string }[]> = {
  upcoming: [
    { key: "booked", label: "Réservée" },
    { key: "confirmed", label: "Confirmée" },
    { key: "done", label: "Terminée" },
    { key: "paid", label: "Payée" },
  ],
  active: [
    { key: "booked", label: "Réservée" },
    { key: "confirmed", label: "Confirmée" },
    { key: "done", label: "Terminée" },
    { key: "paid", label: "Payée" },
  ],
  completed: [
    { key: "booked", label: "Réservée" },
    { key: "confirmed", label: "Confirmée" },
    { key: "done", label: "Terminée" },
    { key: "paid", label: "Payée" },
  ],
  cancelled: [
    { key: "booked", label: "Réservée" },
    { key: "cancelled", label: "Annulée" },
  ],
};

export function getStepIndex(
  v2: V2Status,
  backend: string,
  isPaid: boolean,
): number {
  if (v2 === "upcoming") return backend === "PENDING" ? 0 : 1;
  if (v2 === "active") return 2;
  if (v2 === "completed") return isPaid ? 3 : 2;
  if (v2 === "cancelled") return 1;
  return 0;
}

export function StepStrip({
  v2Status,
  backendStatus,
  isPaid,
}: {
  v2Status: V2Status;
  backendStatus: string;
  isPaid: boolean;
}) {
  const steps = STEPS_BY_V2[v2Status];
  const step = getStepIndex(v2Status, backendStatus, isPaid);
  const isCancelled = v2Status === "cancelled";
  const railColor = isCancelled ? "var(--k-danger)" : "var(--k-success)";

  // Progress rail goes from first dot center to the centre of the highest
  // "done" dot. With N steps in a `repeat(N, 1fr)` grid, dot centres sit at
  // ((2i + 1) / (2N)) of the width. So the rail starts at 1/(2N) and extends
  // by (step) / N when step > 0.
  const N = steps.length;
  const startPct = (1 / (2 * N)) * 100;
  const railPct = step > 0 ? (step / N) * 100 : 0;

  return (
    <section
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-lg)",
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span className="k-overline">Suivi</span>
        <span
          style={{
            fontFamily: "var(--k-font-mono)",
            fontSize: 11.5,
            color: "var(--k-text-body)",
            fontWeight: 600,
          }}
        >
          {Math.min(step + 1, N)} / {N}
        </span>
      </div>
      <ol
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "grid",
          gridTemplateColumns: `repeat(${N}, 1fr)`,
          position: "relative",
        }}
      >
        {/* base rail */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: `${startPct}%`,
            right: `${startPct}%`,
            top: 6,
            height: 2,
            background: "var(--k-border)",
            zIndex: 0,
          }}
        />
        {/* progress rail */}
        {railPct > 0 && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: `${startPct}%`,
              width: `${railPct - startPct}%`,
              top: 6,
              height: 2,
              background: railColor,
              zIndex: 0,
            }}
          />
        )}
        {steps.map((s, i) => {
          const done = i < step;
          const current = i === step;
          let bg = "var(--k-surface)";
          let border = "2px solid var(--k-border)";
          let ring = "none";
          if (done) {
            bg = isCancelled && s.key === "cancelled" ? "var(--k-danger)" : "var(--k-success)";
            border = `2px solid ${bg}`;
          } else if (current) {
            bg = isCancelled ? "var(--k-danger)" : "var(--k-text-primary)";
            border = `2px solid ${bg}`;
            ring = `0 0 0 4px ${isCancelled ? "rgba(225,29,72,0.08)" : "rgba(15,23,42,0.08)"}`;
          }
          return (
            <li
              key={s.key}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                position: "relative",
                zIndex: 1,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: bg,
                  border,
                  boxShadow: ring,
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  color:
                    done || current ? "var(--k-text-primary)" : "var(--k-text-muted)",
                  fontWeight: 500,
                  textAlign: "center",
                }}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
