import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { UserRole } from "@prisma/client";
import { ROLES_KEY } from "../decorators/roles.decorator";
import type { AuthenticatedRequest } from "../auth/types";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) return true;

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const actor = req.actor;

    if (!actor?.role) {
      throw new ForbiddenException("Missing actor role");
    }

    if (!requiredRoles.includes(actor.role)) {
      throw new ForbiddenException("Forbidden");
    }

    return true;
  }
}
