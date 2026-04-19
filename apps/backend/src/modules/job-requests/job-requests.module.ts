import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { JobRequestsController } from "./job-requests.controller";
import { JobRequestsService } from "./job-requests.service";

@Module({
  imports: [NotificationsModule],
  controllers: [JobRequestsController],
  providers: [JobRequestsService],
  exports: [JobRequestsService],
})
export class JobRequestsModule {}
