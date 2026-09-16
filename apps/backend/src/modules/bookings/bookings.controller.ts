import {
  Body,
  Controller,
  Get,
  HttpCode,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import type {
  BookingsQuery,
  CancelBookingInput,
  CompleteBookingInput,
  CreateBookingInput,
  UpdateBookingNotesInput,
} from "../../common/contract";
import { contractPipe } from "../../common/contract/pipe";
import { CurrentActor } from "../../common/decorators/current-actor.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ActorGuard } from "../../common/guards/actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { BookingsService } from "./bookings.service";

@Controller("bookings")
@UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post()
  @Roles("CLIENT")
  create(
    @CurrentActor() actor: Actor,
    @Body(contractPipe("CreateBookingDto")) body: CreateBookingInput,
  ) {
    return this.bookings.create(actor, body);
  }

  @Get()
  list(
    @CurrentActor() actor: Actor,
    @Query(contractPipe("BookingsQueryParams")) query: BookingsQuery,
  ) {
    return this.bookings.list(actor, query);
  }

  @Get(":id")
  get(@CurrentActor() actor: Actor, @Param("id") id: string) {
    return this.bookings.get(actor, id);
  }

  @Post(":id/confirm")
  @Roles("PROVIDER")
  @HttpCode(200)
  confirm(@CurrentActor() actor: Actor, @Param("id") id: string) {
    return this.bookings.confirm(actor, id);
  }

  @Post(":id/complete")
  @Roles("PROVIDER")
  @HttpCode(200)
  complete(
    @CurrentActor() actor: Actor,
    @Param("id") id: string,
    @Body(contractPipe("CompleteBookingDto")) body: CompleteBookingInput,
  ) {
    return this.bookings.complete(actor, id, body);
  }

  @Post(":id/cancel")
  @HttpCode(200)
  cancel(
    @CurrentActor() actor: Actor,
    @Param("id") id: string,
    @Body(contractPipe("CancelBookingDto")) body: CancelBookingInput,
    @Ip() ipAddress: string,
  ) {
    return this.bookings.cancel(actor, id, body, { ipAddress });
  }

  @Patch(":id/notes")
  @Roles("PROVIDER")
  updateNotes(
    @CurrentActor() actor: Actor,
    @Param("id") id: string,
    @Body(contractPipe("UpdateBookingNotesDto")) body: UpdateBookingNotesInput,
  ) {
    return this.bookings.updateNotes(actor, id, body);
  }
}
