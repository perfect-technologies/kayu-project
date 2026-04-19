import { Injectable } from "@nestjs/common";
import type { Prisma, User } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

const providerInclude = {
  user: true,
  categories: {
    include: {
      category: true,
    },
  },
  skills: true,
  serviceZones: true,
  trades: {
    include: {
      trade: true,
    },
  },
  trustScore: {
    include: {
      badges: true,
    },
  },
} satisfies Prisma.ProviderInclude;

export type ProviderWithRelations = Prisma.ProviderGetPayload<{
  include: typeof providerInclude;
}>;

export type UserWithProvider = User & {
  provider: ProviderWithRelations | null;
};

export type ProviderOnboardingData = {
  profession: string;
  description?: string;
  experience?: number;
  hourlyRate?: number;
  categoryIds: string[];
  skills: string[];
  serviceZones: Array<{
    city: string;
    commune?: string | null;
  }>;
  tradeIds: string[];
  primaryTradeId?: string;
};

export type UserProfileData = {
  firstName: string;
  lastName: string;
  city?: string;
  country: string;
  phone?: string;
  email?: string;
  avatar?: string;
  latitude?: number;
  longitude?: number;
};

@Injectable()
export class IdentityRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByAuthUserId(authUserId: string): Promise<UserWithProvider | null> {
    return this.prisma.user.findUnique({
      where: { authUserId },
      include: { provider: { include: providerInclude } },
    });
  }

  findById(userId: string): Promise<UserWithProvider | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { provider: { include: providerInclude } },
    });
  }

  async createUser(params: {
    authUserId: string;
    email?: string;
    phone?: string;
  }): Promise<UserWithProvider> {
    const user = await this.prisma.user.create({
      data: {
        authUserId: params.authUserId,
        email: params.email,
        phone: params.phone,
        lastLoginAt: new Date(),
      },
    });

    return { ...user, provider: null };
  }

  updateAuthFields(
    userId: string,
    data: Prisma.UserUpdateInput,
  ): Promise<UserWithProvider> {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      include: { provider: { include: providerInclude } },
    });
  }

  updateProfile(userId: string, body: UserProfileData): Promise<UserWithProvider> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        city: body.city,
        country: body.country,
        phone: body.phone,
        email: body.email,
        avatar: body.avatar,
        latitude: body.latitude,
        longitude: body.longitude,
      },
      include: { provider: { include: providerInclude } },
    });
  }

  setRole(userId: string, role: "CLIENT" | "PROVIDER"): Promise<UserWithProvider> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      include: { provider: { include: providerInclude } },
    });
  }

  countCategories(categoryIds: string[]): Promise<number> {
    if (categoryIds.length === 0) return Promise.resolve(0);

    return this.prisma.category.count({
      where: {
        id: { in: categoryIds },
        isActive: true,
      },
    });
  }

  countTrades(tradeIds: string[]): Promise<number> {
    if (tradeIds.length === 0) return Promise.resolve(0);

    return this.prisma.trade.count({
      where: {
        id: { in: tradeIds },
        isActive: true,
      },
    });
  }

  async createProviderProfile(
    userId: string,
    data: ProviderOnboardingData,
  ): Promise<ProviderWithRelations> {
    return this.prisma.$transaction((tx) =>
      tx.provider.create({
        data: {
          userId,
          profession: data.profession,
          description: data.description,
          experience: data.experience,
          hourlyRate: data.hourlyRate,
          categories: {
            create: data.categoryIds.map((categoryId) => ({ categoryId })),
          },
          skills: {
            create: data.skills.map((name) => ({ name })),
          },
          serviceZones: {
            create: data.serviceZones.map((zone) => ({
              city: zone.city,
              commune: zone.commune,
            })),
          },
          trades: {
            create: data.tradeIds.map((tradeId, index) => ({
              tradeId,
              isPrimary: data.primaryTradeId
                ? tradeId === data.primaryTradeId
                : index === 0,
              experience: data.experience,
            })),
          },
          trustScore: {
            create: {},
          },
        },
        include: providerInclude,
      }),
    );
  }
}
