import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { CurrentActor, LazyZodValidationPipe, Roles } from "../../common";
import { ActorGuard } from "../../common/guards/actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { BookingsService } from "./bookings.service";

type FinalOfferQuery = {
  status?: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "EXPIRED";
  conversationId?: string;
  bookingId?: string;
  page: number;
  limit: number;
};

type CreateFinalOfferBody = {
  providerId: string;
  clientId: string;
  conversationId?: string;
  bookingId?: string;
  title: string;
  description?: string;
  price: number;
  duration?: number;
  scheduledDate: Date;
  address?: string;
  city?: string;
  notes?: string;
  paymentMethod?: "cash";
  expiresAt?: Date;
};

const finalOfferQueryPipe = new LazyZodValidationPipe(async () => {
  const { FinalOfferSearchParams } = await import("@kayu/schemas");
  return FinalOfferSearchParams;
});

const createFinalOfferBodyPipe = new LazyZodValidationPipe(async () => {
  const { CreateFinalOfferDto } = await import("@kayu/schemas");
  return CreateFinalOfferDto;
});

@Controller("final-offers")
@UseGuards(SupabaseGuard, ActorGuard)
export class FinalOffersController {
  constructor(private readonly bookings: BookingsService) {}

  @Get()
  findAll(
    @CurrentActor() actor: Actor,
    @Query(finalOfferQueryPipe) query: FinalOfferQuery,
  ) {
    return this.bookings.findFinalOffers(actor, query);
  }

  @Post()
  @Roles("PROVIDER")
  @UseGuards(RolesGuard)
  create(
    @CurrentActor() actor: Actor,
    @Body(createFinalOfferBodyPipe) body: CreateFinalOfferBody,
  ) {
    return this.bookings.createFinalOffer(actor, body);
  }

  @Get(":id")
  findById(@CurrentActor() actor: Actor, @Param("id") id: string) {
    return this.bookings.findFinalOfferById(actor, id);
  }

  @Post(":id/accept")
  @Roles("CLIENT")
  @UseGuards(RolesGuard)
  accept(@CurrentActor() actor: Actor, @Param("id") id: string) {
    return this.bookings.acceptFinalOffer(actor, id);
  }

  @Post(":id/decline")
  @Roles("CLIENT")
  @UseGuards(RolesGuard)
  decline(@CurrentActor() actor: Actor, @Param("id") id: string) {
    return this.bookings.declineFinalOffer(actor, id);
  }
}
