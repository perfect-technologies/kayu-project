import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import type {
  AdminContactSearchQuery,
  AdminConversationSearchQuery,
  AdminMessagesQuery,
  AdminReportSearchQuery,
  AdminResolveReportInput,
  AdminReviewSearchQuery,
  AdminUpdateContactInput,
  AdminUpdateReviewInput,
} from "../../common/contract";
import { contractPipe } from "../../common/contract/pipe";
import { CurrentActor } from "../../common/decorators/current-actor.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ActorGuard } from "../../common/guards/actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { AdminModerationService } from "./admin-moderation.service";

@Controller("admin")
@Roles("ADMIN")
@UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
export class AdminModerationController {
  constructor(private readonly moderation: AdminModerationService) {}

  @Get("reviews")
  listReviews(@Query(contractPipe("AdminReviewSearchParams")) query: AdminReviewSearchQuery) {
    return this.moderation.listReviews(query);
  }

  @Patch("reviews/:id")
  updateReview(
    @CurrentActor() actor: Actor,
    @Param("id") id: string,
    @Body(contractPipe("AdminUpdateReviewDto")) body: AdminUpdateReviewInput,
    @Ip() ip: string,
  ) {
    return this.moderation.updateReview(actor, id, body, ip);
  }

  @Delete("reviews/:id")
  deleteReview(@CurrentActor() actor: Actor, @Param("id") id: string, @Ip() ip: string) {
    return this.moderation.deleteReview(actor, id, ip);
  }

  @Get("conversations")
  listConversations(
    @Query(contractPipe("AdminConversationSearchParams")) query: AdminConversationSearchQuery,
  ) {
    return this.moderation.listConversations(query);
  }

  @Get("conversations/:id/messages")
  conversationMessages(
    @Param("id") id: string,
    @Query(contractPipe("AdminMessagesQueryParams")) query: AdminMessagesQuery,
  ) {
    return this.moderation.conversationMessages(id, query);
  }

  @Delete("conversations/:id")
  deleteConversation(@CurrentActor() actor: Actor, @Param("id") id: string, @Ip() ip: string) {
    return this.moderation.deleteConversation(actor, id, ip);
  }

  @Delete("messages/:id")
  deleteMessage(@CurrentActor() actor: Actor, @Param("id") id: string, @Ip() ip: string) {
    return this.moderation.deleteMessage(actor, id, ip);
  }

  @Get("contacts")
  listContacts(@Query(contractPipe("AdminContactSearchParams")) query: AdminContactSearchQuery) {
    return this.moderation.listContacts(query);
  }

  @Patch("contacts/:id")
  updateContact(
    @CurrentActor() actor: Actor,
    @Param("id") id: string,
    @Body(contractPipe("AdminUpdateContactDto")) body: AdminUpdateContactInput,
    @Ip() ip: string,
  ) {
    return this.moderation.updateContact(actor, id, body, ip);
  }

  @Delete("contacts/:id")
  deleteContact(@CurrentActor() actor: Actor, @Param("id") id: string, @Ip() ip: string) {
    return this.moderation.deleteContact(actor, id, ip);
  }

  @Get("reports")
  listReports(@Query(contractPipe("AdminReportSearchParams")) query: AdminReportSearchQuery) {
    return this.moderation.listReports(query);
  }

  @Patch("reports/:id")
  resolveReport(
    @CurrentActor() actor: Actor,
    @Param("id") id: string,
    @Body(contractPipe("AdminResolveReportDto")) body: AdminResolveReportInput,
    @Ip() ip: string,
  ) {
    return this.moderation.resolveReport(actor, id, body, ip);
  }
}
