import { Controller, Get, Query } from "@nestjs/common";
import { LazyZodValidationPipe } from "../../common";
import { GeoService } from "./geo.service";

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

const geocodeQueryPipe = new LazyZodValidationPipe(async () => {
  const { GeocodeParams } = await import("@kayu/schemas");
  return GeocodeParams;
});

const distanceQueryPipe = new LazyZodValidationPipe(async () => {
  const { DistanceParams } = await import("@kayu/schemas");
  return DistanceParams;
});

@Controller()
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  @Get("geocode")
  geocode(@Query(geocodeQueryPipe) query: GeocodeQuery) {
    return this.geo.geocode(query);
  }

  @Get("distance")
  distance(@Query(distanceQueryPipe) query: DistanceQuery) {
    return this.geo.distance(query);
  }
}
