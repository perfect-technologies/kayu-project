import { Controller, Get, Query } from "@nestjs/common";
import type { DistanceQuery, GeocodeQuery } from "../../common/contract";
import { contractPipe } from "../../common/contract/pipe";
import { GeoService } from "./geo.service";

@Controller()
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  @Get("geocode")
  geocode(@Query(contractPipe("GeocodeParams")) query: GeocodeQuery) {
    return this.geo.geocode(query);
  }

  @Get("distance")
  distance(@Query(contractPipe("DistanceParams")) query: DistanceQuery) {
    return this.geo.distance(query);
  }
}
