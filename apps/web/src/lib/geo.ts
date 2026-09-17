export type LatLng = { lat: number; lng: number };

export class GeolocationDenied extends Error {}

/** Browser position with a bounded wait; rejects with `GeolocationDenied` on a refused permission. */
export function getBrowserPosition(timeoutMs = 10_000): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      (error) => reject(error.code === error.PERMISSION_DENIED ? new GeolocationDenied() : error),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 5 * 60 * 1000 },
    );
  });
}

export function roundCoord(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
