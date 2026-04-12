"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, BadgeCheck } from "lucide-react";
import Link from "next/link";

// Fix for default marker icons in Leaflet with Next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom marker for providers
const providerIcon = L.divIcon({
  className: "custom-marker",
  html: `
    <div style="
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2563eb, #4f46e5);
      border: 3px solid white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// User location marker
const userIcon = L.divIcon({
  className: "user-marker",
  html: `
    <div style="
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #10b981;
      border: 3px solid white;
      box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.3), 0 2px 10px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Set default icon
L.Marker.prototype.options.icon = defaultIcon;

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

interface MapEventsProps {
  center: [number, number];
  userLocation: { lat: number; lng: number } | null;
}

// Component to handle map events
function MapEvents({ center, userLocation }: MapEventsProps) {
  const map = useMap();

  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 13);
    } else {
      map.setView(center, 12);
    }
  }, [map, center, userLocation]);

  return null;
}

interface MapContentProps {
  providers: Provider[];
  userLocation: { lat: number; lng: number } | null;
  height: string;
  isFullscreen: boolean;
  onProviderSelect: (provider: Provider | null) => void;
}

export function MapContent({
  providers,
  userLocation,
  height,
  isFullscreen,
  onProviderSelect,
}: MapContentProps) {
  // Default center (Kinshasa)
  const defaultCenter: [number, number] = [-4.4419, 15.2663];

  // Filter providers with valid coordinates
  const providersWithCoords = providers.filter(
    (p) => p.user.latitude && p.user.longitude
  );

  return (
    <MapContainer
      center={defaultCenter}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapEvents center={defaultCenter} userLocation={userLocation} />

      {/* User location marker */}
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>
            <div className="text-center p-1">
              <strong className="text-emerald-600">Votre position</strong>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Provider markers */}
      {providersWithCoords.map((provider) => (
        <Marker
          key={provider.id}
          position={[provider.user.latitude!, provider.user.longitude!]}
          icon={providerIcon}
          eventHandlers={{
            click: () => onProviderSelect(provider),
          }}
        >
          <Popup>
            <ProviderPopup provider={provider} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

// Popup component for provider markers
function ProviderPopup({ provider }: { provider: Provider }) {
  return (
    <div className="p-2 min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <Avatar className="h-10 w-10">
          <AvatarImage src={provider.user.avatar || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm">
            {provider.user.firstName[0]}
            {provider.user.lastName[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-1">
            <strong className="text-sm">
              {provider.user.firstName} {provider.user.lastName}
            </strong>
            {provider.isCertified && (
              <BadgeCheck className="h-3.5 w-3.5 text-blue-600" />
            )}
          </div>
          <p className="text-xs text-gray-500">{provider.profession}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 mb-2">
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        <span className="text-sm font-medium">
          {provider.rating > 0 ? provider.rating.toFixed(1) : "Nouveau"}
        </span>
        {provider.totalReviews > 0 && (
          <span className="text-xs text-gray-500">
            ({provider.totalReviews} avis)
          </span>
        )}
      </div>
      <Link
        href={`/providers/${provider.id}`}
        className="block w-full text-center text-sm bg-blue-600 text-white py-1.5 rounded-md hover:bg-blue-700 transition-colors"
      >
        Voir profil
      </Link>
    </div>
  );
}
