import { Body, Controller, Get, Param, Post, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import type { Actor } from "../../common/auth/types";
import { CurrentActor } from "../../common/decorators/current-actor.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ActorGuard } from "../../common/guards/actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { LazyZodValidationPipe } from "../../common/pipes/lazy-zod-validation.pipe";
import { AgentService, type IncomingUserMessage } from "./agent.service";

type UserMessageBody = { message: IncomingUserMessage };

const userMessagePipe = new LazyZodValidationPipe(
  async () => (await import("@kayu/schemas")).AssistantUserMessageDto,
);

@Controller("assistant")
@UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
@Roles("CLIENT")
export class AgentController {
  constructor(private readonly agent: AgentService) {}

  @Post("conversations")
  createConversation(@CurrentActor() actor: Actor) {
    return this.agent.createConversation(actor);
  }

  @Get("conversations")
  listConversations(@CurrentActor() actor: Actor) {
    return this.agent.listConversations(actor);
  }

  @Get("conversations/:id")
  getConversation(@CurrentActor() actor: Actor, @Param("id") id: string) {
    return this.agent.getConversation(actor, id);
  }

  @Post("conversations/:id/messages")
  async sendMessage(
    @CurrentActor() actor: Actor,
    @Param("id") id: string,
    @Body(userMessagePipe) body: UserMessageBody,
    @Res() res: Response,
  ) {
    await this.agent.runTurn(actor, id, body.message, res);
  }
}
