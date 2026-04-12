"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
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
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { reviewsApi, queryKeys } from "@kayu/api";
import { useQuery } from "@tanstack/react-query";

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
    ratingBreakdown: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
    ratingAverages: {
      overall: number;
      punctuality: number;
      quality: number;
      communication: number;
      value: number;
    };
  };
}

export function ProviderReviews({
  providerId,
  initialReviews,
  stats,
}: ProviderReviewsProps) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("recent");

  const sortByTyped = sortBy as "recent" | "highest" | "lowest";

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.reviews.byProvider(providerId, { page, sortBy: sortByTyped, limit: 5 }),
    queryFn: () =>
      reviewsApi(apiClient).getByProvider(providerId, {
        page,
        limit: 5,
        sortBy: sortByTyped,
      }),
    placeholderData: (previousData) => previousData,
  });

  // Use fetched reviews if available, otherwise fall back to initial
  const reviews: Review[] = (data?.reviews as Review[] | undefined) ?? initialReviews;
  const pagination = data?.pagination;
  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const totalReviews = stats.totalReviews || 0;
  const breakdown = stats.ratingBreakdown;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Avis
          <Badge variant="outline" className="ml-auto">
            {totalReviews} avis
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Overview */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Overall Rating */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">
                {stats.ratingAverages.overall > 0
                  ? stats.ratingAverages.overall.toFixed(1)
                  : "-"}
              </div>
              <div className="flex items-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(stats.ratingAverages.overall)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalReviews} avis
              </p>
            </div>
          </div>

          {/* Rating Breakdown */}
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = breakdown[rating as keyof typeof breakdown] || 0;
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

              return (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm w-3">{rating}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <Progress
                    value={percentage}
                    className="h-2 flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-8 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Ratings */}
        {stats.ratingAverages.quality > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            {stats.ratingAverages.quality > 0 && (
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {stats.ratingAverages.quality.toFixed(1)}
                </div>
                <div className="flex items-center justify-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= Math.round(stats.ratingAverages.quality)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Qualité</p>
              </div>
            )}
            {stats.ratingAverages.punctuality > 0 && (
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {stats.ratingAverages.punctuality.toFixed(1)}
                </div>
                <div className="flex items-center justify-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= Math.round(stats.ratingAverages.punctuality)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Ponctualité</p>
              </div>
            )}
            {stats.ratingAverages.communication > 0 && (
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {stats.ratingAverages.communication.toFixed(1)}
                </div>
                <div className="flex items-center justify-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= Math.round(stats.ratingAverages.communication)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Communication</p>
              </div>
            )}
            {stats.ratingAverages.value > 0 && (
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {stats.ratingAverages.value.toFixed(1)}
                </div>
                <div className="flex items-center justify-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= Math.round(stats.ratingAverages.value)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Rapport qualité/prix</p>
              </div>
            )}
          </div>
        )}

        {/* Sort and Reviews List */}
        {totalReviews > 0 && (
          <>
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm font-medium">Tous les avis</p>
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Plus récents</SelectItem>
                  <SelectItem value="highest">Meilleures notes</SelectItem>
                  <SelectItem value="lowest">Notes les plus basses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="pb-4 border-b last:border-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.client.avatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {review.client.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <span className="font-medium text-sm">
                            {review.client.firstName} {review.client.lastName}
                          </span>
                          <span className="text-muted-foreground text-xs ml-2">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3.5 w-3.5 ${
                                star <= review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {review.service && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Service: {review.service}
                        </p>
                      )}

                      {review.comment && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {review.comment}
                        </p>
                      )}

                      {/* Provider Reply */}
                      {review.reply && (
                        <div className="mt-3 pl-3 border-l-2 border-primary/20">
                          <p className="text-xs text-muted-foreground mb-1">
                            Réponse du prestataire •{" "}
                            {review.repliedAt && formatDate(review.repliedAt)}
                          </p>
                          <p className="text-sm">{review.reply}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={isFetching}
                >
                  {isFetching ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Voir plus d&apos;avis
                </Button>
              </div>
            )}
          </>
        )}

        {/* No Reviews */}
        {totalReviews === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Ce prestataire n&apos;a pas encore reçu d&apos;avis
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Skeleton version
export function ProviderReviewsSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="h-6 w-24 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-6">
          <div className="text-center">
            <div className="h-10 w-16 bg-muted rounded animate-pulse mx-auto" />
            <div className="flex gap-0.5 mt-2 justify-center">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 w-4 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-2">
                <div className="h-3 w-3 bg-muted rounded animate-pulse" />
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                <div className="h-2 flex-1 bg-muted rounded animate-pulse" />
                <div className="h-3 w-8 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4 pt-4 border-t">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                <div className="h-3 w-full bg-muted rounded animate-pulse" />
                <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
