const EARTH_RADIUS_KM = 6371;

/**
 * Calculate the distance in kilometers between two geographic points
 * using the Haversine formula.
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Format a distance for display.
 * < 1 km → "500 m", >= 1 km → "2.5 km"
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Categorize a distance as close, medium, or far.
 */
export function getDistanceStatus(km: number): "close" | "medium" | "far" {
  if (km <= 2) return "close";
  if (km <= 10) return "medium";
  return "far";
}

/**
 * Return a Tailwind text color class for a distance status.
 */
export function getDistanceColor(
  status: "close" | "medium" | "far",
): string {
  switch (status) {
    case "close":
      return "text-emerald-600";
    case "medium":
      return "text-amber-600";
    case "far":
      return "text-rose-600";
  }
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
