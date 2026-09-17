import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import type { UploadVerificationDocInput } from "../../common/contract";
import { contractPipe } from "../../common/contract/pipe";
import { CurrentActor } from "../../common/decorators/current-actor.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ActorGuard } from "../../common/guards/actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { VerificationService } from "./verification.service";

@Controller("pro/verification")
@Roles("PROVIDER")
@UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  @Get("state")
  getState(@CurrentActor() actor: Actor) {
    return this.verification.getState(actor);
  }

  @Post("documents")
  @HttpCode(200)
  uploadDoc(
    @CurrentActor() actor: Actor,
    @Body(contractPipe("UploadVerificationDocDto")) body: UploadVerificationDocInput,
  ) {
    return this.verification.uploadDoc(actor, body);
  }

  @Delete("documents/:id")
  removeDoc(@CurrentActor() actor: Actor, @Param("id") id: string) {
    return this.verification.removeDoc(actor, id);
  }

  @Post("submit")
  @HttpCode(200)
  submit(@CurrentActor() actor: Actor) {
    return this.verification.submit(actor);
  }
}
