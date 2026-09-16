import { Body, Controller, Get, Ip, Param, Patch, Query, UseGuards } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import type { AdminProviderSearchQuery, AdminUpdateProviderInput } from "../../common/contract";
import { contractPipe } from "../../common/contract/pipe";
import { CurrentActor } from "../../common/decorators/current-actor.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ActorGuard } from "../../common/guards/actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { AdminProvidersService } from "./admin-providers.service";

@Controller("admin/providers")
@Roles("ADMIN")
@UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
export class AdminProvidersController {
  constructor(private readonly providers: AdminProvidersService) {}

  @Get()
  list(@Query(contractPipe("AdminProviderSearchParams")) query: AdminProviderSearchQuery) {
    return this.providers.list(query);
  }

  @Patch(":id")
  update(
    @CurrentActor() actor: Actor,
    @Param("id") id: string,
    @Body(contractPipe("AdminUpdateProviderDto")) body: AdminUpdateProviderInput,
    @Ip() ip: string,
  ) {
    return this.providers.update(actor, id, body, ip);
  }
}
