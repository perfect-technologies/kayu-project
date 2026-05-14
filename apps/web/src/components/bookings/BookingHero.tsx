// apps/web/src/components/bookings/BookingHero.tsx
"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { I } from "@kayu/ui/web";
import {
  formatWhen,
  initialsFromName,
  toV2Status,
  type V2Status,
} from "@/lib/booking-v2";

export type HeroCounterparty = {
  first: string;
  last: string;
  role: string;
  verified: boolean;
  rating: number | null | undefined;
  reviews: number | null | undefined;
};

export type HeroBooking = {
  id: string;
  title: string;
  status: string;
  scheduledDate?: string | Date | null;
  price?: number | null;
  isPaid?: boolean | null;
  cancelledBy?: string | null;
  cancelReason?: string | null;
  progress?: string | null;
};

type ChipTone = "warning" | "success" | "neutral" | "danger";

function HeroChip({
  tone,
  label,
  pulse,
}: {
  tone: ChipTone;
  label: string;
  pulse?: boolean;
}) {
  const map: Record<
    ChipTone,
    { bg: string; color: string; dot: string }
  > = {
    warning: {
      bg: "var(--k-warning-subtle)",
      color: "#92400E",
      dot: "var(--k-warning)",
    },
    success: {
      bg: "var(--k-success-subtle)",
      color: "#047857",
      dot: "var(--k-success)",
    },
    neutral: { bg: "#F1F5F9", color: "var(--k-text-body)", dot: "transparent" },
    danger: {
      bg: "var(--k-danger-subtle)",
      color: "#9F1239",
      dot: "var(--k-danger)",
    },
  };
  const c = map[tone];
  return (
    <span
      className="k-chip k-chip-sm"
      style={{
        background: c.bg,
        color: c.color,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontWeight: 600,
      }}
    >
      {pulse && (
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: c.dot,
            animation: "kPulse 1.6s ease-in-out infinite",
          }}
        />
      )}
      {label}
    </span>
  );
}

function chipForStatus(v2: V2Status, backend: string): {
  tone: ChipTone;
  label: string;
  pulse: boolean;
} {
  if (v2 === "upcoming" && backend === "PENDING")
    return { tone: "warning", label: "En attente", pulse: false };
  if (v2 === "upcoming" && backend === "CONFIRMED")
    return { tone: "success", label: "Confirmée", pulse: true };
  if (v2 === "upcoming" && backend === "IN_PROGRESS")
    return { tone: "success", label: "En cours", pulse: true };
  if (v2 === "active") return { tone: "success", label: "En cours", pulse: true };
  if (v2 === "completed") return { tone: "neutral", label: "Terminée", pulse: false };
  return { tone: "danger", label: "Annulée", pulse: false };
}

function durationLabel(duration: number | null | undefined): string {
  if (duration == null) return "Durée à confirmer";
  if (duration <= 60) return "≈ 1 h";
  if (duration <= 120) return "≈ 2 h";
  if (duration <= 240) return "½ jour";
  return "Journée";
}

function buildSubLine(
  booking: HeroBooking,
  isMobile: boolean,
  duration: number | null | undefined,
): string {
  const v2 = toV2Status(booking.status);
  const parts: string[] = [booking.title || "Mission"];
  if (v2 === "upcoming" || v2 === "active" || v2 === "completed")
    parts.push(durationLabel(duration));
  if (isMobile && booking.price != null)
    parts.push(`${booking.price.toLocaleString("fr-FR")} FC`);
  return parts.join(" · ");
}

function StateStrip({
  booking,
  isClient,
  firstName,
}: {
  booking: HeroBooking;
  isClient: boolean;
  firstName: string;
}) {
  const v2 = toV2Status(booking.status);
  const wrap = (
    bg: string,
    border: string | null,
    color: string,
    children: React.ReactNode,
  ) => (
    <div
      style={{
        marginTop: 12,
        padding: "10px 12px",
        background: bg,
        border: border ? `1px solid ${border}` : "none",
        borderRadius: 10,
        fontSize: 12.5,
        color,
        lineHeight: 1.45,
        fontWeight: 500,
      }}
    >
      {children}
    </div>
  );

  if (booking.status === "PENDING") {
    return wrap(
      "#FFFBEB",
      "#FDE68A",
      "#92400E",
      isClient
        ? `${firstName || "Le pro"} n'a pas encore confirmé. Réponse habituelle en moins de 2 h.`
        : "Nouvelle demande. Confirme ou enregistre l'accord pour valider.",
    );
  }
  if (booking.status === "IN_PROGRESS" && booking.progress) {
    return wrap("#F0FDF4", "#BBF7D0", "#047857", booking.progress);
  }
  if (v2 === "completed") {
    if (!isClient && !booking.isPaid) {
      return wrap("#FFFBEB", "#FDE68A", "#92400E", "Paiement à confirmer.");
    }
    if (booking.isPaid && booking.price != null) {
      return wrap(
        "#F1F5F9",
        null,
        "var(--k-text-body)",
        `Payé en espèces · ${booking.price.toLocaleString("fr-FR")} FC`,
      );
    }
  }
  if (v2 === "cancelled") {
    const who =
      booking.cancelledBy === "provider"
        ? isClient
          ? firstName || "le pro"
          : "vous"
        : booking.cancelledBy === "client"
          ? isClient
            ? "vous"
            : "le client"
          : null;
    const reason = booking.cancelReason ? ` · « ${booking.cancelReason} »` : "";
    return wrap(
      "var(--k-danger-subtle)",
      "#FBD0D7",
      "#9F1239",
      who ? `Annulée par ${who}${reason}` : `Annulée${reason}`,
    );
  }
  return null;
}

export function BookingHero({
  booking,
  duration,
  counterparty,
  isClient,
  isDesktop,
  onMessage,
}: {
  booking: HeroBooking;
  duration: number | null | undefined;
  counterparty: HeroCounterparty;
  isClient: boolean;
  isDesktop: boolean;
  onMessage: () => void;
}) {
  const v2 = toV2Status(booking.status);
  const chip = chipForStatus(v2, booking.status);
  const isCancelled = v2 === "cancelled";
  const ref = booking.id.slice(0, 8).toUpperCase();
  const whenLabel = formatWhen(booking.scheduledDate);
  const subLine = buildSubLine(booking, !isDesktop, duration);
  const firstName = counterparty.first;
  const fullName =
    `${counterparty.first} ${counterparty.last}`.trim() || "—";
  const priceLabel = (() => {
    if (v2 === "completed") return booking.isPaid ? "Payé" : "À régler";
    if (v2 === "cancelled") return "Annulée";
    if (booking.status === "PENDING") return "Estimation";
    return "Prix convenu";
  })();

  return (
    <section
      style={{
        background: "var(--k-surface)",
        border: `1px solid ${isCancelled ? "#FBD0D7" : "var(--k-border)"}`,
        borderRadius: "var(--k-r-lg)",
        padding: isDesktop ? 22 : 18,
      }}
    >
      {/* ribbon + when + sub + (desktop) price */}
      <div
        style={
          isDesktop
            ? {
                display: "flex",
                gap: 24,
                justifyContent: "space-between",
                alignItems: "flex-end",
              }
            : undefined
        }
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
              color: "var(--k-text-subtle)",
              fontFamily: "var(--k-font-mono)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <HeroChip tone={chip.tone} label={chip.label} pulse={chip.pulse} />
            <span>#{ref}</span>
          </div>
          <h1
            style={{
              fontFamily: "var(--k-font-display)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--k-text-primary)",
              margin: "12px 0 0",
              lineHeight: 1.1,
              fontSize: isDesktop ? 32 : 26,
              textDecoration: isCancelled ? "line-through" : "none",
              textDecorationThickness: 1,
            }}
          >
            {whenLabel}
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "var(--k-text-body)",
              margin: "6px 0 0",
            }}
          >
            {subLine}
          </p>
        </div>
        {isDesktop && booking.price != null && v2 !== "cancelled" && (
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div
              className="k-overline"
              style={{ fontFamily: "var(--k-font-mono)" }}
            >
              {priceLabel}
            </div>
            <div
              style={{
                fontFamily: "var(--k-font-display)",
                fontWeight: 700,
                fontSize: 28,
                letterSpacing: "-0.02em",
                color: "var(--k-text-primary)",
                marginTop: 3,
              }}
            >
              {booking.price.toLocaleString("fr-FR")} FC
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: "var(--k-text-muted)",
                marginTop: 3,
              }}
            >
              Espèces à la fin
            </div>
          </div>
        )}
      </div>

      <StateStrip booking={booking} isClient={isClient} firstName={firstName} />

      {/* counterparty */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginTop: 14,
          paddingTop: 14,
          borderTop: "1px solid var(--k-border-subtle)",
        }}
      >
        <Avatar style={{ width: isDesktop ? 42 : 38, height: isDesktop ? 42 : 38 }}>
          <AvatarFallback
            style={{
              background: "var(--k-primary)",
              color: "#fff",
              fontWeight: 600,
              fontSize: isDesktop ? 14 : 13,
            }}
          >
            {initialsFromName(counterparty.first, counterparty.last)}
          </AvatarFallback>
        </Avatar>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--k-font-display)",
              fontWeight: 600,
              fontSize: isDesktop ? 15 : 14,
              color: "var(--k-text-primary)",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            {fullName}
            {counterparty.verified && (
              <I.badgeCheck size={13} strokeColor="var(--k-success)" />
            )}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--k-text-muted)",
              marginTop: 1,
            }}
          >
            {counterparty.role}
            {counterparty.rating != null && (
              <>
                {" · "}
                <I.star size={11} strokeColor="var(--k-warning)" />{" "}
                <strong style={{ color: "var(--k-text-primary)" }}>
                  {counterparty.rating.toFixed(1)}
                </strong>
                {counterparty.reviews != null && ` (${counterparty.reviews} avis)`}
              </>
            )}
          </div>
        </div>
        <button
          onClick={onMessage}
          className="k-btn k-btn-secondary k-btn-sm"
          style={{ flexShrink: 0 }}
        >
          <I.messageCircle size={13} /> Message
        </button>
      </div>
    </section>
  );
}
