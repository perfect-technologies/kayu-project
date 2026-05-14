import Link from "next/link";
import type { CSSProperties } from "react";
import type { DashboardClientResponse, ClientDashboardUpcomingBooking } from "@kayu/schemas";
import { I } from "@kayu/ui/web";
import { formatMoneyFc } from "@kayu/ui";
import { HeroStatusChip, type HeroStatusVariant } from "./HeroStatusChip";
import { CalmProviderPills } from "./CalmProviderPills";
import { CategoryTilesRow } from "./CategoryTilesRow";
import {
  pickHeroVariant,
  pickHeroBooking,
  chipLabelForConfirmed,
  formatRelativeShort,
  type HeroVariant,
} from "./dashboardHelpers";

const HERO_SHELL: CSSProperties = {
  background: "var(--k-surface)",
  border: "1px solid var(--k-border)",
  borderRadius: 14,
  padding: 18,
  marginBottom: 14,
};

const HEADLINE: CSSProperties = {
  fontFamily: "var(--k-font-display)",
  fontWeight: 700,
  fontSize: 22,
  letterSpacing: "-0.02em",
  color: "var(--k-text-primary)",
  lineHeight: 1.15,
  margin: 0,
};

const SUB: CSSProperties = {
  fontSize: 13,
  color: "var(--k-text-body)",
  marginTop: 4,
  marginBottom: 0,
  lineHeight: 1.45,
};

function durationLabel(min: number | null): string {
  if (min == null) return "Durée à confirmer";
  if (min <= 60) return "≈ 1 h";
  if (min <= 120) return "≈ 2 h";
  if (min <= 240) return "½ jour";
  return "Journée";
}

function whenLabel(b: ClientDashboardUpcomingBooking, variant: HeroVariant): string {
  const d = new Date(b.scheduledDate);
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (variant === "in_progress") return `En ce moment · ${time}`;
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (isSameDay(d, today)) return `Aujourd'hui · ${time}`;
  if (isSameDay(d, tomorrow))
    return `Demain · ${d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} · ${time}`;
  return `${d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} · ${time}`;
}

export function DashboardHero({ data }: { data: DashboardClientResponse }) {
  const variant = pickHeroVariant(data);
  const booking = pickHeroBooking(data, variant);

  if (variant === "empty") return <EmptyHero />;
  if (variant === "calm")
    return <CalmHero providers={data.providers} lastCompletedAt={data.completed[0]?.completedAt ?? null} />;
  if (!booking) return null;
  return <BookingHero variant={variant} booking={booking} />;
}

function BookingHero({ variant, booking }: { variant: HeroVariant; booking: ClientDashboardUpcomingBooking }) {
  const isPending = variant === "upcoming_pending";
  const isLive = variant === "in_progress";
  const chipVariant: HeroStatusVariant = isPending ? "pending" : isLive ? "live" : "confirmed";
  const chipLabel = isPending
    ? "EN ATTENTE"
    : isLive
    ? "EN COURS"
    : chipLabelForConfirmed(booking.scheduledDate);
  const showInfoStripConfirmed = variant === "upcoming_confirmed" && booking.hasOffer;
  const subParts = [booking.title, durationLabel(booking.durationMinutes), booking.commune].filter(Boolean);

  return (
    <section style={HERO_SHELL}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <HeroStatusChip variant={chipVariant} label={chipLabel} />
        <span style={{ fontFamily: "var(--k-font-mono)", fontSize: 10.5, color: "var(--k-text-subtle)" }}>
          #{booking.ref}
        </span>
      </div>
      <h2 style={HEADLINE}>{whenLabel(booking, variant)}</h2>
      <p style={SUB}>
        {subParts.join(" · ")} · {formatMoneyFc(booking.price)}
      </p>

      {isPending && (
        <div
          style={{
            marginTop: 12,
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 12,
            color: "#92400E",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <I.clock size={14} aria-hidden />
          {booking.provider.firstName} n'a pas encore confirmé. Réponse habituelle en moins de 2 h.
        </div>
      )}
      {showInfoStripConfirmed && (
        <div
          style={{
            marginTop: 12,
            background: "#F8FAFC",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 12,
            color: "var(--k-text-body)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--k-text-subtle)" }} aria-hidden />
          Accord enregistré · espèces à la fin de la mission.
        </div>
      )}

      <WhoRow
        firstName={booking.provider.firstName}
        lastName={booking.provider.lastName}
        profession={booking.provider.profession}
        rating={booking.provider.rating}
        verified={booking.provider.verified}
      />

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <Link
          href={`/messages?provider=${booking.provider.id}`}
          className="k-btn k-btn-secondary"
          style={{ flex: 1, textAlign: "center" }}
        >
          Message
        </Link>
        <Link
          href={`/bookings/${booking.id}`}
          className="k-btn k-btn-primary"
          style={{ flex: 1.4, textAlign: "center" }}
        >
          Voir la réservation →
        </Link>
      </div>
    </section>
  );
}

function WhoRow({
  firstName,
  lastName,
  profession,
  rating,
  verified,
}: {
  firstName: string;
  lastName: string;
  profession: string;
  rating: number;
  verified: boolean;
}) {
  const initials = `${(firstName[0] ?? "").toUpperCase()}${(lastName[0] ?? "").toUpperCase()}`;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginTop: 14,
        paddingTop: 14,
        borderTop: "1px solid var(--k-border-subtle)",
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          background: "#FDE68A",
          color: "#92400E",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 14,
          fontFamily: "var(--k-font-display)",
        }}
      >
        {initials}
      </span>
      <div>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: "var(--k-text-primary)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {firstName} {lastName.slice(0, 1)}.
          {verified && <I.badgeCheck size={14} color="var(--k-success)" />}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--k-text-muted)", marginTop: 1 }}>
          {profession ? `Ta/Ton ${profession.toLowerCase()}` : ""}
          {rating > 0 ? ` · ★ ${rating.toFixed(1)}` : ""}
        </div>
      </div>
    </div>
  );
}

function CalmHero({
  providers,
  lastCompletedAt,
}: {
  providers: DashboardClientResponse["providers"];
  lastCompletedAt: string | null;
}) {
  const ago = lastCompletedAt ? formatRelativeShort(lastCompletedAt) : "récemment";
  return (
    <section style={HERO_SHELL}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <HeroStatusChip variant="neutral" label="AUCUNE RÉSERVATION ACTIVE" />
      </div>
      <h2 style={HEADLINE}>Rien de prévu pour l'instant.</h2>
      <p style={SUB}>
        Ta dernière mission s'est terminée {ago}. Réserve à nouveau ou retrouve un prestataire de confiance.
      </p>
      <CalmProviderPills providers={providers} />
      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        <Link href="/" className="k-btn k-btn-primary">
          Réserver un nouveau service →
        </Link>
        {providers.length > 0 && (
          <Link href="#tes-prestataires" className="k-btn k-btn-ghost">
            Voir mes prestataires
          </Link>
        )}
      </div>
    </section>
  );
}

function EmptyHero() {
  return (
    <section style={HERO_SHELL}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <HeroStatusChip variant="welcome" label="BIENVENUE" />
      </div>
      <h2 style={HEADLINE}>Réserve ton premier service.</h2>
      <p style={SUB}>
        Des prestataires vérifiés à Kinshasa et Brazzaville. Tu paies en espèces à la fin de la mission, pas avant.
      </p>
      <CategoryTilesRow />
      <div style={{ marginTop: 16 }}>
        <Link href="/" className="k-btn k-btn-primary">
          Découvrir les prestataires →
        </Link>
      </div>
    </section>
  );
}
