import { Module } from "@nestjs/common";
import { LaunchIntakeGuard } from "./launch-intake.guard";
import { LaunchIntakeProtectionService } from "./launch-intake-protection.service";
import { LaunchFunnelController } from "./launch-funnel.controller";
import { LaunchFunnelGuard } from "./launch-funnel.guard";
import { LaunchFunnelService } from "./launch-funnel.service";
import { LaunchLeadsController } from "./launch-leads.controller";
import { LaunchLeadsService } from "./launch-leads.service";

@Module({
  controllers: [LaunchLeadsController, LaunchFunnelController],
  providers: [
    LaunchLeadsService,
    LaunchIntakeProtectionService,
    LaunchIntakeGuard,
    LaunchFunnelGuard,
    LaunchFunnelService,
  ],
})
export class LaunchLeadsModule {}
