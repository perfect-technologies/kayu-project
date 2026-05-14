import {
  Body,
  Controller,
  Get,
  Patch,
  PipeTransform,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { ZodType } from "zod";
import { CurrentActor } from "../../common/decorators/current-actor.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ActorGuard } from "../../common/guards/actor.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import type { Actor, AuthContextUser } from "../../common/auth/types";
import {
  IdentityService,
  type ProfileBody,
  type ProviderOnboardingBody,
} from "./identity.service";
import { RecentAddressesService } from "./recent-addresses.service";

class LazyZodValidationPipe implements PipeTransform {
  private schema?: Promise<ZodType>;

  constructor(private readonly loadSchema: () => Promise<ZodType>) {}

  async transform(value: unknown) {
    this.schema ??= this.loadSchema();
    return new ZodValidationPipe(await this.schema).transform(value);
  }
}

type SetRoleBody = {
  role: "CLIENT" | "PROVIDER";
};

const profileBodyPipe = new LazyZodValidationPipe(async () => {
  const { CompleteProfileDto } = await import("@kayu/schemas");
  return CompleteProfileDto.omit({ role: true });
});

const setRoleBodyPipe = new LazyZodValidationPipe(async () => {
  const { UserRole } = await import("@kayu/schemas");
  return (await import("zod")).z.object({
    role: UserRole.refine((role) => role !== "ADMIN", {
      message: "Role must be CLIENT or PROVIDER",
    }),
  });
});

const providerOnboardingPipe = new LazyZodValidationPipe(async () => {
  const { ProviderOnboardingDto } = await import("@kayu/schemas");
  return ProviderOnboardingDto;
});

@Controller("me")
export class IdentityController {
  constructor(
    private readonly identity: IdentityService,
    private readonly recentAddresses: RecentAddressesService,
  ) {}

  @Get()
  @UseGuards(SupabaseGuard)
  getMe(@CurrentUser() authUser: AuthContextUser) {
    return this.identity.getMe(authUser);
  }

  @Get("recent-addresses")
  @UseGuards(SupabaseGuard, ActorGuard)
  getRecentAddresses(
    @CurrentActor() actor: Actor,
    @Query("limit") limitStr?: string,
  ) {
    const limit = Math.min(Math.max(Number(limitStr) || 3, 1), 10);
    return this.recentAddresses.findForClient(actor.id, limit);
  }

  @Patch("profile")
  @UseGuards(SupabaseGuard, ActorGuard)
  completeProfile(
    @CurrentActor() actor: Actor,
    @Body(profileBodyPipe) body: ProfileBody,
  ) {
    return this.identity.completeProfile(actor, body);
  }

  @Patch("role")
  @UseGuards(SupabaseGuard, ActorGuard)
  setRole(
    @CurrentActor() actor: Actor,
    @Body(setRoleBodyPipe) body: SetRoleBody,
  ) {
    return this.identity.setRole(actor, body.role);
  }

  @Post("provider-onboarding")
  @Roles("PROVIDER")
  @UseGuards(SupabaseGuard, ActorGuard, RolesGuard)
  providerOnboarding(
    @CurrentActor() actor: Actor,
    @Body(providerOnboardingPipe)
    body: ProviderOnboardingBody,
  ) {
    return this.identity.providerOnboarding(actor, body);
  }
}
