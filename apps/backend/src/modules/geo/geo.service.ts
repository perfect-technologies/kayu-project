import { Injectable } from "@nestjs/common";

type GeocodeQuery = {
  city: string;
  commune?: string;
  country: string;
};

type DistanceQuery = {
  lat: number;
  lng: number;
  providerLat?: number;
  providerLng?: number;
};

type Coordinates = {
  lat: number;
  lon: number;
};

type GeocodingResult = {
  lat: string;
  lon: string;
  display_name: string;
};

const CITY_COORDINATES: Record<string, Coordinates> = {
  Kinshasa: { lat: -4.4419, lon: 15.2663 },
  Lubumbashi: { lat: -11.6609, lon: 27.4794 },
  Goma: { lat: -1.6671, lon: 29.2227 },
  "Mbuji-Mayi": { lat: -6.1367, lon: 23.5878 },
  Kisangani: { lat: 0.5153, lon: 25.19 },
  Matadi: { lat: -5.8253, lon: 13.4636 },
  Boma: { lat: -5.85, lon: 13.05 },
  Likasi: { lat: -10.9833, lon: 26.75 },
  Kolwezi: { lat: -10.7167, lon: 25.4667 },
  Brazzaville: { lat: -4.2634, lon: 15.2429 },
  "Pointe-Noire": { lat: -4.7761, lon: 11.8635 },
  Dolisie: { lat: -4.2, lon: 12.7 },
  Nkayi: { lat: -4.1667, lon: 13.2833 },
  Impfondo: { lat: 1.6167, lon: 18.0667 },
};

const KINSHASA_COMMUNES: Record<string, Coordinates> = {
  Gombe: { lat: -4.325, lon: 15.2833 },
  Ngaliema: { lat: -4.3517, lon: 15.225 },
  Limete: { lat: -4.35, lon: 15.35 },
  Barumbu: { lat: -4.325, lon: 15.3 },
  Kintambo: { lat: -4.3167, lon: 15.2667 },
  Bandalungwa: { lat: -4.35, lon: 15.25 },
  Kalamu: { lat: -4.3333, lon: 15.3167 },
  Kasavubu: { lat: -4.3, lon: 15.2833 },
  Makala: { lat: -4.3833, lon: 15.3 },
  Matonge: { lat: -4.3167, lon: 15.3 },
  Ngaba: { lat: -4.3667, lon: 15.3333 },
  Selembao: { lat: -4.3667, lon: 15.25 },
  Bumbu: { lat: -4.35, lon: 15.2333 },
  Kimbanseke: { lat: -4.4167, lon: 15.3667 },
  Maluku: { lat: -4.1, lon: 15.5 },
  Masina: { lat: -4.3833, lon: 15.4167 },
  Nsele: { lat: -4.3, lon: 15.5333 },
  Lemba: { lat: -4.3833, lon: 15.3333 },
};

const BRAZZAVILLE_COMMUNES: Record<string, Coordinates> = {
  Bacongo: { lat: -4.2833, lon: 15.25 },
  Mfilou: { lat: -4.2167, lon: 15.1833 },
  Madibou: { lat: -4.25, lon: 15.3167 },
  "Poto-Poto": { lat: -4.2667, lon: 15.2667 },
  Moungali: { lat: -4.25, lon: 15.25 },
  "Ouenzé": { lat: -4.2333, lon: 15.25 },
  Talangaï: { lat: -4.2167, lon: 15.2833 },
  Makélékélé: { lat: -4.3, lon: 15.2333 },
  Djiri: { lat: -4.1833, lon: 15.3 },
};

@Injectable()
export class GeoService {
  async geocode(query: GeocodeQuery) {
    const localCoordinates = this.findLocalCoordinates(query.city, query.commune);

    if (localCoordinates) {
      return {
        success: true as const,
        latitude: localCoordinates.lat,
        longitude: localCoordinates.lon,
        city: query.city,
        commune: query.commune ?? null,
        country: query.country,
        source: "local" as const,
      };
    }

    const remote = await this.lookupNominatim(query);
    if (remote) {
      return {
        success: true as const,
        latitude: remote.latitude,
        longitude: remote.longitude,
        city: query.city,
        commune: query.commune ?? null,
        country: query.country,
        display_name: remote.displayName,
        source: "nominatim" as const,
      };
    }

    const fallback =
      query.country.toUpperCase() === "RDC"
        ? CITY_COORDINATES.Kinshasa
        : CITY_COORDINATES.Brazzaville;

    return {
      success: true as const,
      latitude: fallback.lat,
      longitude: fallback.lon,
      city: query.city,
      commune: query.commune ?? null,
      country: query.country,
      source: "default" as const,
    };
  }

  distance(query: DistanceQuery) {
    if (query.providerLat === undefined || query.providerLng === undefined) {
      return {
        success: true as const,
        message: "Provide providerLat and providerLng to calculate distance",
        hint: "Use ?lat=USER_LAT&lng=USER_LNG&providerLat=PROVIDER_LAT&providerLng=PROVIDER_LNG",
      };
    }

    const distance = this.calculateDistance(
      query.lat,
      query.lng,
      query.providerLat,
      query.providerLng,
    );

    return {
      success: true as const,
      distance: Math.round(distance * 10) / 10,
      formatted: this.formatDistance(distance),
      status: this.getDistanceStatus(distance),
    };
  }

  private findLocalCoordinates(city: string, commune?: string) {
    if (commune) {
      if (city === "Kinshasa" && KINSHASA_COMMUNES[commune]) {
        return KINSHASA_COMMUNES[commune];
      }

      if (city === "Brazzaville" && BRAZZAVILLE_COMMUNES[commune]) {
        return BRAZZAVILLE_COMMUNES[commune];
      }
    }

    return CITY_COORDINATES[city] ?? null;
  }

  private async lookupNominatim(query: GeocodeQuery) {
    const countryName =
      query.country.toUpperCase() === "RDC" ? "Congo Democratic Republic" : "Congo";
    const searchQuery = query.commune
      ? `${query.commune}, ${query.city}, ${countryName}`
      : `${query.city}, ${countryName}`;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: {
            "User-Agent": "KAYOU-Backend/1.0",
          },
        },
      );

      if (!response.ok) {
        return null;
      }

      const results = (await response.json()) as GeocodingResult[];
      const result = results[0];
      if (!result) {
        return null;
      }

      return {
        latitude: Number.parseFloat(result.lat),
        longitude: Number.parseFloat(result.lon),
        displayName: result.display_name,
      };
    } catch {
      return null;
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const radius = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    return radius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  private toRad(value: number) {
    return value * (Math.PI / 180);
  }

  private formatDistance(distanceKm: number) {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    }

    return `${distanceKm.toFixed(1)} km`;
  }

  private getDistanceStatus(distanceKm: number) {
    if (distanceKm <= 2) {
      return "close" as const;
    }

    if (distanceKm <= 10) {
      return "medium" as const;
    }

    return "far" as const;
  }
}
