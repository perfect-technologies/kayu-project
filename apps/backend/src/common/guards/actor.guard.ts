import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ACTOR_RESOLVER,
  type IActorResolver,
} from "../auth/actor-resolver.interface";
import type { AuthenticatedRequest } from "../auth/types";

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

    if (!actor.isActive) {
      throw new ForbiddenException("User account is inactive");
    }

    req.actor = actor;
    return true;
  }
}
