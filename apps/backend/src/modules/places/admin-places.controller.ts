import {
  Body,
  Controller,
  Get,
  HttpCode,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import type {
  AdminCreatePlaceInput,
  AdminMergeInput,
  AdminPlaceSearchQuery,
  AdminSuggestionSearchQuery,
  AdminUpdatePlaceInput,
} from "../../common/contract";
import { contractPipe } from "../../common/contract/pipe";
import { CurrentActor } from "../../common/decorators/current-actor.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ActorGuard } from "../../common/guards/actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { AdminPlacesService } from "./admin-places.service";

@Controller("admin/places")
@Roles("ADMIN")
@UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
export class AdminPlacesController {
  constructor(private readonly places: AdminPlacesService) {}

  @Get()
  list(@Query(contractPipe("AdminPlaceSearchParams")) query: AdminPlaceSearchQuery) {
    return this.places.list(query);
  }

  @Post()
  create(
    @CurrentActor() actor: Actor,
    @Body(contractPipe("AdminCreatePlaceDto")) body: AdminCreatePlaceInput,
    @Ip() ip: string,
  ) {
    return this.places.create(actor, body, ip);
  }

  @Get("suggestions")
  listSuggestions(
    @Query(contractPipe("AdminSuggestionSearchParams")) query: AdminSuggestionSearchQuery,
  ) {
    return this.places.listSuggestions(query);
  }

  @Post("suggestions/:id/approve")
  @HttpCode(200)
  approve(@CurrentActor() actor: Actor, @Param("id") id: string, @Ip() ip: string) {
    return this.places.approve(actor, id, ip);
  }

  @Post("suggestions/:id/reject")
  @HttpCode(200)
  reject(@CurrentActor() actor: Actor, @Param("id") id: string, @Ip() ip: string) {
    return this.places.reject(actor, id, ip);
  }

  @Post("merge")
  @HttpCode(200)
  merge(
    @CurrentActor() actor: Actor,
    @Body(contractPipe("AdminMergeDto")) body: AdminMergeInput,
    @Ip() ip: string,
  ) {
    return this.places.merge(actor, body, ip);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.places.get(id);
  }

  @Patch(":id")
  update(
    @CurrentActor() actor: Actor,
    @Param("id") id: string,
    @Body(contractPipe("AdminUpdatePlaceDto")) body: AdminUpdatePlaceInput,
    @Ip() ip: string,
  ) {
    return this.places.update(actor, id, body, ip);
  }
}
