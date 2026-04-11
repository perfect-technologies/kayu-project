import {
  CanActivate,
  ConflictException,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Prisma, User } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import type { AuthenticatedRequest, AuthContextUser } from "../auth/types";

@Injectable()
export class ActorGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authUser = req.user;

    if (!authUser?.authUserId) {
      throw new UnauthorizedException("Missing auth user");
    }

    const actor = await this.resolveActor(authUser);

    if (!actor.isActive) {
      throw new ForbiddenException("User account is inactive");
    }

    req.actor = actor;
    return true;
  }

  private async resolveActor(authUser: AuthContextUser): Promise<User> {
    const existing = await this.prisma.user.findUnique({
      where: { authUserId: authUser.authUserId },
    });

    if (!existing) {
      return this.createActor(authUser);
    }

    const data: Prisma.UserUpdateInput = {};

    if (authUser.email && authUser.email !== existing.email) {
      data.email = authUser.email;
    }

    if (authUser.phone && authUser.phone !== existing.phone) {
      data.phone = authUser.phone;
    }

    if (Object.keys(data).length === 0) return existing;

    try {
      return await this.prisma.user.update({
        where: { id: existing.id },
        data,
      });
    } catch {
      throw new ConflictException("Unable to sync local user account");
    }
  }

  private async createActor(authUser: AuthContextUser): Promise<User> {
    try {
      return await this.prisma.user.create({
        data: {
          authUserId: authUser.authUserId,
          email: authUser.email,
          phone: authUser.phone,
          lastLoginAt: new Date(),
        },
      });
    } catch {
      throw new ConflictException("Unable to create local user account");
    }
  }
}
