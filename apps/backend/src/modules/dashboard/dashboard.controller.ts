import { Controller, Get, UseGuards } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { CurrentActor } from "../../common/decorators/current-actor.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ActorGuard } from "../../common/guards/actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
@UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get("provider")
  @Roles("PROVIDER")
  provider(@CurrentActor() actor: Actor) {
    return this.dashboard.provider(actor);
  }

  @Get("client")
  @Roles("CLIENT")
  client(@CurrentActor() actor: Actor) {
    return this.dashboard.client(actor);
  }
}
