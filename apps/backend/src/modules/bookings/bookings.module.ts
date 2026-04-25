import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { BookingsController } from "./bookings.controller";
import { BookingsService } from "./bookings.service";
import { FinalOffersController } from "./final-offers.controller";

@Module({
  imports: [NotificationsModule],
  controllers: [BookingsController, FinalOffersController],
  providers: [BookingsService],
})
export class BookingsModule {}
