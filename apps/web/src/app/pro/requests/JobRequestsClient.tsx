"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CategorySlug } from "@kayu/ui";
import { I } from "@kayu/ui/web";
import {
  bookingsApi,
  jobRequestsApi,
  queryKeys,
} from "@kayu/api";
import type {
  JobRequestForPro,
  JobRequestsInboxResponse,
  BookingsResponse,
} from "@kayu/schemas";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ActiveJobsCard } from "@/components/pro/ActiveJobsCard";
import { InboundRequestCard } from "@/components/pro/InboundRequestCard";
import { initialsFromName } from "@/lib/booking-v2";
import type { ActiveJob, InboundRequest } from "@/components/pro/types";

const AVATAR_PALETTE = [
  "#FB7185",
  "#10B981",
  "#7C3AED",
  "#F59E0B",
  "#0EA5E9",
  "#BE123C",
  "#6366F1",
  "#14B8A6",
];

function bgForId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function formatReceivedAt(iso: string | Date | null): string {
  if (!iso) return "";
  const date = iso instanceof Date ? iso : new Date(iso);
  const diffMin = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

function describeExpiry(iso: string | Date | null): {
  label: string;
  minutes: number;
} {
  if (!iso) return { label: "pas de limite", minutes: 9999 };
  const date = iso instanceof Date ? iso : new Date(iso);
  const mins = Math.max(0, Math.floor((date.getTime() - Date.now()) / 60_000));
  if (mins <= 0) return { label: "expirée", minutes: 0 };
  if (mins < 60) return { label: `${mins} min`, minutes: mins };
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return {
    label: rest === 0 ? `${hours}h` : `${hours}h ${rest.toString().padStart(2, "0")}min`,
    minutes: mins,
  };
}

function mapInbound(req: JobRequestForPro): InboundRequest {
  const fullName =
    `${req.client.firstName ?? ""} ${req.client.lastName ?? ""}`.trim() ||
    "Client";
  const initials = initialsFromName(req.client.firstName, req.client.lastName);
  const expiry = describeExpiry(req.expiresAt);
  const slug = (req.category?.slug as CategorySlug | undefined) ?? "plomberie";

  return {
    id: req.id,
    client: {
      name: fullName,
      initials,
      bg: bgForId(req.clientId),
      rating: req.client.rating ?? null,
      jobs: req.client.jobs,
      newClient: req.client.newClient,
    },
    service: req.service,
    category: slug,
    when: req.whenPref,
    address: req.address,
    neighborhood: req.commune ?? req.city,
    distance: 0,
    estimatedHours: req.estimatedHours ?? 1,
    budget: req.budget ?? 0,
    description: req.description,
    photos: req.photoCount,
    receivedAt: formatReceivedAt(req.notifiedAt),
    expiresIn: expiry.label,
    expiresMinutes: expiry.minutes,
    competing: req.competingCount,
    matchScore: req.matchScore,
    urgent: req.urgent,
  };
}

type BookingLite = BookingsResponse["bookings"][number];

function mapActive(booking: BookingLite): ActiveJob {
  const firstName = booking.client?.firstName ?? null;
  const lastName = booking.client?.lastName ?? null;
  const name = `${firstName ?? ""} ${lastName ?? ""}`.trim() || "Client";
  const initials = initialsFromName(firstName, lastName);
  const when = booking.scheduledDate
    ? new Date(booking.scheduledDate).toLocaleString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Date à confirmer";

  return {
    id: booking.id,
    client: {
      name,
      initials,
      bg: bgForId(booking.clientId ?? booking.id),
    },
    service: booking.title,
    when,
    address: booking.address ?? booking.city ?? "Adresse à confirmer",
    status: booking.status === "IN_PROGRESS" ? "in_progress" : "scheduled",
    payout: booking.price ?? 0,
  };
}

export function JobRequestsClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    if (user.role !== "PROVIDER") {
      toast.error("Accès réservé aux pros");
      router.replace("/");
    }
  }, [isLoading, user, router]);

  const inboxQuery = useQuery({
    queryKey: queryKeys.jobRequests.inboxForPro,
    queryFn: () => jobRequestsApi(apiClient).inbox() as Promise<JobRequestsInboxResponse>,
    enabled: !!user && user.role === "PROVIDER",
    refetchInterval: 30_000,
  });

  const activeQuery = useQuery({
    queryKey: queryKeys.bookings.all({ role: "provider" }),
    queryFn: () =>
      bookingsApi(apiClient).getAll({ role: "provider" }) as Promise<BookingsResponse>,
    enabled: !!user && user.role === "PROVIDER",
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => jobRequestsApi(apiClient).dismiss(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobRequests.inboxForPro });
      toast.success("Demande déclinée");
    },
    onError: () => toast.error("Impossible de décliner la demande"),
  });

  const visibleRequests = useMemo(() => {
    const items = (inboxQuery.data?.requests ?? []).map(mapInbound);
    return items.sort(
      (a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0),
    );
  }, [inboxQuery.data]);

  const activeJobs = useMemo(() => {
    const items = (activeQuery.data?.bookings ?? []).filter(
      (b) => b.status === "CONFIRMED" || b.status === "IN_PROGRESS",
    );
    return items.map(mapActive);
  }, [activeQuery.data]);

  if (isLoading || !user || user.role !== "PROVIDER") {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--k-text-muted)" }}>
        Chargement…
      </div>
    );
  }

  const handleQuote = (id: string) => {
    router.push(`/pro/devis/new?requestId=${id}`);
  };

  return (
    <div style={{ padding: "8px 0 32px", maxWidth: 1080, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            className="k-caption"
            style={{
              color: "var(--k-accent)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Espace pro
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: "-0.02em",
              margin: 0,
              color: "var(--k-ink)",
            }}
          >
            Demandes & missions
          </h1>
          <p
            style={{
              color: "var(--k-text-muted)",
              fontSize: 14,
              margin: "6px 0 0",
            }}
          >
            Acceptez vite, envoyez un devis propre, gardez votre taux de réponse au vert.
          </p>
        </div>
        <button
          type="button"
          className="k-btn k-btn-secondary"
          onClick={() => router.push("/pro")}
        >
          <I.arrowLeft size={14} /> Tableau de bord
        </button>
      </div>

      {/* Section: new requests */}
      <section style={{ marginBottom: 32 }}>
        <SectionHeader
          overline="Nouvelles demandes"
          count={visibleRequests.length}
        />
        {inboxQuery.isLoading ? (
          <LoadingBox copy="Chargement des demandes…" />
        ) : inboxQuery.isError ? (
          <ErrorBox
            copy="Impossible de charger vos demandes."
            onRetry={() => inboxQuery.refetch()}
          />
        ) : visibleRequests.length === 0 ? (
          <EmptyBox
            icon="check"
            title="Boîte vide"
            copy="Les nouvelles demandes apparaîtront ici dès qu'un client vous cible."
          />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
              gap: 14,
            }}
          >
            {visibleRequests.map((r) => (
              <InboundRequestCard
                key={r.id}
                req={r}
                onDecline={() => dismissMutation.mutate(r.id)}
                onQuote={() => handleQuote(r.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Section: active jobs */}
      <section>
        <SectionHeader
          overline="Mes missions actives"
          count={activeJobs.length}
        />
        {activeQuery.isLoading ? (
          <LoadingBox copy="Chargement des missions…" />
        ) : activeQuery.isError ? (
          <ErrorBox
            copy="Impossible de charger vos missions."
            onRetry={() => activeQuery.refetch()}
          />
        ) : activeJobs.length === 0 ? (
          <EmptyBox
            icon="calendar"
            title="Rien en cours"
            copy="Vos missions acceptées apparaîtront ici."
          />
        ) : (
          <ActiveJobsCard
            jobs={activeJobs}
            onSelect={(j) => router.push(`/bookings/${j.id}`)}
          />
        )}
      </section>
    </div>
  );
}

function SectionHeader({
  overline,
  count,
}: {
  overline: string;
  count: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        marginBottom: 14,
      }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          fontSize: 11,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--k-text-muted)",
        }}
      >
        {overline}{" "}
        <span
          style={{
            color: "var(--k-accent)",
            fontWeight: 700,
          }}
        >
          ({count})
        </span>
      </h2>
    </div>
  );
}

function EmptyBox({
  icon,
  title,
  copy,
}: {
  icon: "check" | "calendar";
  title: string;
  copy: string;
}) {
  const Icon = I[icon];
  return (
    <div
      style={{
        background: "var(--k-surface)",
        border: "1px dashed var(--k-border)",
        borderRadius: "var(--k-r-md)",
        padding: "40px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 18,
          background: "var(--k-success-subtle)",
          color: "var(--k-success)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        <Icon size={22} />
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          fontSize: 16,
          color: "var(--k-ink)",
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      <div style={{ color: "var(--k-text-muted)", fontSize: 14 }}>{copy}</div>
    </div>
  );
}

function LoadingBox({ copy }: { copy: string }) {
  return (
    <div
      style={{
        background: "var(--k-surface)",
        border: "1px dashed var(--k-border)",
        borderRadius: "var(--k-r-md)",
        padding: "32px 24px",
        textAlign: "center",
        color: "var(--k-text-muted)",
        fontSize: 14,
      }}
    >
      {copy}
    </div>
  );
}

function ErrorBox({ copy, onRetry }: { copy: string; onRetry: () => void }) {
  return (
    <div
      style={{
        background: "var(--k-danger-subtle)",
        border: "1px solid var(--k-danger)",
        borderRadius: "var(--k-r-md)",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div style={{ color: "var(--k-danger)", fontWeight: 600, marginBottom: 10 }}>
        {copy}
      </div>
      <button
        type="button"
        className="k-btn k-btn-secondary k-btn-sm"
        onClick={onRetry}
      >
        Réessayer
      </button>
    </div>
  );
}
