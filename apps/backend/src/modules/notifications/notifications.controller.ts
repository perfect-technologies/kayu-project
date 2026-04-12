import { Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { CurrentActor, LazyZodValidationPipe } from "../../common";
import { ActorGuard } from "../../common/guards/actor.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { NotificationsService } from "./notifications.service";

type NotificationQuery = {
  unreadOnly?: boolean;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

const notificationsQueryPipe = new LazyZodValidationPipe(async () => {
  const { NotificationSearchParams } = await import("@kayu/schemas");
  return NotificationSearchParams;
});

@Controller("notifications")
@UseGuards(SupabaseGuard, ActorGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  findAll(@CurrentActor() actor: Actor, @Query(notificationsQueryPipe) query: NotificationQuery) {
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
