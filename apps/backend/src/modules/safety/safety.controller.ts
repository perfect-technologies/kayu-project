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
import type { BlocksQuery, CreateBlockInput, CreateReportInput } from "../../common/contract";
import { contractPipe } from "../../common/contract/pipe";
import { CurrentActor } from "../../common/decorators/current-actor.decorator";
import { ActorGuard } from "../../common/guards/actor.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { BlocksService } from "./blocks.service";
import { ReportsService } from "./reports.service";

@Controller()
@UseGuards(SupabaseGuard, ActorGuard)
export class SafetyController {
  constructor(
    private readonly reports: ReportsService,
    private readonly blocks: BlocksService,
  ) {}

  @Post("reports")
  report(
    @CurrentActor() actor: Actor,
    @Body(contractPipe("CreateReportDto")) body: CreateReportInput,
  ) {
    return this.reports.create(actor, body);
  }

  @Post("blocks")
  block(
    @CurrentActor() actor: Actor,
    @Body(contractPipe("CreateBlockDto")) body: CreateBlockInput,
  ) {
    return this.blocks.block(actor, body.userId);
  }

  @Delete("blocks/:userId")
  unblock(@CurrentActor() actor: Actor, @Param("userId") userId: string) {
    return this.blocks.unblock(actor, userId);
  }

  @Get("blocks")
  list(
    @CurrentActor() actor: Actor,
    @Query(contractPipe("BlocksQueryParams")) query: BlocksQuery,
  ) {
    return this.blocks.list(actor, query);
  }
}
