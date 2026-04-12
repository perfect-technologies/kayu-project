import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { CurrentActor, LazyZodValidationPipe } from "../../common";
import { ActorGuard } from "../../common/guards/actor.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { MessagingService } from "./messaging.service";

type MessageQuery = {
  conversationId?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

type CreateMessageBody = {
  recipientId: string;
  content: string;
  type: "TEXT" | "IMAGE" | "FILE" | "LOCATION" | "BOOKING_REQUEST" | "QUOTE";
  fileUrl?: string;
};

const messagesQueryPipe = new LazyZodValidationPipe(async () => {
  const { MessageSearchParams } = await import("@kayu/schemas");
  return MessageSearchParams;
});

const createMessageBodyPipe = new LazyZodValidationPipe(async () => {
  const { CreateMessageDto } = await import("@kayu/schemas");
  return CreateMessageDto;
});

@Controller("messages")
@UseGuards(SupabaseGuard, ActorGuard)
export class MessagingController {
  constructor(private readonly messaging: MessagingService) {}

  @Get()
  findAll(@CurrentActor() actor: Actor, @Query(messagesQueryPipe) query: MessageQuery) {
    return this.messaging.findAll(actor, query);
  }

  @Post()
  sendMessage(
    @CurrentActor() actor: Actor,
    @Body(createMessageBodyPipe) body: CreateMessageBody,
  ) {
    return this.messaging.sendMessage(actor, body);
  }
}
