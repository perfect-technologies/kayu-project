import { Controller, Get, UseGuards } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { CurrentActor, Roles } from "../../common";
import { ActorGuard } from "../../common/guards/actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
@UseGuards(SupabaseGuard, ActorGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get("provider")
  @Roles("PROVIDER")
  @UseGuards(RolesGuard)
  getProviderDashboard(@CurrentActor() actor: Actor) {
    return this.dashboard.getProviderDashboard(actor);
  }

  @Get("client")
  @Roles("CLIENT")
  @UseGuards(RolesGuard)
  getClientDashboard(@CurrentActor() actor: Actor) {
    return this.dashboard.getClientDashboard(actor);
  }

  @Get("admin")
  @Roles("ADMIN")
  @UseGuards(RolesGuard)
  getAdminDashboard(@CurrentActor() actor: Actor) {
    return this.dashboard.getAdminDashboard(actor);
  }
}
