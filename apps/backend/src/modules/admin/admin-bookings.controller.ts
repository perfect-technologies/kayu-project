import {
  Body,
  Controller,
  Get,
  HttpCode,
  Ip,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import type { AdminBookingSearchQuery, AdminCancelBookingInput } from "../../common/contract";
import { contractPipe } from "../../common/contract/pipe";
import { CurrentActor } from "../../common/decorators/current-actor.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ActorGuard } from "../../common/guards/actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { BookingsService } from "../bookings/bookings.service";
import { AdminBookingsService } from "./admin-bookings.service";

@Controller("admin/bookings")
@Roles("ADMIN")
@UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
export class AdminBookingsController {
  constructor(
    private readonly adminBookings: AdminBookingsService,
    private readonly bookings: BookingsService,
  ) {}

  @Get()
  list(@Query(contractPipe("AdminBookingSearchParams")) query: AdminBookingSearchQuery) {
    return this.adminBookings.list(query);
  }

  @Post(":id/cancel")
  @HttpCode(200)
  cancel(
    @CurrentActor() actor: Actor,
    @Param("id") id: string,
    @Body(contractPipe("AdminCancelBookingDto")) body: AdminCancelBookingInput,
    @Ip() ip: string,
  ) {
    return this.bookings.cancel(actor, id, { reason: body.reason }, { ipAddress: ip });
  }
}
