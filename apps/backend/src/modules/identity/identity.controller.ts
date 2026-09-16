import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import type { Actor, AuthContextUser } from "../../common/auth/types";
import type { UpdateProfileInput } from "../../common/contract";
import { contractPipe } from "../../common/contract/pipe";
import { CurrentActor } from "../../common/decorators/current-actor.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ActorGuard } from "../../common/guards/actor.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { AccountService } from "./account.service";
import { IdentityService } from "./identity.service";

@Controller("me")
export class IdentityController {
  constructor(
    private readonly identity: IdentityService,
    private readonly account: AccountService,
  ) {}

  @Get()
  @UseGuards(SupabaseGuard)
  getMe(@CurrentUser() authUser: AuthContextUser) {
    return this.identity.getMe(authUser);
  }

  @Patch("profile")
  @UseGuards(SupabaseGuard, ActorGuard)
  updateProfile(
    @CurrentActor() actor: Actor,
    @Body(contractPipe("UpdateProfileDto")) body: UpdateProfileInput,
  ) {
    return this.identity.updateProfile(actor, body);
  }

  @Post("accept-terms")
  @HttpCode(200)
  @UseGuards(SupabaseGuard, ActorGuard)
  acceptTerms(@CurrentActor() actor: Actor) {
    return this.identity.acceptTerms(actor);
  }

  @Delete()
  @UseGuards(SupabaseGuard, ActorGuard)
  deleteAccount(@CurrentActor() actor: Actor) {
    return this.account.deleteAccount(actor);
  }
}
