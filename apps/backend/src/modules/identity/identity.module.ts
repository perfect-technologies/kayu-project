import { Global, Module } from "@nestjs/common";
import { ACTOR_RESOLVER } from "../../common/auth/actor-resolver.interface";
import { ActorGuard } from "../../common/guards/actor.guard";
import { IdentityController } from "./identity.controller";
import { IdentityRepository } from "./identity.repository";
import { IdentityService } from "./identity.service";

@Global()
@Module({
  controllers: [IdentityController],
  providers: [
    IdentityRepository,
    IdentityService,
    ActorGuard,
    {
      provide: ACTOR_RESOLVER,
      useExisting: IdentityService,
    },
  ],
  exports: [IdentityService, ActorGuard, ACTOR_RESOLVER],
})
export class IdentityModule {}
