"use client";

import { MessageCircle, Phone, ShieldCheck } from "lucide-react";

interface BookingRailProps {
  providerId: string;
  firstName: string;
  hourlyRate: number | null;
  rating: number;
  totalReviews: number;
  totalJobs: number;
  responseTime: number | null;
  verificationStatus: "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED" | undefined;
  phone: string | null;
  allowMessages: boolean;
  isOwnProfile: boolean;
  onBook: () => void;
  onContact: () => void;
  onDashboard: () => void;
}

export function BookingRail(props: BookingRailProps) {
  const hourlyFormatted =
    props.hourlyRate != null ? props.hourlyRate.toLocaleString("fr-FR") : null;
  const responseLabel = formatResponseTime(props.responseTime);
  const showVerifiedTrust = props.verificationStatus === "VERIFIED";
  const showReviewTrust = props.totalReviews >= 5;

  return (
    <aside className="hidden self-start lg:sticky lg:top-[104px] lg:block">
      <div
        style={{
          background: "var(--k-surface)",
          border: "1px solid var(--k-border)",
          borderRadius: "var(--k-r-lg)",
          boxShadow: "var(--k-e2)",
          padding: 24,
        }}
      >
        {hourlyFormatted ? (
          <>
            <div className="k-caption" style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>À partir de</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 4 }}>
              <span
                style={{
                  fontFamily: "var(--k-font-mono)",
                  fontWeight: 700,
                  fontSize: 32,
                  letterSpacing: "-0.01em",
                  color: "var(--k-text-primary)",
                }}
              >
                {hourlyFormatted}
              </span>
              <span style={{ fontSize: 14, color: "var(--k-text-muted)", fontWeight: 500 }}>FC / h</span>
            </div>
          </>
        ) : (
          <div>
            <div className="k-caption">Prix de départ</div>
            <div className="k-display-m" style={{ margin: "4px 0 0" }}>À convenir</div>
          </div>
        )}

        <p style={{ fontSize: 12, color: "var(--k-text-muted)", marginTop: 10, lineHeight: 1.5 }}>
          Le prix final est convenu avec {props.firstName}. Paiement en espèces à la fin de la mission.
        </p>

        <div
          style={{
            display: "flex",
            gap: 14,
            marginTop: 14,
            paddingTop: 14,
            borderTop: "1px solid var(--k-border-subtle)",
            fontSize: 12,
          }}
        >
          {props.rating > 0 && (
            <div style={{ color: "var(--k-text-body)" }}>
              <b style={{ color: "var(--k-text-primary)", display: "block", fontWeight: 700 }}>
                ★ {props.rating.toFixed(1).replace(".", ",")}
              </b>
              {props.totalReviews} avis
            </div>
          )}
          {responseLabel && (
            <div style={{ color: "var(--k-text-body)" }}>
              <b style={{ color: "var(--k-text-primary)", display: "block", fontWeight: 700 }}>{responseLabel}</b>
              réponse
            </div>
          )}
          {props.totalJobs > 0 && (
            <div style={{ color: "var(--k-text-body)" }}>
              <b style={{ color: "var(--k-text-primary)", display: "block", fontWeight: 700 }}>{props.totalJobs}</b>
              missions
            </div>
          )}
        </div>

        {props.isOwnProfile ? (
          <button type="button" className="k-btn k-btn-secondary k-btn-lg" style={{ marginTop: 16, width: "100%" }} onClick={props.onDashboard}>
            Tableau de bord
          </button>
        ) : (
          <>
            <button type="button" className="k-btn k-btn-primary k-btn-lg" style={{ marginTop: 16, width: "100%" }} onClick={props.onBook}>
              Demander une réservation
            </button>
            {(props.phone || props.allowMessages) && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: props.phone && props.allowMessages ? "1fr 1fr" : "1fr",
                  gap: 8,
                  marginTop: 8,
                }}
              >
                {props.phone && (
                  <a className="k-btn k-btn-secondary" href={`tel:${props.phone}`}>
                    <Phone className="h-4 w-4" aria-hidden="true" /> Appeler
                  </a>
                )}
                {props.allowMessages && (
                  <button type="button" className="k-btn k-btn-secondary" onClick={props.onContact}>
                    <MessageCircle className="h-4 w-4" aria-hidden="true" /> Message
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {!props.isOwnProfile && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginTop: 14,
              paddingTop: 14,
              borderTop: "1px solid var(--k-border-subtle)",
              fontSize: 11,
              color: "var(--k-text-body)",
            }}
          >
            <ReassureRow>Aucun paiement avant le travail</ReassureRow>
            {showVerifiedTrust && <ReassureRow>Identité vérifiée par KAYOU</ReassureRow>}
            {showReviewTrust && (
              <ReassureRow>
                Note moyenne {props.rating.toFixed(1).replace(".", ",")} sur {props.totalReviews} avis
              </ReassureRow>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

function ReassureRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <ShieldCheck className="h-3.5 w-3.5" style={{ color: "var(--k-success)" }} />
      <span>{children}</span>
    </div>
  );
}

function formatResponseTime(minutes?: number | null) {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  return `${Math.round(minutes / 60)} h`;
}
