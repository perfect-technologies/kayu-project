// apps/web/src/components/bookings/DetailsCard.tsx
"use client";

import { formatRelativeFR, paymentStatusLabel } from "@/lib/booking-v2";

type DetailsBooking = {
  id: string;
  createdAt?: string | Date | null;
  isPaid?: boolean | null;
  paymentMethod?: string | null;
  city?: string | null;
};

function Row({
  label,
  value,
  mono,
  first,
}: {
  label: string;
  value: string;
  mono?: boolean;
  first?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: first ? "0 0 7px" : "7px 0",
        borderTop: first ? "none" : "1px solid var(--k-border-subtle)",
        fontSize: 12.5,
      }}
    >
      <span style={{ color: "var(--k-text-muted)" }}>{label}</span>
      <span
        style={{
          color: "var(--k-text-primary)",
          fontWeight: 500,
          fontFamily: mono ? "var(--k-font-mono)" : "var(--k-font-body)",
          fontSize: mono ? 11.5 : 12.5,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function DetailsCard({
  booking,
  isClient,
}: {
  booking: DetailsBooking;
  isClient: boolean;
}) {
  return (
    <section
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-lg)",
        padding: "16px 18px",
      }}
    >
      <div className="k-overline" style={{ marginBottom: 10 }}>
        Détails
      </div>
      <Row
        label="Réservation"
        value={`#${booking.id.slice(0, 8).toUpperCase()}`}
        mono
        first
      />
      <Row label="Créée" value={formatRelativeFR(booking.createdAt)} />
      <Row label="Paiement" value={paymentStatusLabel(booking)} />
      {!isClient && <Row label="Zone" value={booking.city ?? "—"} />}
    </section>
  );
}
