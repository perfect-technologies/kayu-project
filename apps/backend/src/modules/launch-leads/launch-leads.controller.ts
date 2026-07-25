import {
  Body,
  Controller,
  Post,
  Req,
  UseFilters,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { LazyZodValidationPipe } from "../../common";
import { LaunchIntakeGuard } from "./launch-intake.guard";
import { LaunchLeadsService } from "./launch-leads.service";
import { LaunchRateLimitFilter } from "./launch-rate-limit.filter";
import type {
  CreateClientLeadInput,
  CreateProviderLeadInput,
} from "./launch-leads.types";

const providerLeadPipe = new LazyZodValidationPipe(async () => {
  const { CreateProviderLeadDto } = await import("@kayu/schemas");
  return CreateProviderLeadDto;
});

const clientLeadPipe = new LazyZodValidationPipe(async () => {
  const { CreateClientLeadDto } = await import("@kayu/schemas");
  return CreateClientLeadDto;
});

@Controller("launch")
@UseGuards(LaunchIntakeGuard)
@UseFilters(LaunchRateLimitFilter)
export class LaunchLeadsController {
  constructor(private readonly leads: LaunchLeadsService) {}

  @Post("provider-leads")
  submitProvider(
    @Body(providerLeadPipe) body: CreateProviderLeadInput,
    @Req() request: Request,
  ) {
    return this.leads.createProviderLead(body, { ip: request.ip });
  }

  @Post("client-leads")
  submitClient(
    @Body(clientLeadPipe) body: CreateClientLeadInput,
    @Req() request: Request,
  ) {
    return this.leads.createClientLead(body, { ip: request.ip });
  }
}
