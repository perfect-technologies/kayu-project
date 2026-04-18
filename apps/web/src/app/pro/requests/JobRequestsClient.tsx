"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { I } from "@kayu/ui/web";
import { useAuth } from "@/contexts/AuthContext";
import { ActiveJobsCard } from "@/components/pro/ActiveJobsCard";
import { InboundRequestCard } from "@/components/pro/InboundRequestCard";
import { INCOMING_REQUESTS, PRO_ACTIVE_JOBS } from "@/components/pro/fixtures";

export function JobRequestsClient() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    if (user.role !== "PROVIDER") {
      toast.error("Accès réservé aux pros");
      router.replace("/");
    }
  }, [isLoading, user, router]);

  // Sort urgent requests first so they surface at the top.
  const visibleRequests = useMemo(
    () =>
      [...INCOMING_REQUESTS]
        .filter((r) => !dismissed.has(r.id))
        .sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0)),
    [dismissed],
  );

  if (isLoading || !user || user.role !== "PROVIDER") {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--k-text-muted)" }}>
        Chargement…
      </div>
    );
  }

  const handleDecline = (id: string) => {
    setDismissed((prev) => new Set([...prev, id]));
    toast.success("Demande déclinée");
  };

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
        {visibleRequests.length === 0 ? (
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
                onDecline={() => handleDecline(r.id)}
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
          count={PRO_ACTIVE_JOBS.length}
        />
        {PRO_ACTIVE_JOBS.length === 0 ? (
          <EmptyBox
            icon="calendar"
            title="Rien en cours"
            copy="Vos missions acceptées apparaîtront ici."
          />
        ) : (
          <ActiveJobsCard
            jobs={PRO_ACTIVE_JOBS}
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
