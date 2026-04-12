"use client";

import { useState, useCallback, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Star,
  BadgeCheck,
  Navigation,
  X,
  Loader2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Client-side only check using useSyncExternalStore
const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function useIsClient() {
  return useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
}

interface Provider {
  id: string;
  userId: string;
  profession: string;
  hourlyRate?: number | null;
  rating: number;
  totalReviews: number;
  isCertified: boolean;
  isAvailable: boolean;
  user: {
    firstName: string;
    lastName: string;
    avatar?: string | null;
    city?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

// Dynamic import of map component with SSR disabled
const MapContent = dynamic(
  () => import("./MapContent").then((mod) => mod.MapContent),
  {
    ssr: false,
    loading: () => <MapSkeleton height="400px" />
  }
);

const MiniMapContent = dynamic(
  () => import("./MiniMapContent").then((mod) => mod.MiniMapContent),
  {
    ssr: false,
    loading: () => <MapSkeleton height="200px" />
  }
);

interface ProvidersMapProps {
  providers: Provider[];
  className?: string;
  height?: string;
  showControls?: boolean;
}

// Loading skeleton for the map
function MapSkeleton({ height }: { height: string }) {
  return (
    <div
      style={{ height }}
      className="flex items-center justify-center bg-gray-100 rounded-lg"
    >
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Chargement de la carte...</p>
      </div>
    </div>
  );
}

export function ProvidersMap({
  providers,
  className,
  height = "400px",
  showControls = true,
}: ProvidersMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const isClient = useIsClient();

  // Filter providers with valid coordinates
  const providersWithCoords = providers.filter(
    (p) => p.user.latitude && p.user.longitude
  );

  // Get user location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoadingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setLoadingLocation(false);
        alert("Impossible d'obtenir votre position");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Dynamic height based on fullscreen state
  const mapHeight = isFullscreen ? "calc(100vh - 200px)" : height;

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Map Header */}
      {showControls && (
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">
              Carte des prestataires
            </h3>
            <Badge variant="secondary" className="ml-2">
              {providersWithCoords.length} sur carte
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={getUserLocation}
              disabled={loadingLocation}
              className="gap-1"
            >
              {loadingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
              {userLocation ? "Ma position" : "Me localiser"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="gap-1"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div style={{ height: mapHeight }} className="relative">
        {isClient && (
          <MapContent
            providers={providers}
            userLocation={userLocation}
            height={mapHeight}
            isFullscreen={isFullscreen}
            onProviderSelect={setSelectedProvider}
          />
        )}

        {/* Selected provider card */}
        {selectedProvider && (
          <div className="absolute bottom-4 left-4 right-4 z-[1000]">
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedProvider.user.avatar || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      {selectedProvider.user.firstName[0]}
                      {selectedProvider.user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h4 className="font-semibold">
                        {selectedProvider.user.firstName} {selectedProvider.user.lastName}
                      </h4>
                      {selectedProvider.isCertified && (
                        <BadgeCheck className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{selectedProvider.profession}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-medium">
                          {selectedProvider.rating > 0 ? selectedProvider.rating.toFixed(1) : "Nouveau"}
                        </span>
                      </div>
                      {selectedProvider.user.city && (
                        <span className="text-xs text-gray-500">
                          • {selectedProvider.user.city}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSelectedProvider(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2 mt-3">
                  <Link href={`/providers/${selectedProvider.id}`} className="flex-1">
                    <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600">
                      Voir profil
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* No providers message */}
        {providersWithCoords.length === 0 && isClient && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 z-[1000]">
            <div className="text-center p-6">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">
                Aucun prestataire sur la carte
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Les prestataires avec des coordonnées GPS apparaîtront ici
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// Mini map component for provider profile
interface MiniMapProps {
  latitude: number;
  longitude: number;
  name: string;
  className?: string;
}

export function MiniMap({ latitude, longitude, name, className }: MiniMapProps) {
  const isClient = useIsClient();

  if (!isClient) {
    return (
      <div className={cn("rounded-xl overflow-hidden border", className)}>
        <div
          style={{ height: "200px" }}
          className="flex items-center justify-center bg-gray-100 rounded-lg"
        >
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Chargement de la carte...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl overflow-hidden border", className)}>
      <MiniMapContent latitude={latitude} longitude={longitude} name={name} />
    </div>
  );
}
