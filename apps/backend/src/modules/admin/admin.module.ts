import { Module } from "@nestjs/common";
import { BookingsModule } from "../bookings/bookings.module";
import { AdminBookingsController } from "./admin-bookings.controller";
import { AdminBookingsService } from "./admin-bookings.service";
import { AdminModerationController } from "./admin-moderation.controller";
import { AdminModerationService } from "./admin-moderation.service";
import { AdminProvidersController } from "./admin-providers.controller";
import { AdminProvidersService } from "./admin-providers.service";
import { AdminSystemController } from "./admin-system.controller";
import { AdminSystemService } from "./admin-system.service";
import { AdminUsersController } from "./admin-users.controller";
import { AdminUsersService } from "./admin-users.service";
import { AdminVerificationController } from "./admin-verification.controller";
import { AdminVerificationService } from "./admin-verification.service";

@Module({
  imports: [BookingsModule],
  controllers: [
    AdminSystemController,
    AdminUsersController,
    AdminProvidersController,
    AdminVerificationController,
    AdminBookingsController,
    AdminModerationController,
  ],
  providers: [
    AdminSystemService,
    AdminUsersService,
    AdminProvidersService,
    AdminVerificationService,
    AdminBookingsService,
    AdminModerationService,
  ],
})
export class AdminModule {}
