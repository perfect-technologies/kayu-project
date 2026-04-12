import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { CurrentActor, LazyZodValidationPipe } from "../../common";
import { ActorGuard } from "../../common/guards/actor.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { FavoritesService } from "./favorites.service";

type FavoriteBody = {
  providerId: string;
};

const favoriteBodyPipe = new LazyZodValidationPipe(async () => {
  const { FavoriteProviderDto } = await import("@kayu/schemas");
  return FavoriteProviderDto;
});

@Controller("favorites")
@UseGuards(SupabaseGuard, ActorGuard)
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  findAll(@CurrentActor() actor: Actor, @Query("providerId") providerId?: string) {
    return this.favorites.findAll(actor, providerId);
  }

  @Post()
  add(@CurrentActor() actor: Actor, @Body(favoriteBodyPipe) body: FavoriteBody) {
    return this.favorites.add(actor, body);
  }

  @Delete()
  remove(@CurrentActor() actor: Actor, @Body(favoriteBodyPipe) body: FavoriteBody) {
    return this.favorites.remove(actor, body);
  }
}
