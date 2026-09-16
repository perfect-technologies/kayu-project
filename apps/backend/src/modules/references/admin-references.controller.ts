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
  AdminCreateReferenceInput,
  AdminMergeInput,
  AdminReferenceSearchQuery,
  AdminUpdateReferenceInput,
} from "../../common/contract";
import { contractPipe } from "../../common/contract/pipe";
import { CurrentActor } from "../../common/decorators/current-actor.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ActorGuard } from "../../common/guards/actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { AdminReferencesService } from "./admin-references.service";

@Controller("admin/references")
@Roles("ADMIN")
@UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
export class AdminReferencesController {
  constructor(private readonly references: AdminReferencesService) {}

  @Get()
  list(@Query(contractPipe("AdminReferenceSearchParams")) query: AdminReferenceSearchQuery) {
    return this.references.list(query);
  }

  @Post()
  create(
    @CurrentActor() actor: Actor,
    @Body(contractPipe("AdminCreateReferenceDto")) body: AdminCreateReferenceInput,
    @Ip() ip: string,
  ) {
    return this.references.create(actor, body, ip);
  }

  @Post("merge")
  @HttpCode(200)
  merge(
    @CurrentActor() actor: Actor,
    @Body(contractPipe("AdminMergeDto")) body: AdminMergeInput,
    @Ip() ip: string,
  ) {
    return this.references.merge(actor, body, ip);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.references.get(id);
  }

  @Patch(":id")
  update(
    @CurrentActor() actor: Actor,
    @Param("id") id: string,
    @Body(contractPipe("AdminUpdateReferenceDto")) body: AdminUpdateReferenceInput,
    @Ip() ip: string,
  ) {
    return this.references.update(actor, id, body, ip);
  }
}
