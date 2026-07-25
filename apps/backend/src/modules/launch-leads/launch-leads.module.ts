import { Module } from "@nestjs/common";
import { LaunchIntakeGuard } from "./launch-intake.guard";
import { LaunchIntakeProtectionService } from "./launch-intake-protection.service";
import { LaunchLeadsController } from "./launch-leads.controller";
import { LaunchLeadsService } from "./launch-leads.service";

@Module({
  controllers: [LaunchLeadsController],
  providers: [
    LaunchLeadsService,
    LaunchIntakeProtectionService,
    LaunchIntakeGuard,
  ],
})
export class LaunchLeadsModule {}
