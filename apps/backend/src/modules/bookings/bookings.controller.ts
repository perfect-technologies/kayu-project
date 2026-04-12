import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import {
  CurrentActor,
  LazyZodValidationPipe,
  Roles,
} from "../../common";
import { ActorGuard } from "../../common/guards/actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { BookingsService } from "./bookings.service";

type BookingQuery = {
  status?: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  role: "client" | "provider";
  page: number;
  limit: number;
};

type CreateBookingBody = {
  providerId: string;
  title: string;
  description?: string;
  address?: string;
  city?: string;
  scheduledDate: Date;
  duration?: number;
  price?: number;
  clientNotes?: string;
};

type UpdateBookingBody = {
  status?: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  cancelReason?: string;
  providerNotes?: string;
};

const bookingsQueryPipe = new LazyZodValidationPipe(async () => {
  const { BookingSearchParams } = await import("@kayu/schemas");
  return BookingSearchParams;
});

const createBookingBodyPipe = new LazyZodValidationPipe(async () => {
  const { CreateBookingDto } = await import("@kayu/schemas");
  return CreateBookingDto;
});

const updateBookingBodyPipe = new LazyZodValidationPipe(async () => {
  const { UpdateBookingDto } = await import("@kayu/schemas");
  return UpdateBookingDto;
});

@Controller("bookings")
@UseGuards(SupabaseGuard, ActorGuard)
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get()
  findAll(@CurrentActor() actor: Actor, @Query(bookingsQueryPipe) query: BookingQuery) {
    return this.bookings.findAll(actor, query);
  }

  @Post()
  @Roles("CLIENT")
  @UseGuards(RolesGuard)
  create(
    @CurrentActor() actor: Actor,
    @Body(createBookingBodyPipe) body: CreateBookingBody,
  ) {
    return this.bookings.create(actor, body);
  }

  @Get(":id")
  findById(@CurrentActor() actor: Actor, @Param("id") id: string) {
    return this.bookings.findById(actor, id);
  }

  @Patch(":id")
  update(
    @CurrentActor() actor: Actor,
    @Param("id") id: string,
    @Body(updateBookingBodyPipe) body: UpdateBookingBody,
  ) {
    return this.bookings.update(actor, id, body);
  }

  @Delete(":id")
  cancel(@CurrentActor() actor: Actor, @Param("id") id: string) {
    return this.bookings.cancel(actor, id);
  }
}
