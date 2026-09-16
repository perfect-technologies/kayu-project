import { Body, Controller, Get, Ip, Put, Query, UseGuards } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import type {
  AdminReviewVerificationDocInput,
  AdminVerificationQueueQuery,
} from "../../common/contract";
import { contractPipe } from "../../common/contract/pipe";
import { CurrentActor } from "../../common/decorators/current-actor.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ActorGuard } from "../../common/guards/actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { AdminVerificationService } from "./admin-verification.service";

@Controller("admin/verification")
@Roles("ADMIN")
@UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
export class AdminVerificationController {
  constructor(private readonly verification: AdminVerificationService) {}

  @Get("submissions")
  submissions(
    @Query(contractPipe("AdminVerificationQueueSearchParams")) query: AdminVerificationQueueQuery,
  ) {
    return this.verification.listSubmissions(query);
  }

  @Put("documents")
  reviewDoc(
    @CurrentActor() actor: Actor,
    @Body(contractPipe("AdminReviewVerificationDocDto")) body: AdminReviewVerificationDocInput,
    @Ip() ip: string,
  ) {
    return this.verification.reviewDoc(actor, body, ip);
  }
}
