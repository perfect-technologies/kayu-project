"use client";

import { MapPin, Navigation, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGeolocation, calculateDistance, formatDistance, getDistanceColor, getDistanceBg } from "@/hooks/useGeolocation";
import { Button } from "@/components/ui/button";

interface DistanceBadgeProps {
  providerLat: number | null;
  providerLng: number | null;
  className?: string;
  showRequestButton?: boolean;
}

export function DistanceBadge({
  providerLat,
  providerLng,
  className,
  showRequestButton = true,
}: DistanceBadgeProps) {
  const { latitude, longitude, loading, error, requestLocation, hasPermission } = useGeolocation();

  // Can't calculate without both locations
  if (!providerLat || !providerLng) {
    return null;
  }

  // User hasn't shared location yet
  if (!latitude || !longitude) {
    if (!showRequestButton) return null;

    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={requestLocation}
        disabled={loading}
        className={cn(
          "h-7 px-2 text-xs gap-1 rounded-full border",
          "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200",
          className
        )}
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Navigation className="h-3 w-3" />
        )}
        <span>Voir distance</span>
      </Button>
    );
  }

  // Calculate distance
  const distanceKm = calculateDistance(latitude, longitude, providerLat, providerLng);
  const formatted = formatDistance(distanceKm);
  const colorClass = getDistanceColor(distanceKm);
  const bgClass = getDistanceBg(distanceKm);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        bgClass,
        colorClass,
        className
      )}
    >
      <MapPin className="h-3 w-3" />
      <span>{formatted}</span>
    </div>
  );
}

// Simplified inline distance display for lists
interface DistanceInlineProps {
  userLat: number | null;
  userLng: number | null;
  providerLat: number | null;
  providerLng: number | null;
  className?: string;
}

export function DistanceInline({
  userLat,
  userLng,
  providerLat,
  providerLng,
  className,
}: DistanceInlineProps) {
  if (!userLat || !userLng || !providerLat || !providerLng) {
    return null;
  }

  const distanceKm = calculateDistance(userLat, userLng, providerLat, providerLng);
  const formatted = formatDistance(distanceKm);
  const colorClass = getDistanceColor(distanceKm);

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", colorClass, className)}>
      <MapPin className="h-3 w-3" />
      {formatted}
    </span>
  );
}

// Distance sorting utility
export function sortProvidersByDistance<T extends { user?: { latitude?: number | null; longitude?: number | null } | null }>(
  providers: T[],
  userLat: number,
  userLng: number
): (T & { distance?: number })[] {
  return providers
    .map(provider => {
      const provLat = provider.user?.latitude;
      const provLng = provider.user?.longitude;

      if (!provLat || !provLng) {
        return { ...provider, distance: undefined };
      }

      const distance = calculateDistance(userLat, userLng, provLat, provLng);
      return { ...provider, distance };
    })
    .sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      if (a.distance !== undefined) return -1;
      if (b.distance !== undefined) return 1;
      return 0;
    });
}
