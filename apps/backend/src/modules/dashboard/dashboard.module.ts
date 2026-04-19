import { Module } from "@nestjs/common";
import { JobRequestsModule } from "../job-requests/job-requests.module";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";

@Module({
  imports: [JobRequestsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
