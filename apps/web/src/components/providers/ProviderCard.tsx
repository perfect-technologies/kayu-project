"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Star,
  MapPin,
  BadgeCheck,
  Heart,
  MessageCircle,
  Clock,
} from "lucide-react";
import {
  InlineRatingDisplay,
  RATING_CATEGORIES,
  type RatingCategory,
  type CategoryRating,
} from "@/components/ratings";
import Link from "next/link";
import { useState } from "react";
import { DistanceBadge } from "@/components/distance/DistanceBadge";

interface ProviderCardProps {
  provider: {
    id: string;
    userId: string;
    profession: string;
    description?: string | null;
    hourlyRate?: number | null;
    rating: number;
    totalReviews: number;
    totalJobs: number;
    isCertified: boolean;
    isPremium: boolean;
    isAvailable: boolean;
    experience?: number | null;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string | null;
      city?: string | null;
      isVerified: boolean;
      latitude?: number | null;
      longitude?: number | null;
    };
    categories: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
    serviceZones: Array<{
      city: string;
      commune?: string | null;
    }>;
    // New category-based ratings
    categoryRatings?: CategoryRating[];
  };
  onFavorite?: (providerId: string) => void;
  isFavorited?: boolean;
  showDistance?: boolean;
}

export function ProviderCard({
  provider,
  onFavorite,
  isFavorited = false,
  showDistance = true,
}: ProviderCardProps) {
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const fullName = `${provider.user.firstName} ${provider.user.lastName}`;
  const initials = `${provider.user.firstName[0]}${provider.user.lastName[0]}`;

  const handleFavorite = async () => {
    if (favoriteLoading) return;
    setFavoriteLoading(true);
    try {
      await onFavorite?.(provider.id);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-CD", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-400 border-border/50 hover:border-primary/30 rounded-2xl">
      {/* Premium Badge */}
      {provider.isPremium && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs shadow-lg">
            Premium
          </Badge>
        </div>
      )}

      {/* Available Badge */}
      {provider.isAvailable && (
        <div className="absolute top-3 left-3 z-10">
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs shadow-sm"
          >
            <Clock className="h-3 w-3 mr-1" />
            Disponible
          </Badge>
        </div>
      )}

      <CardContent className="p-3 sm:p-4 md:p-5">
        {/* Provider Header */}
        <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
          <Link href={`/providers/${provider.id}`} className="shrink-0">
            <Avatar className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 border-2 border-primary/10 group-hover:border-primary/30 transition-all ring-2 ring-white shadow-lg">
              <AvatarImage src={provider.user.avatar || undefined} alt={fullName} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-base sm:text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <Link href={`/providers/${provider.id}`}>
              <div className="flex items-center gap-1 md:gap-1.5 mb-0.5">
                <h3 className="font-bold text-base sm:text-lg text-foreground truncate group-hover:text-primary transition-colors">
                  {fullName}
                </h3>
                {provider.isCertified && (
                  <BadgeCheck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 shrink-0" />
                )}
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-muted-foreground truncate font-medium">
              {provider.profession}
            </p>

            {/* Rating - Use category-based icons or fallback to stars */}
            <div className="mt-1 sm:mt-1.5">
              {provider.categoryRatings && provider.categoryRatings.length > 0 ? (
                <InlineRatingDisplay
                  ratings={provider.categoryRatings}
                  className="flex-wrap"
                />
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-0.5 sm:gap-1 bg-amber-50 px-1.5 sm:px-2 py-0.5 rounded-full">
                    <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs sm:text-sm font-bold text-amber-700">
                      {provider.rating > 0 ? provider.rating.toFixed(1) : "Nouveau"}
                    </span>
                  </div>
                  {provider.totalReviews > 0 && (
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      ({provider.totalReviews} avis)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Categories */}
        {provider.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-3 sm:mb-4">
            {provider.categories.slice(0, 2).map((category) => (
              <Link
                key={category.id}
                href={`/services?category=${category.slug}`}
              >
                <Badge
                  variant="secondary"
                  className="text-[10px] sm:text-xs hover:bg-primary/10 hover:text-primary transition-all rounded-lg"
                >
                  {category.name}
                </Badge>
              </Link>
            ))}
            {provider.categories.length > 2 && (
              <Badge variant="outline" className="text-[10px] sm:text-xs rounded-lg">
                +{provider.categories.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Location, Distance & Price Row */}
        <div className="flex items-center justify-between mb-3 sm:mb-4 bg-gray-50 rounded-xl p-2 sm:p-3">
          <div className="flex flex-col gap-0.5 sm:gap-1">
            {provider.user.city && (
              <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <span className="truncate max-w-[80px] sm:max-w-[100px] font-medium">{provider.user.city}</span>
              </div>
            )}
            {/* Distance indicator */}
            {showDistance && (
              <DistanceBadge
                providerLat={provider.user.latitude ?? null}
                providerLng={provider.user.longitude ?? null}
                className="mt-0.5 sm:mt-1"
                showRequestButton={false}
              />
            )}
          </div>
          {provider.hourlyRate && (
            <div className="text-right">
              <span className="text-[10px] sm:text-xs text-gray-500">À partir de</span>
              <p className="font-bold text-base sm:text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {formatPrice(provider.hourlyRate)}
              </p>
              <span className="text-[10px] sm:text-xs text-gray-500">CDF/h</span>
            </div>
          )}
        </div>

        {/* Actions Row */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link href={`/providers/${provider.id}`} className="flex-1">
            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl text-xs sm:text-sm"
            >
              Voir profil
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 rounded-xl h-8 w-8 sm:h-9 sm:w-9 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
            onClick={handleFavorite}
            disabled={favoriteLoading}
          >
            <Heart
              className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                isFavorited ? "fill-red-500 text-red-500" : ""
              }`}
            />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 rounded-xl h-8 w-8 sm:h-9 sm:w-9 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-200"
            asChild
          >
            <Link href={`/providers/${provider.id}`}>
              <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton version for loading state
export function ProviderCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-2xl">
      <CardContent className="p-5">
        {/* Provider Header Skeleton */}
        <div className="flex items-start gap-4 mb-4">
          <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
          <div className="flex-1">
            <div className="h-6 w-32 bg-muted rounded animate-pulse mb-1.5" />
            <div className="h-4 w-24 bg-muted rounded animate-pulse mb-1.5" />
            <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
          </div>
        </div>

        {/* Categories Skeleton */}
        <div className="flex gap-1.5 mb-4">
          <div className="h-5 w-16 bg-muted rounded animate-pulse" />
          <div className="h-5 w-20 bg-muted rounded animate-pulse" />
        </div>

        {/* Location & Price Skeleton */}
        <div className="flex items-center justify-between mb-4 bg-gray-50 rounded-xl p-3">
          <div className="space-y-1">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-5 w-16 bg-muted rounded animate-pulse" />
          </div>
          <div className="text-right space-y-1">
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            <div className="h-6 w-20 bg-muted rounded animate-pulse" />
          </div>
        </div>

        {/* Actions Skeleton */}
        <div className="flex gap-2">
          <div className="h-9 flex-1 bg-muted rounded animate-pulse" />
          <div className="h-9 w-9 bg-muted rounded animate-pulse" />
          <div className="h-9 w-9 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
