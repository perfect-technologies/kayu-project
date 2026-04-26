"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Star,
  MessageSquare,
  Loader2,
  Clock,
  Wrench,
  MessageCircle,
  Coins,
} from "lucide-react";
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
  initialReviews: Review[];
  stats: {
    totalReviews: number;
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

const DIMENSIONS: Array<{
  key: keyof ProviderReviewsProps["stats"]["ratingAverages"];
  label: string;
  icon: React.ElementType;
}> = [
  { key: "punctuality", label: "Ponctualité", icon: Clock },
  { key: "quality", label: "Qualité", icon: Wrench },
  { key: "communication", label: "Communication", icon: MessageCircle },
  { key: "value", label: "Rapport qualité/prix", icon: Coins },
];

function scoreColor(score: number) {
  if (score >= 4) return "var(--k-success)";
  if (score >= 3) return "var(--k-warning)";
  if (score > 0) return "var(--k-danger)";
  return "var(--k-text-muted)";
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
  initialReviews,
  stats,
}: ProviderReviewsProps) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"recent" | "highest" | "lowest">("recent");

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

  const totalReviews = stats.totalReviews || 0;
  const breakdown = stats.ratingBreakdown;
  const overall = stats.ratingAverages.overall;

  return (
    <ProviderSection
      title="Avis"
      subtitle={
        totalReviews > 0
          ? `${totalReviews} avis · note moyenne ${overall.toFixed(1)}/5`
          : "Aucun avis pour le moment"
      }
    >
      {totalReviews > 0 && (
        <>
          <div
            style={{
              display: "grid",
              gap: 24,
              gridTemplateColumns: "minmax(140px, 200px) 1fr",
              alignItems: "center",
              paddingBottom: 20,
              borderBottom: "1px solid var(--k-border-subtle)",
            }}
            className="k-reviews-overview"
          >
            <div style={{ textAlign: "center" }}>
              <div
                className="k-num"
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontWeight: 700,
                  fontSize: 44,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                  color: "var(--k-text-primary)",
                }}
              >
                {overall > 0 ? overall.toFixed(1) : "—"}
              </div>
              <div style={{ marginTop: 6 }}>
                <StarRow value={overall} />
              </div>
              <div className="k-caption" style={{ marginTop: 4 }}>
                {totalReviews} avis
              </div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = breakdown[rating as keyof typeof breakdown] || 0;
                const percentage =
                  totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div
                    key={rating}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "16px 12px 1fr 28px",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      className="k-caption"
                      style={{ color: "var(--k-text-body)", fontWeight: 600 }}
                    >
                      {rating}
                    </span>
                    <Star
                      className="h-3 w-3"
                      style={{
                        color: "var(--k-warning)",
                        fill: "var(--k-warning)",
                      }}
                    />
                    <div
                      style={{
                        height: 6,
                        borderRadius: 3,
                        background: "var(--k-border-subtle)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${percentage}%`,
                          height: "100%",
                          background: "var(--k-warning)",
                          borderRadius: 3,
                        }}
                      />
                    </div>
                    <span
                      className="k-caption"
                      style={{ textAlign: "right", color: "var(--k-text-muted)" }}
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {DIMENSIONS.some((d) => stats.ratingAverages[d.key] > 0) && (
            <div
              style={{
                display: "grid",
                gap: 14,
                paddingTop: 20,
                paddingBottom: 20,
                borderBottom: "1px solid var(--k-border-subtle)",
              }}
            >
              <div
                className="k-overline"
                style={{ color: "var(--k-text-muted)" }}
              >
                Évaluations détaillées
              </div>
              {DIMENSIONS.map((dim) => {
                const value = stats.ratingAverages[dim.key];
                if (value <= 0) return null;
                const color = scoreColor(value);
                const Icon = dim.icon;
                return (
                  <div
                    key={dim.key}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "20px 1fr auto 110px",
                      gap: 12,
                      alignItems: "center",
                    }}
                  >
                    <span style={{ color }}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span
                      className="k-body-m"
                      style={{ fontWeight: 500, color: "var(--k-text-body)" }}
                    >
                      {dim.label}
                    </span>
                    <span
                      className="k-num"
                      style={{
                        fontFamily: "var(--k-font-display)",
                        fontWeight: 600,
                        fontSize: 15,
                        color,
                      }}
                    >
                      {value.toFixed(1)}
                    </span>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 3,
                        background: "var(--k-border-subtle)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${(value / 5) * 100}%`,
                          height: "100%",
                          background: color,
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

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
        </>
      )}

      {totalReviews === 0 && (
        <div style={{ textAlign: "center", padding: "32px 8px" }}>
          <MessageSquare
            className="h-10 w-10 mx-auto mb-3"
            style={{ color: "var(--k-text-muted)" }}
          />
          <p className="k-body" style={{ color: "var(--k-text-muted)" }}>
            Ce prestataire n&apos;a pas encore reçu d&apos;avis
          </p>
        </div>
      )}
    </ProviderSection>
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
