import { Module } from "@nestjs/common";
import { BookingViewService } from "./booking-view.service";
import { BookingsController } from "./bookings.controller";
import { BookingsService } from "./bookings.service";

@Module({
  controllers: [BookingsController],
  providers: [BookingsService, BookingViewService],
  exports: [BookingsService, BookingViewService],
})
export class BookingsModule {}
