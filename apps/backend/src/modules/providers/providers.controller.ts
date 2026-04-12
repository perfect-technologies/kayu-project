import {
  Body,
  Controller,
  Get,
  Patch,
  Query,
  Req,
  Param,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { CurrentActor, LazyZodValidationPipe, Roles } from "../../common";
import { ActorGuard } from "../../common/guards/actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import type { Actor } from "../../common/auth/types";
import { ProvidersService } from "./providers.service";

type ProviderSearchQuery = {
  q?: string;
  category?: string;
  subcategory?: string;
  city?: string;
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
  available?: boolean;
  verified?: boolean;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

type UpdateProviderBody = {
  profession?: string;
  description?: string | null;
  experience?: number | null;
  hourlyRate?: number | null;
  isAvailable?: boolean;
  categoryIds?: string[];
  skills?: Array<{
    name: string;
    level?: number;
  }>;
  serviceZones?: Array<{
    city: string;
    commune?: string | null;
  }>;
  tradeIds?: string[];
  primaryTradeId?: string | null;
};

const providersQueryPipe = new LazyZodValidationPipe(async () => {
  const { ProviderSearchParams } = await import("@kayu/schemas");
  return ProviderSearchParams;
});

const updateProviderBodyPipe = new LazyZodValidationPipe(async () => {
  const { UpdateProviderDto } = await import("@kayu/schemas");
  return UpdateProviderDto;
});

@Controller("providers")
export class ProvidersController {
  constructor(private readonly providers: ProvidersService) {}

  @Get()
  search(@Query(providersQueryPipe) query: ProviderSearchQuery) {
    return this.providers.search(query);
  }

  @Patch("me")
  @Roles("PROVIDER")
  @UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
  updateMe(
    @CurrentActor() actor: Actor,
    @Body(updateProviderBodyPipe) body: UpdateProviderBody,
  ) {
    return this.providers.updateMe(actor, body);
  }

  @Get(":id")
  async findById(@Param("id") id: string, @Req() request: Request) {
    const viewer = await this.providers.resolveViewer(request);
    return this.providers.findById(id, viewer);
  }
}
