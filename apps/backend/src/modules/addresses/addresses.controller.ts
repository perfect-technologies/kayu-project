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
import type {
  AddressesQuery,
  CreateAddressInput,
  UpdateAddressInput,
} from "../../common/contract";
import { contractPipe } from "../../common/contract/pipe";
import { CurrentActor } from "../../common/decorators/current-actor.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ActorGuard } from "../../common/guards/actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { AddressesService } from "./addresses.service";

@Controller("addresses")
@Roles("CLIENT")
@UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  list(
    @CurrentActor() actor: Actor,
    @Query(contractPipe("AddressesQueryParams")) query: AddressesQuery,
  ) {
    return this.addresses.list(actor, query);
  }

  @Post()
  create(
    @CurrentActor() actor: Actor,
    @Body(contractPipe("CreateAddressDto")) body: CreateAddressInput,
  ) {
    return this.addresses.create(actor, body);
  }

  @Patch(":id")
  update(
    @CurrentActor() actor: Actor,
    @Param("id") id: string,
    @Body(contractPipe("UpdateAddressDto")) body: UpdateAddressInput,
  ) {
    return this.addresses.update(actor, id, body);
  }

  @Delete(":id")
  remove(@CurrentActor() actor: Actor, @Param("id") id: string) {
    return this.addresses.remove(actor, id);
  }
}
