import { Body, Controller, Get, Ip, Param, Patch, Query, UseGuards } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import type { AdminUpdateUserInput, AdminUserSearchQuery } from "../../common/contract";
import { contractPipe } from "../../common/contract/pipe";
import { CurrentActor } from "../../common/decorators/current-actor.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ActorGuard } from "../../common/guards/actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { AdminUsersService } from "./admin-users.service";

@Controller("admin/users")
@Roles("ADMIN")
@UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  list(@Query(contractPipe("AdminUserSearchParams")) query: AdminUserSearchQuery) {
    return this.users.list(query);
  }

  @Get(":id/cv")
  cv(@Param("id") id: string) {
    return this.users.cv(id);
  }

  @Patch(":id")
  update(
    @CurrentActor() actor: Actor,
    @Param("id") id: string,
    @Body(contractPipe("AdminUpdateUserDto")) body: AdminUpdateUserInput,
    @Ip() ip: string,
  ) {
    return this.users.update(actor, id, body, ip);
  }
}
