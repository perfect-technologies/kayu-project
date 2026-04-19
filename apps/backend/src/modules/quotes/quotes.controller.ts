import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { CurrentActor, LazyZodValidationPipe, Roles } from "../../common";
import { ActorGuard } from "../../common/guards/actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { QuotesService } from "./quotes.service";

type CreateQuoteBody = {
  jobRequestId?: string;
  lines: {
    label: string;
    qty: number;
    unit: string;
    unitPrice: number;
  }[];
  message: string;
  validityDays: number;
  startDateKind: string;
  discountPct: number;
};

type UpdateQuoteBody = Partial<CreateQuoteBody>;

const createQuotePipe = new LazyZodValidationPipe(async () => {
  const { CreateQuoteDto } = await import("@kayu/schemas");
  return CreateQuoteDto;
});

const updateQuotePipe = new LazyZodValidationPipe(async () => {
  const { UpdateQuoteDto } = await import("@kayu/schemas");
  return UpdateQuoteDto;
});

@Controller()
@UseGuards(SupabaseGuard, ActorGuard)
export class QuotesController {
  constructor(private readonly service: QuotesService) {}

  // -------- Pro endpoints --------

  @Get("pro/quotes")
  @Roles("PROVIDER", "ADMIN")
  @UseGuards(RolesGuard)
  listMine(@CurrentActor() actor: Actor) {
    return this.service.listMine(actor);
  }

  @Post("pro/quotes")
  @Roles("PROVIDER", "ADMIN")
  @UseGuards(RolesGuard)
  create(
    @CurrentActor() actor: Actor,
    @Body(createQuotePipe) body: CreateQuoteBody,
  ) {
    return this.service.create(actor, body);
  }

  @Patch("pro/quotes/:id")
  @Roles("PROVIDER", "ADMIN")
  @UseGuards(RolesGuard)
  update(
    @CurrentActor() actor: Actor,
    @Param("id") id: string,
    @Body(updateQuotePipe) body: UpdateQuoteBody,
  ) {
    return this.service.update(actor, id, body);
  }

  @Post("pro/quotes/:id/send")
  @Roles("PROVIDER", "ADMIN")
  @UseGuards(RolesGuard)
  send(@CurrentActor() actor: Actor, @Param("id") id: string) {
    return this.service.send(actor, id);
  }

  @Get("pro/quotes/:id")
  @Roles("PROVIDER", "ADMIN")
  @UseGuards(RolesGuard)
  getForPro(@CurrentActor() actor: Actor, @Param("id") id: string) {
    return this.service.getForPro(actor, id);
  }

  // -------- Client endpoints --------

  @Get("job-requests/:id/quotes")
  @Roles("CLIENT", "ADMIN")
  @UseGuards(RolesGuard)
  listForJobRequest(
    @CurrentActor() actor: Actor,
    @Param("id") id: string,
  ) {
    return this.service.listForJobRequest(actor, id);
  }

  @Get("quotes/:id")
  getForClient(@CurrentActor() actor: Actor, @Param("id") id: string) {
    return this.service.getForClient(actor, id);
  }

  @Post("quotes/:id/accept")
  @Roles("CLIENT", "ADMIN")
  @UseGuards(RolesGuard)
  accept(@CurrentActor() actor: Actor, @Param("id") id: string) {
    return this.service.accept(actor, id);
  }

  @Post("quotes/:id/decline")
  @Roles("CLIENT", "ADMIN")
  @UseGuards(RolesGuard)
  decline(@CurrentActor() actor: Actor, @Param("id") id: string) {
    return this.service.decline(actor, id);
  }
}
