// apps/web/src/components/bookings/AddressRow.tsx
"use client";

import { I } from "@kayu/ui/web";
import { fullAddress } from "@/lib/booking-v2";

type AddressBooking = {
  address?: string | null;
  city?: string | null;
  clientNotes?: string | null;
};

export function AddressRow({
  booking,
  perspective,
}: {
  booking: AddressBooking;
  perspective: "client" | "pro";
}) {
  const isClient = perspective === "client";
  const street = (booking.address ?? "").trim();
  const city = (booking.city ?? "").trim();
  const note = (booking.clientNotes ?? "").trim();
  const hasAddress = !!street || !!city;
  const compoundAddress = fullAddress(booking);
  const mapsHref = hasAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(compoundAddress)}`
    : null;

  return (
    <section
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-lg)",
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 12,
          gap: 8,
        }}
      >
        <h3
          className="k-heading"
          style={{ margin: 0, fontSize: 14.5, fontWeight: 600 }}
        >
          {isClient ? "Adresse d'intervention" : "Adresse client"}
        </h3>
        {city && (
          <span
            className="k-overline"
            style={{ fontFamily: "var(--k-font-mono)" }}
          >
            {city}
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "var(--k-r-md)",
            background: "#F1F5F9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: "var(--k-text-muted)",
          }}
        >
          <I.mapPin size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 500,
              color: "var(--k-text-primary)",
              lineHeight: 1.4,
            }}
          >
            {hasAddress ? street || city : "Adresse à confirmer"}
          </div>
          {hasAddress && street && city && !street.includes(city) && (
            <div
              style={{
                fontSize: 11.5,
                color: "var(--k-text-muted)",
                marginTop: 2,
              }}
            >
              {city}, Kinshasa
            </div>
          )}
          {note && (
            <div
              style={{
                marginTop: 6,
                padding: "8px 10px",
                background: "#F8FAFC",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--k-text-body)",
              }}
            >
              {note}
            </div>
          )}
        </div>
        {mapsHref && (
          <a
            href={mapsHref}
            target="_blank"
            rel="noreferrer noopener"
            style={{
              alignSelf: "center",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--k-text-primary)",
              border: "1px solid var(--k-border)",
              borderRadius: "var(--k-r-md)",
              padding: "8px 10px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Itinéraire <I.arrowUpRight size={12} />
          </a>
        )}
      </div>
    </section>
  );
}
