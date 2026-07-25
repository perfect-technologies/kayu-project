import {
  Body,
  Controller,
  Post,
  UseFilters,
  UseGuards,
} from "@nestjs/common";
import { LazyZodValidationPipe } from "../../common";
import { LaunchFunnelGuard } from "./launch-funnel.guard";
import { LaunchFunnelService } from "./launch-funnel.service";
import type { CreateLaunchFunnelEventInput } from "./launch-leads.types";
import { LaunchRateLimitFilter } from "./launch-rate-limit.filter";

const funnelEventPipe = new LazyZodValidationPipe(async () => {
  const { CreateLaunchFunnelEventDto } = await import("@kayu/schemas");
  return CreateLaunchFunnelEventDto;
});

@Controller("launch")
@UseGuards(LaunchFunnelGuard)
@UseFilters(LaunchRateLimitFilter)
export class LaunchFunnelController {
  constructor(private readonly funnel: LaunchFunnelService) {}

  @Post("funnel-events")
  createEvent(
    @Body(funnelEventPipe) body: CreateLaunchFunnelEventInput,
  ) {
    return this.funnel.createEvent(body);
  }
}
