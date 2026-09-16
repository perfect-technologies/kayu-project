import { Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import type { NotificationsQuery } from "../../common/contract";
import { contractPipe } from "../../common/contract/pipe";
import { CurrentActor } from "../../common/decorators/current-actor.decorator";
import { ActorGuard } from "../../common/guards/actor.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(SupabaseGuard, ActorGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  findAll(
    @CurrentActor() actor: Actor,
    @Query(contractPipe("NotificationsQueryParams")) query: NotificationsQuery,
  ) {
    return this.notifications.findAll(actor, query);
  }

  @Patch("read-all")
  markAllRead(@CurrentActor() actor: Actor) {
    return this.notifications.markAllRead(actor);
  }

  @Patch(":id/read")
  markRead(@CurrentActor() actor: Actor, @Param("id") id: string) {
    return this.notifications.markRead(actor, id);
  }
}
