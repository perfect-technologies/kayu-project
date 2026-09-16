import { HttpStatus, Injectable } from "@nestjs/common";
import type { DistanceQuery, GeocodeQuery } from "../../common/contract";
import { apiError } from "../../common/http/errors";
import { PrismaService } from "../../database/prisma.service";
import { distanceKm } from "../providers/provider-visibility";

type NominatimResult = { lat: string; lon: string; display_name: string };

export type GeocodeResult = {
  lat: number;
  lng: number;
  label: string;
  source: "place" | "nominatim";
};

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const MAX_DEPTH = 12;

@Injectable()
export class GeoService {
  fetcher: typeof fetch = (input, init) => fetch(input, init);

  constructor(private readonly prisma: PrismaService) {}

  async geocode(query: GeocodeQuery): Promise<GeocodeResult> {
    const result = query.placeId
      ? await this.geocodePlace(query.placeId)
      : await this.lookupNominatim(query.q!);
    if (!result) throw apiError(HttpStatus.NOT_FOUND, "NOT_FOUND", "Lieu introuvable");
    return result;
  }

  distance(query: DistanceQuery) {
    if (query.providerLat === undefined || query.providerLng === undefined) {
      return {
        success: true as const,
        message: "Provide providerLat and providerLng to calculate distance",
        hint: "Use ?lat=USER_LAT&lng=USER_LNG&providerLat=PROVIDER_LAT&providerLng=PROVIDER_LNG",
      };
    }

    const distance = distanceKm(query.lat, query.lng, query.providerLat, query.providerLng);
    return {
      success: true as const,
      distance: Math.round(distance * 10) / 10,
      formatted: distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`,
      status: distance <= 2 ? ("close" as const) : distance <= 10 ? ("medium" as const) : ("far" as const),
    };
  }

  private async geocodePlace(placeId: string): Promise<GeocodeResult | null> {
    const chain: Array<{ label: string; latitude: number | null; longitude: number | null }> = [];
    let currentId: string | null = placeId;
    while (currentId && chain.length < MAX_DEPTH) {
      const place: {
        label: string;
        parentId: string | null;
        latitude: number | null;
        longitude: number | null;
      } | null = await this.prisma.place.findUnique({
        where: { id: currentId },
        select: { label: true, parentId: true, latitude: true, longitude: true },
      });
      if (!place) break;
      chain.push(place);
      currentId = place.parentId;
    }
    if (chain.length === 0) return null;

    const label = chain.map((place) => place.label).join(", ");
    const located = chain.find((place) => place.latitude !== null && place.longitude !== null);
    if (located) {
      return { lat: located.latitude!, lng: located.longitude!, label, source: "place" };
    }
    return this.lookupNominatim(label);
  }

  private async lookupNominatim(q: string): Promise<GeocodeResult | null> {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "cd,cg");
    url.searchParams.set("q", q);

    try {
      const response = await this.fetcher(url.toString(), {
        headers: { "User-Agent": "KAYOU-Backend/1.0" },
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) return null;
      const [first] = (await response.json()) as NominatimResult[];
      if (!first) return null;
      const lat = Number.parseFloat(first.lat);
      const lng = Number.parseFloat(first.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng, label: first.display_name, source: "nominatim" };
    } catch {
      return null;
    }
  }
}
