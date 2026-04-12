"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  MapPin,
  BadgeCheck,
  Clock,
  Crown,
  Calendar,
  Briefcase,
  Heart,
  Share2,
} from "lucide-react";
import { useState } from "react";

interface ProviderHeaderProps {
  provider: {
    id: string;
    userId: string;
    profession: string;
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
      country: string;
      isVerified: boolean;
      createdAt: string;
    };
    stats: {
      totalReviews: number;
      totalBookings: number;
    };
  };
  onContact?: () => void;
  onBook?: () => void;
  onFavorite?: () => void;
  isFavorited?: boolean;
}

export function ProviderHeader({
  provider,
  onContact,
  onBook,
  onFavorite,
  isFavorited = false,
}: ProviderHeaderProps) {
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const fullName = `${provider.user.firstName} ${provider.user.lastName}`;
  const initials = `${provider.user.firstName[0]}${provider.user.lastName[0]}`;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-CD", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleFavorite = async () => {
    if (favoriteLoading || !onFavorite) return;
    setFavoriteLoading(true);
    try {
      await onFavorite();
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${fullName} - ${provider.profession}`,
          text: `Découvrez ${fullName}, ${provider.profession} sur KAYOU`,
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const memberSince = new Date(provider.user.createdAt).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0 flex justify-center md:justify-start">
            <div className="relative">
              <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background shadow-lg">
                <AvatarImage src={provider.user.avatar || undefined} alt={fullName} />
                <AvatarFallback className="bg-primary/20 text-primary text-2xl md:text-3xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {/* Availability indicator */}
              {provider.isAvailable && (
                <div className="absolute bottom-1 right-1 h-5 w-5 bg-green-500 rounded-full border-2 border-background" />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            {/* Badges row */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
              {provider.isPremium && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white gap-1">
                  <Crown className="h-3 w-3" />
                  Premium
                </Badge>
              )}
              {provider.isCertified && (
                <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary">
                  <BadgeCheck className="h-3 w-3" />
                  Certifié
                </Badge>
              )}
              {provider.isAvailable && (
                <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
                  <Clock className="h-3 w-3" />
                  Disponible
                </Badge>
              )}
            </div>

            {/* Name */}
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
              {fullName}
            </h1>

            {/* Profession */}
            <p className="text-lg text-primary font-medium mb-3">{provider.profession}</p>

            {/* Rating & Stats */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground mb-4">
              {provider.rating > 0 ? (
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-foreground">
                    {provider.rating.toFixed(1)}
                  </span>
                  <span>({provider.totalReviews} avis)</span>
                </div>
              ) : (
                <span className="text-muted-foreground">Nouveau prestataire</span>
              )}
              {provider.totalJobs > 0 && (
                <div className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  <span>{provider.totalJobs} jobs</span>
                </div>
              )}
              {provider.user.city && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{provider.user.city}</span>
                </div>
              )}
              {provider.experience && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{provider.experience} ans d&apos;exp.</span>
                </div>
              )}
            </div>

            {/* Hourly Rate */}
            {provider.hourlyRate && (
              <div className="mb-4">
                <span className="text-2xl font-bold text-foreground">
                  {formatPrice(provider.hourlyRate)}
                </span>
                <span className="text-muted-foreground ml-1">CDF/heure</span>
              </div>
            )}

            {/* Action buttons - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                className="bg-primary hover:bg-primary/90"
                size="lg"
                onClick={onBook}
              >
                Réserver
              </Button>
              <Button variant="outline" size="lg" onClick={onContact}>
                Contacter
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFavorite}
                disabled={favoriteLoading}
                className="shrink-0"
              >
                <Heart
                  className={`h-5 w-5 ${isFavorited ? "fill-red-500 text-red-500" : ""}`}
                />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleShare} className="shrink-0">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            {/* Member since */}
            <p className="text-xs text-muted-foreground mt-3">
              Membre depuis {memberSince}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Skeleton version for loading state
export function ProviderHeaderSkeleton() {
  return (
    <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="h-24 w-24 md:h-32 md:w-32 rounded-full bg-muted animate-pulse mx-auto md:mx-0" />
          <div className="flex-1 text-center md:text-left">
            <div className="flex gap-2 justify-center md:justify-start mb-2">
              <div className="h-5 w-16 bg-muted rounded animate-pulse" />
              <div className="h-5 w-20 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-8 w-48 bg-muted rounded animate-pulse mx-auto md:mx-0 mb-2" />
            <div className="h-5 w-32 bg-muted rounded animate-pulse mx-auto md:mx-0 mb-3" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse mx-auto md:mx-0 mb-4" />
            <div className="h-6 w-24 bg-muted rounded animate-pulse mx-auto md:mx-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
