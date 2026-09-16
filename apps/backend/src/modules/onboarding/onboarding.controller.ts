import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import type { PublishProviderInput } from "../../common/contract";
import { contractPipe } from "../../common/contract/pipe";
import { CurrentActor } from "../../common/decorators/current-actor.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ActorGuard } from "../../common/guards/actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { ProviderEditorService } from "../providers/provider-editor.service";

@Controller("me")
export class OnboardingController {
  constructor(private readonly editor: ProviderEditorService) {}

  @Post("provider")
  @Roles("CLIENT")
  @UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
  publish(
    @CurrentActor() actor: Actor,
    @Body(contractPipe("PublishProviderDto")) body: PublishProviderInput,
  ) {
    return this.editor.publish(actor, body);
  }
}
