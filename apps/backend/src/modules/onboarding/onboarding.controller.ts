import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { CurrentActor, LazyZodValidationPipe } from "../../common";
import { ActorGuard } from "../../common/guards/actor.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { OnboardingService, type ProviderDraftInput } from "./onboarding.service";

const draftBodyPipe = new LazyZodValidationPipe(async () => {
  const { ProviderDraftDto } = await import("@kayu/schemas");
  return ProviderDraftDto;
});

@Controller("me")
@UseGuards(SupabaseGuard, ActorGuard)
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get("provider-draft")
  getDraft(@CurrentActor() actor: Actor) {
    return this.onboarding.getDraft(actor);
  }

  @Patch("provider-draft")
  patchDraft(
    @CurrentActor() actor: Actor,
    @Body(draftBodyPipe) body: ProviderDraftInput,
  ) {
    return this.onboarding.patchDraft(actor, body);
  }

  @Post("provider-publish")
  publish(@CurrentActor() actor: Actor) {
    return this.onboarding.publish(actor);
  }
}
