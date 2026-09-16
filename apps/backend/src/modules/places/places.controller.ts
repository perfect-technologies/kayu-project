import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import type { CreatePlaceSuggestionInput, PlacesQuery } from "../../common/contract";
import { contractPipe } from "../../common/contract/pipe";
import { CurrentActor } from "../../common/decorators/current-actor.decorator";
import { ActorGuard } from "../../common/guards/actor.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { PlacesService } from "./places.service";

@Controller("places")
export class PlacesController {
  constructor(private readonly places: PlacesService) {}

  @Get()
  list(@Query(contractPipe("PlacesQueryParams")) query: PlacesQuery) {
    return this.places.list(query);
  }

  @Post("suggestions")
  @UseGuards(SupabaseGuard, ActorGuard)
  suggest(
    @CurrentActor() actor: Actor,
    @Body(contractPipe("CreatePlaceSuggestionDto")) body: CreatePlaceSuggestionInput,
  ) {
    return this.places.suggest(actor, body);
  }

  @Get(":id/ancestors")
  ancestors(@Param("id") id: string) {
    return this.places.ancestors(id);
  }
}
