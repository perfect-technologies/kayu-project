import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import {
  CurrentActor,
  LazyZodValidationPipe,
  Roles,
} from "../../common";
import { ActorGuard } from "../../common/guards/actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { ReviewsService } from "./reviews.service";

type ReviewQuery = {
  providerId: string;
  page: number;
  limit: number;
  sortBy: "recent" | "highest" | "lowest";
};

type CreateReviewBody = {
  bookingId: string;
  providerId: string;
  rating: number;
  punctuality?: number;
  quality?: number;
  communication?: number;
  value?: number;
  professionalism?: number;
  comment?: string;
  isPublic: boolean;
};

const reviewsQueryPipe = new LazyZodValidationPipe(async () => {
  const { ReviewSearchParams } = await import("@kayu/schemas");
  return ReviewSearchParams;
});

const createReviewBodyPipe = new LazyZodValidationPipe(async () => {
  const { CreateReviewDto } = await import("@kayu/schemas");
  return CreateReviewDto;
});

@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  findAll(@Query(reviewsQueryPipe) query: ReviewQuery) {
    return this.reviews.findAll(query);
  }

  @Post()
  @Roles("CLIENT")
  @UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
  create(
    @CurrentActor() actor: Actor,
    @Body(createReviewBodyPipe) body: CreateReviewBody,
  ) {
    return this.reviews.create(actor, body);
  }
}
