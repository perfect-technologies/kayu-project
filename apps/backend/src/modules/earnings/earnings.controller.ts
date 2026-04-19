import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import type { PayoutOperator, TransactionType } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import { CurrentActor, LazyZodValidationPipe } from "../../common";
import { ActorGuard } from "../../common/guards/actor.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { EarningsService } from "./earnings.service";

type TransactionsQuery = {
  type?: TransactionType;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

type CreatePayoutBody = {
  operator: PayoutOperator;
  amount: number;
  phone: string;
};

const transactionsQueryPipe = new LazyZodValidationPipe(async () => {
  const { EarningsTransactionSearchParams } = await import("@kayu/schemas");
  return EarningsTransactionSearchParams;
});

const createPayoutBodyPipe = new LazyZodValidationPipe(async () => {
  const { CreatePayoutDto } = await import("@kayu/schemas");
  return CreatePayoutDto;
});

@Controller("pro/earnings")
@UseGuards(SupabaseGuard, ActorGuard)
export class EarningsController {
  constructor(private readonly earnings: EarningsService) {}

  @Get("summary")
  summary(@CurrentActor() actor: Actor) {
    return this.earnings.summary(actor);
  }

  @Get("transactions")
  transactions(
    @CurrentActor() actor: Actor,
    @Query(transactionsQueryPipe) query: TransactionsQuery,
  ) {
    return this.earnings.transactions(actor, query);
  }

  @Post("payouts")
  createPayout(
    @CurrentActor() actor: Actor,
    @Body(createPayoutBodyPipe) body: CreatePayoutBody,
  ) {
    return this.earnings.createPayout(actor, body);
  }

  @Get("payouts")
  payouts(@CurrentActor() actor: Actor) {
    return this.earnings.payouts(actor);
  }
}
