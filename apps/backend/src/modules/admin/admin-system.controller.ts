import { Body, Controller, Get, Ip, Put, UseGuards } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import type { AdminUpdateSettingsInput } from "../../common/contract";
import { contractPipe } from "../../common/contract/pipe";
import { CurrentActor } from "../../common/decorators/current-actor.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ActorGuard } from "../../common/guards/actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { AdminSystemService } from "./admin-system.service";

@Controller("admin")
@Roles("ADMIN")
@UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
export class AdminSystemController {
  constructor(private readonly system: AdminSystemService) {}

  @Get("overview")
  overview() {
    return this.system.overview();
  }

  @Get("settings")
  settings() {
    return this.system.getSettings();
  }

  @Put("settings")
  updateSettings(
    @CurrentActor() actor: Actor,
    @Body(contractPipe("AdminUpdateSettingsDto")) body: AdminUpdateSettingsInput,
    @Ip() ip: string,
  ) {
    return this.system.updateSettings(actor, body, ip);
  }

  @Get("audit")
  audit() {
    return this.system.audit();
  }

  @Get("health")
  health() {
    return this.system.health();
  }
}
