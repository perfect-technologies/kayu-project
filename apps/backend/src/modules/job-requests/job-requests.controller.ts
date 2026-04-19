import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { CurrentActor, LazyZodValidationPipe, Roles } from "../../common";
import { ActorGuard } from "../../common/guards/actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { JobRequestsService } from "./job-requests.service";

type CreateJobRequestBody = {
  categoryId?: string;
  subcategoryId?: string;
  service: string;
  description: string;
  address: string;
  city: string;
  commune?: string;
  latitude?: number;
  longitude?: number;
  whenPref: string;
  estimatedHours?: number;
  budget?: number;
  urgent?: boolean;
  photoCount?: number;
};

const createJobRequestPipe = new LazyZodValidationPipe(async () => {
  const { CreateJobRequestDto } = await import("@kayu/schemas");
  return CreateJobRequestDto;
});

@Controller()
@UseGuards(SupabaseGuard, ActorGuard)
export class JobRequestsController {
  constructor(private readonly service: JobRequestsService) {}

  // -------- Client endpoints --------

  @Post("job-requests")
  @Roles("CLIENT", "ADMIN")
  @UseGuards(RolesGuard)
  create(
    @CurrentActor() actor: Actor,
    @Body(createJobRequestPipe) body: CreateJobRequestBody,
  ) {
    return this.service.create(actor, body);
  }

  @Get("job-requests/mine")
  @Roles("CLIENT", "ADMIN")
  @UseGuards(RolesGuard)
  mine(@CurrentActor() actor: Actor) {
    return this.service.mine(actor);
  }

  @Post("job-requests/:id/cancel")
  @Roles("CLIENT", "ADMIN")
  @UseGuards(RolesGuard)
  cancel(@CurrentActor() actor: Actor, @Param("id") id: string) {
    return this.service.cancel(actor, id);
  }

  // -------- Pro endpoints --------

  @Get("pro/requests")
  @Roles("PROVIDER")
  @UseGuards(RolesGuard)
  inbox(@CurrentActor() actor: Actor) {
    return this.service.inbox(actor);
  }

  @Get("pro/requests/:id")
  @Roles("PROVIDER")
  @UseGuards(RolesGuard)
  getForPro(@CurrentActor() actor: Actor, @Param("id") id: string) {
    return this.service.getForPro(actor, id);
  }

  @Post("pro/requests/:id/dismiss")
  @Roles("PROVIDER")
  @UseGuards(RolesGuard)
  dismiss(@CurrentActor() actor: Actor, @Param("id") id: string) {
    return this.service.dismiss(actor, id);
  }
}
