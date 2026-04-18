"use client";

import type { V2Status } from "@/lib/booking-v2";

export function BookingStatusChip({ status }: { status: V2Status }) {
  if (status === "upcoming") {
    return <span className="k-chip k-chip-sm k-chip-primary">À venir</span>;
  }
  if (status === "active") {
    return (
      <span className="k-chip k-chip-sm k-chip-success">
        <span
          aria-hidden
          className="k-auth-pulse"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--k-success)",
            display: "inline-block",
            animation: "kPulse 1.6s ease-in-out infinite",
          }}
        />
        En cours
      </span>
    );
  }
  if (status === "completed") {
    return (
      <span
        className="k-chip k-chip-sm"
        style={{ background: "var(--k-surface-muted)", color: "var(--k-text-body)" }}
      >
        Terminée
      </span>
    );
  }
  return (
    <span
      className="k-chip k-chip-sm"
      style={{ background: "var(--k-danger-subtle)", color: "#BE123C" }}
    >
      Annulée
    </span>
  );
}
