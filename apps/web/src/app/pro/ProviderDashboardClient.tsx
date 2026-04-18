"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Avatar,
  I,
  StarRating,
  StatCard,
  TrustChip,
} from "@kayu/ui/web";
import { useAuth } from "@/contexts/AuthContext";
import { JobCard } from "@/components/pro/JobCard";
import { RequestCard } from "@/components/pro/RequestCard";
import type { DashboardJob, DashboardRequest } from "@/components/pro/types";

// DS06 uses mocked data until the pro-dashboard backend is wired. Shape
// intentionally mirrors the v2 prototype (prototype/components/ProviderDashboard.jsx).
const TODAY_JOBS: DashboardJob[] = [
  {
    id: "j1",
    time: "09:00",
    duration: "~2h",
    client: { name: "Marie K.", initials: "MK", bg: "#FB7185" },
    kind: "Fuite évier cuisine",
    address: "Av. Kasa-Vubu, Gombe",
    status: "confirmed",
    fee: 15000,
    distance: 2.3,
  },
  {
    id: "j2",
    time: "14:30",
    duration: "~1h30",
    client: { name: "Papa Léon", initials: "PL", bg: "#10B981" },
    kind: "Chauffe-eau panne",
    address: "Blvd du 30 Juin, Kinshasa",
    status: "en_route",
    fee: 22000,
    distance: 4.1,
  },
  {
    id: "j3",
    time: "17:00",
    duration: "~1h",
    client: { name: "Esther B.", initials: "EB", bg: "#F59E0B" },
    kind: "Débouchage WC",
    address: "Rue de la Victoire, Lemba",
    status: "confirmed",
    fee: 12000,
    distance: 6.2,
  },
];

const NEW_REQUESTS: DashboardRequest[] = [
  {
    id: "r1",
    client: { name: "Christelle M.", initials: "CM", bg: "#BE185D" },
    kind: "Installation robinet cuisine",
    when: "Demain matin",
    address: "Gombe",
    msg: "J'ai acheté un nouveau robinet mais je n'arrive pas à l'installer.",
    matchScore: 96,
    receivedAt: "il y a 8 min",
    distance: 1.8,
  },
  {
    id: "r2",
    client: { name: "Ingrid L.", initials: "IL", bg: "#7C3AED" },
    kind: "Fuite sous la douche",
    when: "Dès que possible",
    address: "Limete",
    msg: "L'eau coule à travers le plafond du voisin. URGENT.",
    matchScore: 92,
    receivedAt: "il y a 22 min",
    distance: 3.7,
    urgent: true,
  },
  {
    id: "r3",
    client: { name: "Patrick N.", initials: "PN", bg: "#475569" },
    kind: "Devis rénovation salle de bain",
    when: "Semaine prochaine",
    address: "Gombe",
    msg: "Je veux refaire toute la plomberie de ma salle de bain.",
    matchScore: 88,
    receivedAt: "il y a 1h",
    distance: 2.1,
  },
];

const STATS = {
  earningsThisMonth: 485000,
  jobsThisMonth: 23,
  responseRate: 98,
};

export function ProviderDashboardClient() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [available, setAvailable] = useState(true);

  // Role gate — only PROVIDER may access /pro. CLIENT/ADMIN are nudged home.
  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    if (user.role !== "PROVIDER") {
      toast.error("Accès réservé aux pros");
      router.replace("/");
    }
  }, [isLoading, user, router]);

  const rating = 4.9;
  const reviews = 127;
  const jobs = 284;
  const trust = "EXPERT" as const;
  const firstName = user?.firstName ?? "Pro";
  const lastName = user?.lastName ?? "";
  const fullName = `${firstName} ${lastName}`.trim();

  const todayTotal = useMemo(
    () => TODAY_JOBS.reduce((a, b) => a + b.fee, 0),
    [],
  );

  if (isLoading || !user || user.role !== "PROVIDER") {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--k-text-muted)" }}>
        Chargement…
      </div>
    );
  }

  return (
    <div style={{ padding: "8px 0 32px", maxWidth: 1280, margin: "0 auto" }}>
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
        <Avatar
          name={fullName || firstName}
          size={64}
          bg="#0EA5E9"
        />
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
          background: "var(--k-success-subtle)",
          border: "1px solid #A7F3D0",
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
            background: "var(--k-success)",
            boxShadow: "0 0 0 4px rgba(16,185,129,0.25)",
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontWeight: 600, color: "#065F46" }}>
            {available
              ? "Disponible aujourd'hui · reçoit des demandes"
              : "Indisponible · tu n'apparais pas dans les résultats"}
          </div>
          <div
            className="k-caption"
            style={{ color: "#047857", fontSize: 12, fontWeight: 500 }}
          >
            Tu apparais dans les résultats de recherche · zone : Kinshasa, 10 km
          </div>
        </div>
        <button type="button" className="k-btn k-btn-secondary k-btn-sm">
          Modifier zone
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={available}
          aria-label="Disponibilité"
          onClick={() => setAvailable((v) => !v)}
          style={{
            width: 44,
            height: 26,
            borderRadius: 999,
            background: available ? "var(--k-success)" : "var(--k-border-strong)",
            position: "relative",
            cursor: "pointer",
            border: 0,
            padding: 0,
            transition: "background 160ms var(--k-ease-std)",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 3,
              left: available ? 21 : 3,
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
          value={`${(STATS.earningsThisMonth / 1000).toFixed(0)}k FC`}
          sub="+15% vs dernier"
          trend={1}
        />
        <StatCard
          label="Missions"
          value={STATS.jobsThisMonth}
          sub="+21% vs dernier"
          trend={1}
        />
        <StatCard
          label="Taux de réponse"
          value={`${STATS.responseRate}%`}
          sub="Excellent"
          trend={1}
        />
        <StatCard
          label="Note moyenne"
          value={rating.toFixed(1)}
          sub="+0.1 ce mois"
          trend={1}
        />
      </div>

      {/* Two columns — Today + New requests */}
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
          {TODAY_JOBS.length === 0 ? (
            <EmptyLine icon="calendar" copy="Aucune mission aujourd'hui" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {TODAY_JOBS.map((j) => (
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
                ({NEW_REQUESTS.length})
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
          {NEW_REQUESTS.length === 0 ? (
            <EmptyLine icon="inbox" copy="Pas de demande en attente" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {NEW_REQUESTS.map((r) => (
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

      <style jsx>{`
        @media (max-width: 960px) {
          :global(.k-pro-dashboard-grid) {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
        @media (max-width: 720px) {
          :global(.k-pro-dashboard-grid) ~ * {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>
    </div>
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
