import { Injectable } from "@nestjs/common";
import type { Prisma, User } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

const userInclude = {
  provider: { select: { id: true, hidden: true, verificationStatus: true } },
} satisfies Prisma.UserInclude;

export type UserWithProvider = User & {
  provider: Prisma.UserGetPayload<{ include: typeof userInclude }>["provider"];
};

@Injectable()
export class IdentityRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByAuthUserId(authUserId: string): Promise<UserWithProvider | null> {
    return this.prisma.user.findUnique({ where: { authUserId }, include: userInclude });
  }

  findById(userId: string): Promise<UserWithProvider | null> {
    return this.prisma.user.findUnique({ where: { id: userId }, include: userInclude });
  }

  createUser(params: { authUserId: string; email?: string; phone?: string }): Promise<UserWithProvider> {
    return this.prisma.user.create({
      data: {
        authUserId: params.authUserId,
        email: params.email,
        phone: params.phone,
        lastLoginAt: new Date(),
      },
      include: userInclude,
    });
  }

  update(userId: string, data: Prisma.UserUncheckedUpdateInput): Promise<UserWithProvider> {
    return this.prisma.user.update({ where: { id: userId }, data, include: userInclude });
  }

  findProviderPhoto(userId: string): Promise<{ profilePhoto: string | null } | null> {
    return this.prisma.provider.findUnique({
      where: { userId },
      select: { profilePhoto: true },
    });
  }
}
