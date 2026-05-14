"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { bookingsApi, providersApi, queryKeys } from "@kayu/api";
import { HeroStatusChip } from "./HeroStatusChip";
import { RefuseReasonSheet } from "./RefuseReasonSheet";
import {
  type ProviderDashboardData,
  type HeroVariant,
  dayLongFR,
  formatRelativeShort,
  formatShortMoney,
  pickHeroBookingId,
  pickHeroVariant,
  timeOfDayFR,
} from "./providerDashboardHelpers";

export type DashboardHeroProps = {
  data: ProviderDashboardData;
};

export function DashboardHero({ data }: DashboardHeroProps) {
  const variant: HeroVariant = useMemo(() => pickHeroVariant(data), [data]);
  const heroBookingId = useMemo(() => pickHeroBookingId(data, variant), [data, variant]);

  switch (variant) {
    case "onboarding":
      return <OnboardingHero data={data} />;
    case "pending_request":
      return <PendingHero data={data} bookingId={heroBookingId!} />;
    case "in_progress":
      return <InProgressHero data={data} bookingId={heroBookingId!} />;
    case "next_today":
    case "next_upcoming":
      return <NextHero data={data} bookingId={heroBookingId!} variant={variant} />;
    case "unavailable":
      return <UnavailableHero data={data} />;
    case "calm":
      return <CalmHero data={data} />;
    case "empty":
      return <EmptyHero data={data} />;
  }
}

const HERO_SHELL: React.CSSProperties = {
  background: "var(--k-surface)",
  border: "1px solid var(--k-border)",
  borderRadius: "var(--k-r-lg)",
  padding: 16,
  marginBottom: 14,
};

function OnboardingHero({ data }: { data: ProviderDashboardData }) {
  const router = useRouter();
  const currentStep = data.onboarding.currentStep ?? 0;
  const totalSteps = data.onboarding.totalSteps || 6;
  const pct = Math.min(100, Math.round(((currentStep + 1) / totalSteps) * 100));

  return (
    <section style={HERO_SHELL} className="k-pd-hero">
      <HeroStatusChip variant="welcome" label={`PROFIL INCOMPLET · ÉTAPE ${currentStep + 1}/${totalSteps}`} />
      <h2
        style={{
          margin: "10px 0 6px",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: "-0.02em",
        }}
      >
        Termine ton inscription.
      </h2>
      <p style={{ margin: 0, fontSize: 12.5, color: "var(--k-text-body)" }}>
        Tu n&apos;apparaîtras dans les recherches qu&apos;une fois ton profil publié.
      </p>
      <div
        style={{
          height: 6,
          borderRadius: 999,
          background: "#FEF3C7",
          margin: "14px 0 14px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "#F59E0B",
            transition: "width 200ms var(--k-ease-std)",
          }}
        />
      </div>
      <button
        type="button"
        onClick={() => router.push("/pro/onboarding")}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: 8,
          border: 0,
          background: "var(--k-text-primary)",
          color: "white",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Continuer l&apos;inscription →
      </button>
    </section>
  );
}

function PendingHero({ data, bookingId }: { data: ProviderDashboardData; bookingId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refuseOpen, setRefuseOpen] = useState(false);

  const booking = (data.bookingRequests ?? []).find((b) => b.id === bookingId);

  const mutation = useMutation({
    mutationFn: ({ status, cancelReason }: { status: "CONFIRMED" | "CANCELLED"; cancelReason?: string }) =>
      bookingsApi(apiClient).update(bookingId, { status, cancelReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.provider });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(bookingId) });
      setRefuseOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "La réservation n'a pas pu être mise à jour.");
    },
  });

  if (!booking) return null;

  const clientName = booking.client?.name ?? "Client";
  const clientId = booking.client?.id ?? booking.clientId ?? "";
  const commune = booking.city ?? booking.address ?? "";
  const priceLabel = booking.price ? `${booking.price.toLocaleString("fr-FR")} FC` : "Prix à convenir";
  const dur = booking.duration
    ? `${Math.floor(booking.duration / 60)}h${booking.duration % 60 ? booking.duration % 60 : ""}`
    : "Durée à confirmer";
  const whenLabel = formatWhenLabel(booking.scheduledDate);
  const requestedRel = booking.createdAt ? formatRelativeShort(booking.createdAt) : "récemment";
  const preview = (booking.description ?? booking.clientNotes ?? "").trim();

  return (
    <section style={HERO_SHELL} className="k-pd-hero k-pd-hero--pending">
      <HeroStatusChip variant="pending" label={`À CONFIRMER · ${requestedRel.toUpperCase()}`} />
      <h2
        style={{
          margin: "10px 0 4px",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: "-0.02em",
        }}
      >
        {whenLabel}
      </h2>
      <p style={{ margin: 0, fontSize: 12.5, color: "var(--k-text-body)" }}>
        {booking.title} · {dur} · {commune} · {priceLabel}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px solid var(--k-border-subtle)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#0EA5E9",
            color: "white",
            display: "grid",
            placeItems: "center",
            fontSize: 11,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {initialsFor(clientName)}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{clientName}</div>
          {preview && (
            <div
              style={{
                fontSize: 11,
                color: "var(--k-text-muted)",
                marginTop: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              «&nbsp;{preview.slice(0, 80)}
              {preview.length > 80 ? "…" : ""}&nbsp;»
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          type="button"
          onClick={() =>
            clientId
              ? router.push(
                  `/messages?recipientId=${encodeURIComponent(clientId)}&recipientName=${encodeURIComponent(clientName)}`,
                )
              : router.push("/messages")
          }
          style={{
            flex: 1,
            padding: "9px 12px",
            border: "1px solid var(--k-border)",
            background: "var(--k-surface)",
            borderRadius: 8,
            fontSize: 12.5,
            cursor: "pointer",
          }}
        >
          Message
        </button>
        <button
          type="button"
          onClick={() => setRefuseOpen(true)}
          disabled={mutation.isPending}
          style={{
            flex: 1,
            padding: "9px 12px",
            border: "1px solid var(--k-border)",
            background: "var(--k-surface)",
            borderRadius: 8,
            fontSize: 12.5,
            cursor: "pointer",
          }}
        >
          Refuser
        </button>
        <button
          type="button"
          onClick={() => mutation.mutate({ status: "CONFIRMED" })}
          disabled={mutation.isPending}
          style={{
            flex: 1.4,
            padding: "9px 12px",
            background: "var(--k-success)",
            color: "white",
            border: 0,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: mutation.isPending ? "wait" : "pointer",
          }}
        >
          {mutation.isPending && mutation.variables?.status === "CONFIRMED" ? "Envoi…" : "Accepter ✓"}
        </button>
      </div>

      <RefuseReasonSheet
        isOpen={refuseOpen}
        pending={mutation.isPending}
        onConfirm={(reason) => mutation.mutate({ status: "CANCELLED", cancelReason: reason })}
        onClose={() => setRefuseOpen(false)}
      />
    </section>
  );
}

function InProgressHero({ data, bookingId }: { data: ProviderDashboardData; bookingId: string }) {
  const router = useRouter();
  const booking = (data.upcomingBookings ?? []).find((b) => b.id === bookingId);
  if (!booking) return null;

  const clientName = booking.client?.name ?? "Client";
  const clientId = booking.client?.id ?? booking.clientId ?? "";
  const address = [booking.address, booking.city].filter(Boolean).join(", ");
  const priceLabel = booking.price ? `${booking.price.toLocaleString("fr-FR")} FC` : "Prix à convenir";
  const dur = booking.duration
    ? `${Math.floor(booking.duration / 60)}h${booking.duration % 60 ? booking.duration % 60 : ""}`
    : null;
  const startedTime = booking.startedAt
    ? timeOfDayFR(booking.startedAt)
    : booking.scheduledDate
      ? timeOfDayFR(booking.scheduledDate)
      : "";

  return (
    <section style={HERO_SHELL} className="k-pd-hero k-pd-hero--live">
      <HeroStatusChip variant="live" label="EN COURS · CHEZ LE CLIENT" />
      <h2
        style={{
          margin: "10px 0 4px",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: "-0.02em",
        }}
      >
        Mission en cours
      </h2>
      <p style={{ margin: 0, fontSize: 12.5, color: "var(--k-text-body)" }}>
        {booking.title} · {clientName} · {address}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px solid var(--k-border-subtle)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#FB7185",
            color: "white",
            display: "grid",
            placeItems: "center",
            fontSize: 11,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {initialsFor(clientName)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            {clientName}
            {startedTime ? ` · démarrée à ${startedTime}` : ""}
          </div>
          <div style={{ fontSize: 11, color: "var(--k-text-muted)", marginTop: 2 }}>
            {dur ? `Estimée ${dur} · ` : ""}
            {priceLabel}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          type="button"
          onClick={() =>
            clientId
              ? router.push(
                  `/messages?recipientId=${encodeURIComponent(clientId)}&recipientName=${encodeURIComponent(clientName)}`,
                )
              : router.push("/messages")
          }
          style={{
            flex: 1,
            padding: "9px 12px",
            border: "1px solid var(--k-border)",
            background: "var(--k-surface)",
            borderRadius: 8,
            fontSize: 12.5,
            cursor: "pointer",
          }}
        >
          Message
        </button>
        <button
          type="button"
          onClick={() => router.push(`/bookings/${booking.id}`)}
          style={{
            flex: 1.4,
            padding: "9px 12px",
            background: "var(--k-text-primary)",
            color: "white",
            border: 0,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Terminer la mission →
        </button>
      </div>
    </section>
  );
}

function NextHero({
  data,
  bookingId,
  variant,
}: {
  data: ProviderDashboardData;
  bookingId: string;
  variant: "next_today" | "next_upcoming";
}) {
  const router = useRouter();
  const booking = (data.upcomingBookings ?? []).find((b) => b.id === bookingId);
  if (!booking || !booking.scheduledDate) return null;

  const clientName = booking.client?.name ?? "Client";
  const clientId = booking.client?.id ?? booking.clientId ?? "";
  const commune = booking.city ?? booking.address ?? "";
  const priceLabel = booking.price ? `${booking.price.toLocaleString("fr-FR")} FC` : "Prix à convenir";
  const dur = booking.duration
    ? `${Math.floor(booking.duration / 60)}h${booking.duration % 60 ? booking.duration % 60 : ""}`
    : "Durée à confirmer";

  const scheduled = new Date(booking.scheduledDate);
  const now = new Date();
  const proximityLabel = (() => {
    if (variant === "next_today") {
      const diffMin = Math.max(0, Math.round((scheduled.getTime() - now.getTime()) / 60_000));
      if (diffMin < 60) return `DANS ${diffMin} MIN`;
      const diffH = Math.floor(diffMin / 60);
      return diffH < 6 ? `DANS ${diffH}H${diffMin % 60 ? Math.round(diffMin % 60) : ""}` : "AUJOURD'HUI";
    }
    const oneDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.round((scheduled.getTime() - now.getTime()) / oneDay);
    if (diffDays <= 1) return "DEMAIN";
    if (diffDays <= 7) return dayLongFR(scheduled).toUpperCase();
    return "";
  })();

  const chipLabel = proximityLabel ? `CONFIRMÉE · ${proximityLabel}` : "CONFIRMÉE";
  const whenLabel = formatWhenLabel(booking.scheduledDate);

  return (
    <section style={HERO_SHELL} className="k-pd-hero k-pd-hero--confirmed">
      <HeroStatusChip variant="confirmed" label={chipLabel} />
      <h2
        style={{
          margin: "10px 0 4px",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: "-0.02em",
        }}
      >
        {whenLabel}
      </h2>
      <p style={{ margin: 0, fontSize: 12.5, color: "var(--k-text-body)" }}>
        {booking.title} · {dur} · {commune} · {priceLabel}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px solid var(--k-border-subtle)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#0EA5E9",
            color: "white",
            display: "grid",
            placeItems: "center",
            fontSize: 11,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {initialsFor(clientName)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{clientName}</div>
          <div style={{ fontSize: 11, color: "var(--k-text-muted)", marginTop: 2 }}>{priceLabel}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          type="button"
          onClick={() =>
            clientId
              ? router.push(
                  `/messages?recipientId=${encodeURIComponent(clientId)}&recipientName=${encodeURIComponent(clientName)}`,
                )
              : router.push("/messages")
          }
          style={{
            flex: 1,
            padding: "9px 12px",
            border: "1px solid var(--k-border)",
            background: "var(--k-surface)",
            borderRadius: 8,
            fontSize: 12.5,
            cursor: "pointer",
          }}
        >
          Message
        </button>
        <button
          type="button"
          onClick={() => router.push(`/bookings/${booking.id}`)}
          style={{
            flex: 1.4,
            padding: "9px 12px",
            background: "var(--k-text-primary)",
            color: "white",
            border: 0,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Voir la mission →
        </button>
      </div>
    </section>
  );
}

function UnavailableHero({ data }: { data: ProviderDashboardData }) {
  const queryClient = useQueryClient();
  const zoneCity = data.availability.zoneCity ?? "Kinshasa";

  const mutation = useMutation({
    mutationFn: () => providersApi(apiClient).updateAvailability({ isAvailable: true }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard.provider });
      const prev = queryClient.getQueryData(queryKeys.dashboard.provider);
      queryClient.setQueryData(queryKeys.dashboard.provider, (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        const o = old as ProviderDashboardData;
        return {
          ...o,
          availability: { ...o.availability, isAvailable: true },
          provider: { ...o.provider, isAvailable: true },
        };
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKeys.dashboard.provider, ctx.prev);
      toast.error("Impossible de mettre à jour ta disponibilité.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.provider });
    },
  });

  return (
    <section style={HERO_SHELL} className="k-pd-hero k-pd-hero--unavailable">
      <HeroStatusChip variant="neutral" label="INDISPONIBLE" />
      <h2
        style={{
          margin: "10px 0 6px",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: "-0.02em",
        }}
      >
        Tu es invisible aux clients.
      </h2>
      <p style={{ margin: 0, fontSize: 12.5, color: "var(--k-text-body)" }}>
        Réactive ta disponibilité pour recevoir des demandes à {zoneCity} et autour.
      </p>
      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        style={{
          width: "100%",
          marginTop: 14,
          padding: "10px 14px",
          background: "var(--k-success)",
          color: "white",
          border: 0,
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: mutation.isPending ? "wait" : "pointer",
        }}
      >
        {mutation.isPending ? "Mise à jour…" : "Redevenir disponible"}
      </button>
    </section>
  );
}

function CalmHero({ data }: { data: ProviderDashboardData }) {
  const router = useRouter();
  const revenueLabel = formatShortMoney(data.stats.revenue.value);
  const missions = data.stats.missions.value;
  const periodLabel = data.stats.period === "week" ? "cette semaine" : "ce mois-ci";

  const onShare = async () => {
    const providerId = data.provider.id;
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/providers/${providerId}`;
    if (typeof navigator !== "undefined" && "share" in navigator && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Mon profil KAYOU", url });
        return;
      } catch {
        // user cancelled — fall through to clipboard
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié");
    }
  };

  return (
    <section style={HERO_SHELL} className="k-pd-hero k-pd-hero--calm">
      <HeroStatusChip variant="neutral" label="AUCUNE MISSION PRÉVUE" />
      <h2
        style={{
          margin: "10px 0 6px",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: "-0.02em",
        }}
      >
        Journée libre.
      </h2>
      <p style={{ margin: 0, fontSize: 12.5, color: "var(--k-text-body)" }}>
        {missions} mission{missions === 1 ? "" : "s"} {periodLabel} · {revenueLabel}. Partage ton profil pour des
        demandes supplémentaires.
      </p>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button
          type="button"
          onClick={() => router.push("/pro/earnings")}
          style={{
            flex: 1,
            padding: "9px 12px",
            border: "1px solid var(--k-border)",
            background: "var(--k-surface)",
            borderRadius: 8,
            fontSize: 12.5,
            cursor: "pointer",
          }}
        >
          Voir mes revenus
        </button>
        <button
          type="button"
          onClick={onShare}
          style={{
            flex: 1.2,
            padding: "9px 12px",
            background: "var(--k-text-primary)",
            color: "white",
            border: 0,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Partager mon profil →
        </button>
      </div>
    </section>
  );
}

function EmptyHero({ data }: { data: ProviderDashboardData }) {
  const primaryCategory = data.provider.categories?.[0] ?? "ton service";
  const zoneCity = data.availability.zoneCity ?? "Kinshasa";

  const onShare = async () => {
    const providerId = data.provider.id;
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/providers/${providerId}`;
    if (typeof navigator !== "undefined" && "share" in navigator && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Mon profil KAYOU", url });
        return;
      } catch {
        // fall through
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié");
    }
  };

  return (
    <section style={HERO_SHELL} className="k-pd-hero k-pd-hero--empty">
      <HeroStatusChip variant="welcome" label="BIENVENUE" />
      <h2
        style={{
          margin: "10px 0 6px",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: "-0.02em",
        }}
      >
        Ton profil est en ligne.
      </h2>
      <p style={{ margin: 0, fontSize: 12.5, color: "var(--k-text-body)" }}>
        Tu apparais dans les recherches «&nbsp;{primaryCategory} · {zoneCity}&nbsp;». Ta première demande arrivera
        bientôt.
      </p>
      <ul
        style={{
          margin: "12px 0 0 0",
          padding: "0 0 0 18px",
          fontSize: 12,
          color: "var(--k-text-body)",
          lineHeight: 1.5,
        }}
      >
        <li>Réponds en moins de 2 h pour booster ta visibilité</li>
        <li>Ajoute des photos de tes réalisations</li>
      </ul>
      <button
        type="button"
        onClick={onShare}
        style={{
          width: "100%",
          marginTop: 14,
          padding: "10px 14px",
          background: "var(--k-text-primary)",
          color: "white",
          border: 0,
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Partager mon profil
      </button>
    </section>
  );
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

function formatWhenLabel(value: Date | string | null | undefined): string {
  if (!value) return "Date à confirmer";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Date à confirmer";
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const time = timeOfDayFR(date);
  if (sameDay(date, today)) return `Aujourd'hui · ${time}`;
  if (sameDay(date, tomorrow)) {
    const dayLong = dayLongFR(date);
    return `Demain, ${dayLong} ${date.getDate()} · ${time}`;
  }
  const long = date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  return `${long.charAt(0).toUpperCase()}${long.slice(1)} · ${time}`;
}
