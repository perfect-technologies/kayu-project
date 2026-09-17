"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Star } from "lucide-react";
import type { ProviderCard } from "@kayu/schemas";
import { searchCopy } from "@/copy/search";
import { cityOf, deepestCategory, formatRating } from "@/lib/dto/provider";
import type { LatLng } from "@/lib/geo";

const KINSHASA: L.LatLngTuple = [-4.325, 15.3];

const PIN_CSS = `
.provider-map-pin{width:48px;height:48px;background:#ffbd25;border:3px solid #fff;border-radius:50% 50% 50% 8px;transform:rotate(-45deg);box-shadow:0 4px 12px #123b3433;padding:3px}
.provider-map-face{width:100%;height:100%;border-radius:50%;overflow:hidden;background:#e3efe7;display:flex;align-items:center;justify-content:center;transform:rotate(45deg);color:#0a4033;font-weight:800;font-family:var(--font-heading)}
.provider-map-face img{width:100%;height:100%;object-fit:cover}
.leaflet-popup-content-wrapper{border-radius:16px;box-shadow:0 16px 48px -12px rgb(15 23 42 / .18)}
.leaflet-popup-content{margin:12px 14px;font-family:var(--font-body)}
`;

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);

function pinIcon(provider: ProviderCard): L.DivIcon {
  const face = provider.profilePhoto
    ? `<img src="${escapeHtml(provider.profilePhoto)}" alt="" />`
    : escapeHtml(provider.displayName.slice(0, 1).toUpperCase());
  return L.divIcon({
    className: "",
    html: `<div class="provider-map-pin"><span class="provider-map-face">${face}</span></div>`,
    iconSize: [50, 60],
    iconAnchor: [25, 59],
    popupAnchor: [0, -56],
  });
}

const userIcon = L.divIcon({
  className: "",
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#0a3d36;border:3px solid #fff;box-shadow:0 0 0 6px rgba(10,61,54,.25)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function FitBounds({ points }: { points: L.LatLngTuple[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0]!, 13);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 15 });
  }, [map, points]);
  return null;
}

export type SearchMapViewProps = { providers: ProviderCard[]; viewer: LatLng | null };

/** OpenStreetMap tiles, photo pins, popover card per provider; loaded only when the toggle is on. */
export default function SearchMapView({ providers, viewer }: SearchMapViewProps) {
  const located = useMemo(
    () => providers.filter((provider) => provider.latitude !== null && provider.longitude !== null),
    [providers],
  );
  const points = useMemo<L.LatLngTuple[]>(() => {
    const list = located.map((provider) => [provider.latitude!, provider.longitude!] as L.LatLngTuple);
    if (viewer) list.push([viewer.lat, viewer.lng]);
    return list;
  }, [located, viewer]);
  const center = points[0] ?? KINSHASA;

  return (
    <div className="h-[70vh] w-full overflow-hidden rounded-3xl border border-border shadow-soft" role="region" aria-label={searchCopy.map.label}>
      <style>{PIN_CSS}</style>
      <MapContainer center={center} zoom={12} scrollWheelZoom={false} className="h-full w-full" style={{ background: "#e8efe9" }}>
        <TileLayer attribution={searchCopy.map.attribution} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds points={points} />
        {viewer && (
          <Marker position={[viewer.lat, viewer.lng]} icon={userIcon}>
            <Tooltip>{searchCopy.map.youAreHere}</Tooltip>
          </Marker>
        )}
        {located.map((provider) => (
          <Marker key={provider.id} position={[provider.latitude!, provider.longitude!]} icon={pinIcon(provider)}>
            <Popup minWidth={200}>
              <div className="w-full">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-foreground">{provider.displayName}</p>
                  <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-amber-600">
                    <Star aria-hidden className="fill-amber-400 text-amber-400" size={11} />
                    {formatRating(provider.ratingAvg, provider.ratingCount)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {[deepestCategory(provider.categoryChain)?.name, cityOf(provider.placeChain)?.label].filter(Boolean).join(" · ")}
                </p>
                <Link
                  href={`/prestataire/${encodeURIComponent(provider.id)}`}
                  className="mt-2 inline-flex min-h-9 items-center rounded-full bg-primary px-3 text-xs font-semibold !text-white no-underline"
                >
                  {searchCopy.map.viewProfile}
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
