import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import type {
  ConversationsQuery,
  MessagesQuery,
  SendMessageInput,
  StartConversationInput,
} from "../../common/contract";
import { contractPipe } from "../../common/contract/pipe";
import { CurrentActor } from "../../common/decorators/current-actor.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ActorGuard } from "../../common/guards/actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { MessagingService } from "./messaging.service";

@Controller("conversations")
@UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
export class MessagingController {
  constructor(private readonly messaging: MessagingService) {}

  @Get()
  list(
    @CurrentActor() actor: Actor,
    @Query(contractPipe("ConversationsQueryParams")) query: ConversationsQuery,
  ) {
    return this.messaging.list(actor, query);
  }

  @Post()
  @Roles("CLIENT")
  start(
    @CurrentActor() actor: Actor,
    @Body(contractPipe("StartConversationDto")) body: StartConversationInput,
  ) {
    return this.messaging.start(actor, body);
  }

  @Get(":id/messages")
  messages(
    @CurrentActor() actor: Actor,
    @Param("id") id: string,
    @Query(contractPipe("MessagesQueryParams")) query: MessagesQuery,
  ) {
    return this.messaging.messages(actor, id, query);
  }

  @Post(":id/messages")
  send(
    @CurrentActor() actor: Actor,
    @Param("id") id: string,
    @Body(contractPipe("SendMessageDto")) body: SendMessageInput,
  ) {
    return this.messaging.send(actor, id, body);
  }

  @Delete(":id/messages/:messageId")
  deleteMessage(
    @CurrentActor() actor: Actor,
    @Param("id") id: string,
    @Param("messageId") messageId: string,
  ) {
    return this.messaging.deleteMessage(actor, id, messageId);
  }
}
