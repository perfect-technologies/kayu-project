import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { CurrentActor, LazyZodValidationPipe } from "../../common";
import { ActorGuard } from "../../common/guards/actor.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { SettingsService } from "./settings.service";

type UpdateVisibilityBody = {
  profileVisible?: "PUBLIC" | "REGISTERED" | "CLIENTS_ONLY" | "PRIVATE";
  showEmail?: boolean;
  showPhone?: boolean;
  showExactLocation?: boolean;
  showHourlyRate?: boolean;
  showPastWork?: boolean;
  showReviews?: boolean;
  showAvailability?: boolean;
  showCertifications?: boolean;
  showClientHistory?: boolean;
  showClientReviews?: boolean;
  allowDirectContact?: boolean;
  allowMessages?: boolean;
  appearInSearch?: boolean;
  appearInCategory?: boolean;
};

const updateVisibilityBodyPipe = new LazyZodValidationPipe(async () => {
  const { UpdateVisibilityDto } = await import("@kayu/schemas");
  return UpdateVisibilityDto;
});

@Controller("settings")
@UseGuards(SupabaseGuard, ActorGuard)
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get("visibility")
  getVisibility(@CurrentActor() actor: Actor) {
    return this.settings.getVisibility(actor);
  }

  @Put("visibility")
  updateVisibility(
    @CurrentActor() actor: Actor,
    @Body(updateVisibilityBodyPipe) body: UpdateVisibilityBody,
  ) {
    return this.settings.updateVisibility(actor, body);
  }
}
