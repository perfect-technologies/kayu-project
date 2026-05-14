"use client";

import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { reviewsApi, queryKeys } from "@kayu/api";
import { useQuery } from "@tanstack/react-query";
import { ProviderSection } from "./ProviderSection";

interface Review {
  id: string;
  rating: number;
  punctuality?: number | null;
  quality?: number | null;
  communication?: number | null;
  value?: number | null;
  comment?: string | null;
  createdAt: string;
  reply?: string | null;
  repliedAt?: string | null;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
    initials: string;
  };
  service?: string;
}

interface ProviderReviewsProps {
  providerId: string;
  firstName: string;
  initialReviews: Review[];
  stats: {
    totalReviews: number;
    totalBookings: number;
    ratingBreakdown: { 5: number; 4: number; 3: number; 2: number; 1: number };
    ratingAverages: {
      overall: number;
      punctuality: number;
      quality: number;
      communication: number;
      value: number;
    };
  };
}

function StarRow({ value }: { value: number }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value);
        return (
          <Star
            key={star}
            className="h-3.5 w-3.5"
            style={{
              color: filled ? "var(--k-warning)" : "var(--k-border)",
              fill: filled ? "var(--k-warning)" : "transparent",
            }}
          />
        );
      })}
    </div>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ProviderReviews({
  providerId,
  firstName,
  initialReviews,
  stats,
}: ProviderReviewsProps) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"recent" | "highest" | "lowest">("recent");
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  const { data, isFetching } = useQuery({
    queryKey: queryKeys.reviews.byProvider(providerId, { page, sortBy, limit: 5 }),
    queryFn: () =>
      reviewsApi(apiClient).getByProvider(providerId, {
        page,
        limit: 5,
        sortBy,
      }),
    placeholderData: (previousData) => previousData,
  });

  const reviews: Review[] = (data?.reviews as Review[] | undefined) ?? initialReviews;
  const pagination = data?.pagination;
  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  const recommendPct = useMemo(() => {
    if (stats.totalReviews < 5) return null;
    const positive = (stats.ratingBreakdown[5] ?? 0) + (stats.ratingBreakdown[4] ?? 0);
    return Math.round((positive / stats.totalReviews) * 100);
  }, [stats.totalReviews, stats.ratingBreakdown]);

  const ratingFormatted =
    stats.ratingAverages.overall > 0
      ? stats.ratingAverages.overall.toFixed(1).replace(".", ",")
      : "—";
  const filledStars = Math.round(stats.ratingAverages.overall);

  if (stats.totalReviews === 0) {
    return (
      <ProviderSection title="Ce que disent les clients">
        <p style={{ fontSize: 14, color: "var(--k-text-muted)", margin: 0 }}>
          Pas encore d&apos;avis. Soyez le premier à recommander {firstName}.
        </p>
      </ProviderSection>
    );
  }

  return (
    <ProviderSection title="Ce que disent les clients">
      <div
        style={{
          background: "#FFFBF5",
          border: "1px solid #FDE68A",
          borderRadius: 10,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div
              style={{
                fontFamily: "var(--k-font-display)",
                fontWeight: 800,
                fontSize: 44,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                color: "var(--k-text-primary)",
              }}
            >
              {ratingFormatted}
            </div>
            <div>
              <div style={{ color: "var(--k-warning)", fontSize: 14 }}>
                {"★".repeat(filledStars)}
                {"☆".repeat(5 - filledStars)}
              </div>
              <div style={{ fontSize: 12, color: "var(--k-text-muted)", marginTop: 4 }}>
                {stats.totalReviews} avis
                {stats.totalBookings > 0 ? ` · ${stats.totalBookings} missions terminées` : ""}
              </div>
              {recommendPct !== null && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#15803D",
                    fontWeight: 600,
                    marginTop: 6,
                  }}
                >
                  ✓ {recommendPct}% des clients recommandent {firstName}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBreakdownOpen((v) => !v)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--k-primary-hover)",
              background: "var(--k-surface)",
              border: "1px solid var(--k-border)",
              padding: "5px 10px",
              borderRadius: 99,
              cursor: "pointer",
            }}
          >
            {breakdownOpen ? "Masquer ▴" : "Voir le détail ▾"}
          </button>
        </div>

        {breakdownOpen && (
          <div
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: "1px solid #FDE68A",
            }}
          >
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-x-6">
              <BreakdownRow label="Ponctualité" value={stats.ratingAverages.punctuality} />
              <BreakdownRow label="Qualité" value={stats.ratingAverages.quality} />
              <BreakdownRow label="Communication" value={stats.ratingAverages.communication} />
              <BreakdownRow label="Rapport qualité/prix" value={stats.ratingAverages.value} />
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          paddingTop: 18,
          flexWrap: "wrap",
        }}
      >
            <div
              className="k-body-m"
              style={{ fontWeight: 600, color: "var(--k-text-primary)" }}
            >
              Tous les avis
            </div>
            <Select
              value={sortBy}
              onValueChange={(v) => {
                setSortBy(v as typeof sortBy);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Plus récents</SelectItem>
                <SelectItem value="highest">Meilleures notes</SelectItem>
                <SelectItem value="lowest">Notes les plus basses</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div style={{ display: "grid", gap: 20, marginTop: 16 }}>
            {reviews.map((review) => (
              <article
                key={review.id}
                style={{
                  display: "flex",
                  gap: 14,
                  paddingBottom: 18,
                  borderBottom: "1px solid var(--k-border-subtle)",
                }}
              >
                <Avatar className="h-11 w-11 flex-shrink-0">
                  <AvatarImage src={review.client.avatar || undefined} />
                  <AvatarFallback
                    style={{
                      background: "var(--k-primary-subtle)",
                      color: "var(--k-primary-hover)",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {review.client.initials}
                  </AvatarFallback>
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {review.client.firstName} {review.client.lastName}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginTop: 4,
                        }}
                      >
                        <StarRow value={review.rating} />
                        <span className="k-caption">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {review.service && (
                    <div className="k-caption" style={{ marginTop: 4 }}>
                      Service : {review.service}
                    </div>
                  )}

                  {review.comment && (
                    <p
                      className="k-body"
                      style={{
                        color: "var(--k-text-body)",
                        margin: "8px 0 0",
                        lineHeight: 1.55,
                      }}
                    >
                      {review.comment}
                    </p>
                  )}

                  {review.reply && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: 12,
                        borderRadius: "var(--k-r-sm)",
                        background: "var(--k-surface-muted)",
                        borderLeft: "3px solid var(--k-primary)",
                      }}
                    >
                      <div
                        className="k-caption"
                        style={{ color: "var(--k-text-muted)", marginBottom: 4 }}
                      >
                        Réponse du prestataire
                        {review.repliedAt && ` · ${formatDate(review.repliedAt)}`}
                      </div>
                      <p
                        className="k-body"
                        style={{ margin: 0, color: "var(--k-text-body)" }}
                      >
                        {review.reply}
                      </p>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

      {hasMore && (
        <div style={{ textAlign: "center", marginTop: 18 }}>
          <button
            type="button"
            className="k-btn k-btn-secondary"
            onClick={() => setPage((p) => p + 1)}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Voir plus d&apos;avis
          </button>
        </div>
      )}
    </ProviderSection>
  );
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  if (!value || value <= 0) return null;
  const pct = Math.min(100, (value / 5) * 100);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 30px", gap: 8, alignItems: "center", fontSize: 12 }}>
      <span style={{ color: "var(--k-text-muted)" }}>{label}</span>
      <div style={{ height: 5, background: "#F1F5F9", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "var(--k-success)", borderRadius: 99 }} />
      </div>
      <span style={{ fontFamily: "var(--k-font-mono)", fontWeight: 700, fontSize: 11, color: "var(--k-text-primary)", textAlign: "right" }}>
        {value.toFixed(1).replace(".", ",")}
      </span>
    </div>
  );
}

export function ProviderReviewsSkeleton() {
  return (
    <div
      className="animate-k-shimmer"
      style={{ height: 320, borderRadius: "var(--k-r-lg)" }}
    />
  );
}
