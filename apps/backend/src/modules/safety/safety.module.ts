import { Global, Module } from "@nestjs/common";
import { BlocksService } from "./blocks.service";
import { ReportsService } from "./reports.service";
import { SafetyController } from "./safety.controller";
import { SafetyService } from "./safety.service";

@Global()
@Module({
  controllers: [SafetyController],
  providers: [SafetyService, ReportsService, BlocksService],
  exports: [SafetyService],
})
export class SafetyModule {}
