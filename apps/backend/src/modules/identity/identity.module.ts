import { Global, Module } from "@nestjs/common";
import { ACTOR_RESOLVER } from "../../common/auth/actor-resolver.interface";
import { ActorGuard } from "../../common/guards/actor.guard";
import { OptionalActorGuard } from "../../common/guards/optional-actor.guard";
import { AccountService } from "./account.service";
import { IdentityController } from "./identity.controller";
import { IdentityRepository } from "./identity.repository";
import { IdentityService } from "./identity.service";

@Global()
@Module({
  controllers: [IdentityController],
  providers: [
    IdentityRepository,
    IdentityService,
    AccountService,
    ActorGuard,
    OptionalActorGuard,
    {
      provide: ACTOR_RESOLVER,
      useExisting: IdentityService,
    },
  ],
  exports: [IdentityService, ActorGuard, OptionalActorGuard, ACTOR_RESOLVER],
})
export class IdentityModule {}
