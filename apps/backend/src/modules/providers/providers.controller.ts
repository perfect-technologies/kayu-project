import { Body, Controller, Get, Param, Patch, Put, Query, UseGuards } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import type {
  AvailabilityQuery,
  ProviderSearchQuery,
  PutMediaInput,
  ScheduleInput,
  UpdateAvailabilityInput,
  UpdateProviderInput,
} from "../../common/contract";
import { contractPipe } from "../../common/contract/pipe";
import { CurrentActor } from "../../common/decorators/current-actor.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ActorGuard } from "../../common/guards/actor.guard";
import { OptionalActorGuard } from "../../common/guards/optional-actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import type { PageQuery } from "../../common/http/pagination";
import { ProviderEditorService } from "./provider-editor.service";
import { ProvidersService } from "./providers.service";

@Controller("providers")
export class ProvidersController {
  constructor(
    private readonly providers: ProvidersService,
    private readonly editor: ProviderEditorService,
  ) {}

  @Patch("me")
  @Roles("PROVIDER")
  @UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
  updateMe(
    @CurrentActor() actor: Actor,
    @Body(contractPipe("UpdateProviderDto")) body: UpdateProviderInput,
  ) {
    return this.editor.update(actor, body);
  }

  @Put("me/schedule")
  @Roles("PROVIDER")
  @UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
  putSchedule(
    @CurrentActor() actor: Actor,
    @Body(contractPipe("PutScheduleDto")) body: ScheduleInput,
  ) {
    return this.editor.replaceSchedule(actor, body);
  }

  @Put("me/media")
  @Roles("PROVIDER")
  @UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
  putMedia(@CurrentActor() actor: Actor, @Body(contractPipe("PutMediaDto")) body: PutMediaInput) {
    return this.editor.replaceMedia(actor, body.items);
  }

  @Patch("me/availability")
  @Roles("PROVIDER")
  @UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
  setAvailability(
    @CurrentActor() actor: Actor,
    @Body(contractPipe("UpdateAvailabilityDto")) body: UpdateAvailabilityInput,
  ) {
    return this.editor.setAvailability(actor, body.isAvailable);
  }

  @Get()
  @UseGuards(OptionalActorGuard)
  search(
    @CurrentActor() viewer: Actor | undefined,
    @Query(contractPipe("ProviderSearchParams")) query: ProviderSearchQuery,
  ) {
    return this.providers.search(query, viewer);
  }

  @Get(":id")
  @UseGuards(OptionalActorGuard)
  getPublic(@CurrentActor() viewer: Actor | undefined, @Param("id") id: string) {
    return this.providers.getPublicProfile(id, viewer);
  }

  @Get(":id/availability")
  @UseGuards(OptionalActorGuard)
  availability(
    @CurrentActor() viewer: Actor | undefined,
    @Param("id") id: string,
    @Query(contractPipe("AvailabilityQueryParams")) query: AvailabilityQuery,
  ) {
    return this.providers.getAvailability(id, query.date, viewer);
  }

  @Get(":id/reviews")
  @UseGuards(OptionalActorGuard)
  reviews(
    @CurrentActor() viewer: Actor | undefined,
    @Param("id") id: string,
    @Query(contractPipe("ProviderReviewsQueryParams")) query: PageQuery,
  ) {
    return this.providers.listReviews(id, query, viewer);
  }
}
