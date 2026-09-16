import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ACTOR_RESOLVER,
  type IActorResolver,
} from "../auth/actor-resolver.interface";
import type { Actor, AuthenticatedRequest } from "../auth/types";
import { apiError } from "../http/errors";

export function assertActive(actor: Actor): void {
  if (!actor.isActive) {
    throw apiError(HttpStatus.FORBIDDEN, "ACCOUNT_SUSPENDED", "Votre compte est suspendu.", {
      suspendedReason: actor.suspendedReason ?? null,
    });
  }
}

@Injectable()
export class ActorGuard implements CanActivate {
  constructor(
    @Inject(ACTOR_RESOLVER) private readonly actorResolver: IActorResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authUser = req.user;

    if (!authUser?.authUserId) {
      throw new UnauthorizedException("Missing auth user");
    }

    const actor = await this.actorResolver.resolve(authUser);
    assertActive(actor);

    req.actor = actor;
    return true;
  }
}
