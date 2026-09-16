import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import type { EarningsTransactionsQuery } from "../../common/contract";
import { contractPipe } from "../../common/contract/pipe";
import { CurrentActor } from "../../common/decorators/current-actor.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ActorGuard } from "../../common/guards/actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { EarningsService } from "./earnings.service";

@Controller("pro/earnings")
@Roles("PROVIDER")
@UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
export class EarningsController {
  constructor(private readonly earnings: EarningsService) {}

  @Get("summary")
  summary(@CurrentActor() actor: Actor) {
    return this.earnings.summary(actor);
  }

  @Get("transactions")
  transactions(
    @CurrentActor() actor: Actor,
    @Query(contractPipe("EarningsTransactionsQueryParams")) query: EarningsTransactionsQuery,
  ) {
    return this.earnings.transactions(actor, query);
  }
}
