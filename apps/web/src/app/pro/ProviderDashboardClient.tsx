"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Avatar,
  I,
  StarRating,
  StatCard,
  TrustChip,
} from "@kayu/ui/web";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { dashboardApi, providersApi, queryKeys } from "@kayu/api";
import type {
  RequestPreview,
  TodayJob,
} from "@kayu/schemas";
import { JobCard } from "@/components/pro/JobCard";
import { RequestCard } from "@/components/pro/RequestCard";
import type { DashboardJob, DashboardRequest } from "@/components/pro/types";

const AVATAR_COLORS = [
  "#FB7185",
  "#10B981",
  "#F59E0B",
  "#BE185D",
  "#7C3AED",
  "#475569",
  "#0EA5E9",
  "#DC2626",
];

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

function toDashboardJob(job: TodayJob): DashboardJob {
  return {
    id: job.id,
    time: job.time,
    duration: job.duration,
    kind: job.kind,
    client: {
      name: job.client.name,
      initials: initialsFor(job.client.name),
      bg: colorFor(job.client.id || job.client.name),
    },
    address: job.address,
    status: job.status,
    fee: job.fee,
    distance: job.distance,
  };
}

function toDashboardRequest(req: RequestPreview): DashboardRequest {
  return {
    id: req.id,
    client: {
      name: req.client.name,
      initials: initialsFor(req.client.name),
      bg: colorFor(req.client.id || req.client.name),
    },
    kind: req.service,
    when: req.when,
    address: req.address,
    msg: req.message,
    matchScore: req.matchScore,
    receivedAt: req.receivedAt,
    distance: req.distance,
    urgent: req.urgent,
  };
}

export function ProviderDashboardClient() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (authLoading || !user) return;
    if (user.role !== "PROVIDER") {
      toast.error("Accès réservé aux pros");
      router.replace("/");
    }
  }, [authLoading, user, router]);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.dashboard.provider,
    queryFn: () => dashboardApi(apiClient).getProviderDashboard(),
    enabled: !!user && user?.role === "PROVIDER",
  });

  const availabilityMutation = useMutation({
    mutationFn: (isAvailable: boolean) =>
      providersApi(apiClient).updateAvailability({ isAvailable }),
    onMutate: async (isAvailable) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard.provider });
      const prev = queryClient.getQueryData(queryKeys.dashboard.provider);
      queryClient.setQueryData(
        queryKeys.dashboard.provider,
        (old: typeof data | undefined) =>
          old
            ? {
                ...old,
                availability: { ...old.availability, isAvailable },
                provider: { ...old.provider, isAvailable },
              }
            : old,
      );
      return { prev };
    },
    onError: (_err, _value, context) => {
      if (context?.prev) {
        queryClient.setQueryData(queryKeys.dashboard.provider, context.prev);
      }
      toast.error("Impossible de mettre à jour votre disponibilité.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.provider });
      queryClient.invalidateQueries({ queryKey: queryKeys.providers.search() });
    },
  });

  const todayJobs: DashboardJob[] = useMemo(
    () => (data?.today.jobs ?? []).map(toDashboardJob),
    [data],
  );
  const newRequests: DashboardRequest[] = useMemo(
    () => (data?.newRequests ?? []).map(toDashboardRequest),
    [data],
  );
  const todayTotal = data?.today.estimatedRecette ?? 0;

  if (authLoading || !user || user.role !== "PROVIDER") {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--k-text-muted)" }}>
        Chargement…
      </div>
    );
  }

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  if (error || !data) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center" }}>
        <div
          style={{
            color: "var(--k-danger)",
            fontWeight: 600,
            marginBottom: 12,
            fontFamily: "var(--font-display)",
          }}
        >
          Impossible de charger votre tableau de bord.
        </div>
        <button
          type="button"
          className="k-btn k-btn-secondary"
          onClick={() => refetch()}
        >
          Réessayer
        </button>
      </div>
    );
  }

  const firstName = user.firstName ?? "Pro";
  const lastName = user.lastName ?? "";
  const fullName = `${firstName} ${lastName}`.trim();
  const rating = data.stats.avgRating.value;
  const reviews = data.provider.totalReviews ?? 0;
  const jobs = data.provider.totalJobs ?? 0;
  const trust =
    jobs >= 50 ? "EXPERT" : jobs >= 20 ? "TRUSTED" : jobs >= 5 ? "ESTABLISHED" : "NEWCOMER";
  const isAvailable = data.availability.isAvailable;
  const zoneCity = data.availability.zoneCity ?? "Kinshasa";
  const zoneRadius = data.availability.zoneRadiusKm ?? 10;
  const onboarding = data.onboarding;

  const revenueValue = data.stats.revenue.value;
  const revenueDelta = data.stats.revenue.deltaPct;
  const missionsValue = data.stats.missions.value;
  const missionsDelta = data.stats.missions.deltaPct;
  const responseRate = data.stats.responseRate;
  const avgRatingDelta = data.stats.avgRating.delta;

  return (
    <div style={{ padding: "8px 0 32px", maxWidth: 1280, margin: "0 auto" }}>
      {!onboarding.isComplete && <OnboardingBanner onboarding={onboarding} />}

      {/* Greeting header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          marginBottom: 28,
          flexWrap: "wrap",
        }}
      >
        <Avatar name={fullName || firstName} size={64} bg="#0EA5E9" />
        <div style={{ flex: 1, minWidth: 240 }}>
          <div
            className="k-caption"
            style={{ color: "var(--k-text-muted)", fontSize: 12, fontWeight: 500 }}
          >
            Bonjour,
          </div>
          <div
            className="k-display-m"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 24,
              color: "var(--k-text-primary)",
              lineHeight: 1.15,
            }}
          >
            {fullName || firstName}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 6,
              flexWrap: "wrap",
            }}
          >
            <TrustChip trust={trust} />
            <StarRating value={rating} count={reviews} />
            <span
              className="k-caption"
              style={{ color: "var(--k-text-muted)", fontSize: 12 }}
            >
              · {jobs} missions
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className="k-btn k-btn-secondary"
            onClick={() => router.push("/bookings")}
          >
            <I.calendar size={15} /> Calendrier
          </button>
          <button
            type="button"
            className="k-btn k-btn-primary"
            onClick={() => router.push("/pro/devis/new")}
          >
            <I.plus size={15} /> Créer un devis
          </button>
        </div>
      </div>

      {/* Availability bar */}
      <div
        style={{
          padding: "14px 20px",
          borderRadius: "var(--k-r-md)",
          background: isAvailable ? "var(--k-success-subtle)" : "var(--k-surface)",
          border: `1px solid ${isAvailable ? "#A7F3D0" : "var(--k-border)"}`,
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: isAvailable ? "var(--k-success)" : "var(--k-border-strong)",
            boxShadow: isAvailable ? "0 0 0 4px rgba(16,185,129,0.25)" : "none",
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontWeight: 600, color: isAvailable ? "#065F46" : "var(--k-text-primary)" }}>
            {isAvailable
              ? "Disponible aujourd'hui · reçoit des demandes"
              : "Indisponible · tu n'apparais pas dans les résultats"}
          </div>
          <div
            className="k-caption"
            style={{
              color: isAvailable ? "#047857" : "var(--k-text-muted)",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            Zone : {zoneCity}, {zoneRadius} km
          </div>
        </div>
        <button type="button" className="k-btn k-btn-secondary k-btn-sm">
          Modifier zone
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={isAvailable}
          aria-label="Disponibilité"
          disabled={availabilityMutation.isPending}
          onClick={() => availabilityMutation.mutate(!isAvailable)}
          style={{
            width: 44,
            height: 26,
            borderRadius: 999,
            background: isAvailable ? "var(--k-success)" : "var(--k-border-strong)",
            position: "relative",
            cursor: availabilityMutation.isPending ? "wait" : "pointer",
            border: 0,
            padding: 0,
            opacity: availabilityMutation.isPending ? 0.6 : 1,
            transition: "background 160ms var(--k-ease-std)",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 3,
              left: isAvailable ? 21 : 3,
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

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 28,
        }}
      >
        <StatCard
          label="Revenus du mois"
          value={`${Math.round(revenueValue / 1000)}k FC`}
          sub={`${revenueDelta >= 0 ? "+" : ""}${revenueDelta}% vs dernier`}
          trend={revenueDelta >= 0 ? 1 : -1}
        />
        <StatCard
          label="Missions"
          value={missionsValue}
          sub={`${missionsDelta >= 0 ? "+" : ""}${missionsDelta}% vs dernier`}
          trend={missionsDelta >= 0 ? 1 : -1}
        />
        <StatCard
          label="Taux de réponse"
          value={`${responseRate.value}%`}
          sub={responseRate.label}
          trend={responseRate.value >= 70 ? 1 : -1}
        />
        <StatCard
          label="Note moyenne"
          value={rating.toFixed(1)}
          sub={`${avgRatingDelta >= 0 ? "+" : ""}${avgRatingDelta.toFixed(1)} ce mois`}
          trend={avgRatingDelta >= 0 ? 1 : -1}
        />
      </div>

      {/* Two columns */}
      <div
        className="k-pro-dashboard-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)",
          gap: 24,
        }}
      >
        <section>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <h2
              className="k-heading"
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: 20,
                color: "var(--k-text-primary)",
              }}
            >
              Planning du jour
            </h2>
            <span
              className="k-caption"
              style={{ color: "var(--k-text-muted)", fontSize: 12 }}
            >
              Total estimé :{" "}
              <span
                className="k-price"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  color: "var(--k-text-primary)",
                  fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {todayTotal.toLocaleString("fr-FR")} FC
              </span>
            </span>
          </div>
          {todayJobs.length === 0 ? (
            <EmptyLine icon="calendar" copy="Aucune mission aujourd'hui" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {todayJobs.map((j) => (
                <JobCard
                  key={j.id}
                  job={j}
                  onClick={() => router.push(`/bookings/${j.id}`)}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <h2
              className="k-heading"
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: 20,
                color: "var(--k-text-primary)",
              }}
            >
              Nouvelles demandes{" "}
              <span
                style={{
                  fontSize: 14,
                  color: "var(--k-accent)",
                  fontWeight: 600,
                }}
              >
                ({newRequests.length})
              </span>
            </h2>
            <button
              type="button"
              onClick={() => router.push("/pro/requests")}
              style={{
                border: 0,
                background: "transparent",
                color: "var(--k-primary-hover)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}
            >
              Tout voir
            </button>
          </div>
          {newRequests.length === 0 ? (
            <EmptyLine icon="inbox" copy="Pas de demande en attente" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {newRequests.map((r) => (
                <RequestCard
                  key={r.id}
                  req={r}
                  onQuote={() => router.push(`/pro/devis/new?requestId=${r.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {isFetching && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            bottom: 16,
            right: 16,
            padding: "6px 10px",
            borderRadius: 999,
            background: "var(--k-surface)",
            border: "1px solid var(--k-border)",
            fontSize: 12,
            color: "var(--k-text-muted)",
            boxShadow: "var(--k-e1)",
          }}
        >
          Actualisation…
        </div>
      )}

      <style jsx>{`
        @media (max-width: 960px) {
          :global(.k-pro-dashboard-grid) {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}

function OnboardingBanner({
  onboarding,
}: {
  onboarding: {
    isComplete: boolean;
    currentStep: number | null;
    totalSteps: number;
    missingForPublish?: string[];
  };
}) {
  const currentStep = onboarding.currentStep ?? 0;
  const totalSteps = onboarding.totalSteps || 6;
  const progressPct = Math.min(100, Math.round((currentStep / totalSteps) * 100));
  return (
    <div
      role="alert"
      style={{
        background: "var(--k-info-subtle, #E0F2FE)",
        border: "1px solid #BAE6FD",
        borderRadius: "var(--k-r-md)",
        padding: 16,
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 40,
          height: 40,
          borderRadius: 999,
          background: "#FFFFFF",
          display: "grid",
          placeItems: "center",
          color: "#0284C7",
          flexShrink: 0,
        }}
      >
        <I.sparkles size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 240 }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            color: "var(--k-text-primary)",
          }}
        >
          Complétez votre inscription
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--k-text-body)",
            fontFamily: "var(--font-body)",
          }}
        >
          Étape {currentStep + 1} sur {totalSteps} · Vous apparaîtrez dans les
          recherches dès que votre profil sera publié.
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 999,
            background: "#E0F2FE",
            marginTop: 10,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: "100%",
              background: "#0EA5E9",
              transition: "width 200ms var(--k-ease-std)",
            }}
          />
        </div>
      </div>
      <Link
        href="/pro/onboarding"
        className="k-btn k-btn-primary"
        style={{ textDecoration: "none" }}
      >
        Continuer <I.arrowRight size={14} />
      </Link>
    </div>
  );
}

function DashboardLoadingState() {
  return (
    <div style={{ padding: "8px 0 32px", maxWidth: 1280, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          marginBottom: 28,
        }}
      >
        <SkeletonBlock w={64} h={64} r={32} />
        <div style={{ flex: 1 }}>
          <SkeletonBlock w={120} h={12} />
          <SkeletonBlock w={200} h={22} style={{ marginTop: 8 }} />
          <SkeletonBlock w={260} h={12} style={{ marginTop: 8 }} />
        </div>
      </div>
      <SkeletonBlock h={60} style={{ marginBottom: 24 }} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 28,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <SkeletonBlock key={i} h={100} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[0, 1, 2].map((i) => (
            <SkeletonBlock key={i} h={80} />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <SkeletonBlock key={i} h={160} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonBlock({
  w,
  h,
  r = 12,
  style,
}: {
  w?: number | string;
  h?: number | string;
  r?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: w ?? "100%",
        height: h ?? 16,
        borderRadius: r,
        background:
          "linear-gradient(90deg, rgba(148,163,184,0.12), rgba(148,163,184,0.22), rgba(148,163,184,0.12))",
        backgroundSize: "200% 100%",
        animation: "k-shimmer 1.2s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

function EmptyLine({ icon, copy }: { icon: "calendar" | "inbox"; copy: string }) {
  const Icon = I[icon];
  return (
    <div
      style={{
        background: "var(--k-surface)",
        border: "1px dashed var(--k-border)",
        borderRadius: "var(--k-r-md)",
        padding: "24px 20px",
        textAlign: "center",
        color: "var(--k-text-muted)",
        fontSize: 13,
        fontFamily: "var(--font-body)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <Icon size={20} />
      {copy}
    </div>
  );
}
