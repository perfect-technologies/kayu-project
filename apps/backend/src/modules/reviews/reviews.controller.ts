import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import type {
  CreateClientReviewInput,
  CreateReviewInput,
  ReplyReviewInput,
} from "../../common/contract";
import { contractPipe } from "../../common/contract/pipe";
import { CurrentActor } from "../../common/decorators/current-actor.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ActorGuard } from "../../common/guards/actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { ReviewsService } from "./reviews.service";

@Controller("reviews")
@UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Post()
  @Roles("CLIENT")
  create(
    @CurrentActor() actor: Actor,
    @Body(contractPipe("CreateReviewDto")) body: CreateReviewInput,
  ) {
    return this.reviews.create(actor, body);
  }

  @Get("mine")
  @Roles("CLIENT")
  mine(@CurrentActor() actor: Actor) {
    return this.reviews.mine(actor);
  }

  @Post("clients")
  @Roles("PROVIDER")
  createClientReview(
    @CurrentActor() actor: Actor,
    @Body(contractPipe("CreateClientReviewDto")) body: CreateClientReviewInput,
  ) {
    return this.reviews.createClientReview(actor, body);
  }

  @Get("clients/:clientId/summary")
  @Roles("PROVIDER", "ADMIN")
  clientSummary(@Param("clientId") clientId: string) {
    return this.reviews.clientSummary(clientId);
  }

  @Post(":id/reply")
  @Roles("PROVIDER")
  @HttpCode(200)
  reply(
    @CurrentActor() actor: Actor,
    @Param("id") id: string,
    @Body(contractPipe("ReplyReviewDto")) body: ReplyReviewInput,
  ) {
    return this.reviews.reply(actor, id, body);
  }
}
