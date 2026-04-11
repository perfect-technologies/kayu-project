import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma, UserRole } from "@prisma/client";
import type { IActorResolver } from "../../common/auth/actor-resolver.interface";
import type { Actor, AuthContextUser } from "../../common/auth/types";
import {
  IdentityRepository,
  type ProviderOnboardingData,
  type ProviderWithRelations,
  type UserProfileData,
  type UserWithProvider,
} from "./identity.repository";

export type ProfileBody = UserProfileData;

export type ProviderOnboardingBody = {
  profession: string;
  categoryIds: string[];
  skills: string[];
  serviceZones: Array<{
    city: string;
    commune?: string | null;
  }>;
  tradeIds: string[];
  primaryTradeId?: string;
  experience?: number;
  hourlyRate?: number;
  description?: string;
};

export type MeUser = Omit<UserWithProvider, "provider"> & {
  profileComplete: boolean;
  provider: ProviderResponse | null;
};

type ProviderResponse = Omit<ProviderWithRelations, "categories" | "trades"> & {
  categories: Array<ProviderWithRelations["categories"][number]["category"]>;
  trades: Array<
    ProviderWithRelations["trades"][number]["trade"] & {
      isPrimary: boolean;
      experience: number | null;
    }
  >;
  badges: NonNullable<ProviderWithRelations["trustScore"]>["badges"];
};

@Injectable()
export class IdentityService implements IActorResolver {
  constructor(private readonly repo: IdentityRepository) {}

  async resolve(authUser: AuthContextUser): Promise<Actor> {
    return this.getOrCreateUser(authUser);
  }

  async getMe(authUser: AuthContextUser): Promise<{ success: true; user: MeUser }> {
    const user = await this.getOrCreateUser(authUser);

    return {
      success: true,
      user: this.toMeUser(user),
    };
  }

  async completeProfile(
    actor: Actor,
    body: ProfileBody,
  ): Promise<{ success: true; user: MeUser }> {
    const user = await this.repo.updateProfile(actor.id, body).catch((error) => {
      throw this.toConflict(error, "Unable to update profile");
    });

    return {
      success: true,
      user: this.toMeUser(user),
    };
  }

  async setRole(
    actor: Actor,
    role: Exclude<UserRole, "ADMIN">,
  ): Promise<{ success: true; user: MeUser }> {
    if (actor.role === "ADMIN") {
      throw new ConflictException("Admin role cannot be changed here");
    }

    if (actor.role !== "CLIENT" && actor.role !== role) {
      throw new ConflictException("User role has already been set");
    }

    const user = await this.repo.setRole(actor.id, role).catch((error) => {
      throw this.toConflict(error, "Unable to update role");
    });

    return {
      success: true,
      user: this.toMeUser(user),
    };
  }

  async providerOnboarding(
    actor: Actor,
    body: ProviderOnboardingBody,
  ): Promise<{ success: true; provider: ProviderResponse }> {
    if (actor.role !== "PROVIDER") {
      throw new BadRequestException("User role must be PROVIDER");
    }

    const existing = await this.repo.findById(actor.id);
    if (!existing) throw new NotFoundException("User not found");
    if (existing.provider) {
      throw new ConflictException("Provider profile already exists");
    }

    const data = this.normalizeProviderOnboarding(body);
    await this.validateProviderOnboarding(data);

    const provider = await this.repo.createProviderProfile(actor.id, data).catch((error) => {
      throw this.toConflict(error, "Unable to create provider profile");
    });

    return {
      success: true,
      provider: this.toProviderResponse(provider),
    };
  }

  private async getOrCreateUser(authUser: AuthContextUser): Promise<UserWithProvider> {
    const existing = await this.repo.findByAuthUserId(authUser.authUserId);

    if (!existing) {
      return this.repo
        .createUser({
          authUserId: authUser.authUserId,
          email: authUser.email,
          phone: authUser.phone,
        })
        .catch((error) => {
          throw this.toConflict(error, "Unable to create local user account");
        });
    }

    const data: Prisma.UserUpdateInput = {
      lastLoginAt: new Date(),
    };

    if (authUser.email && authUser.email !== existing.email) {
      data.email = authUser.email;
    }

    if (authUser.phone && authUser.phone !== existing.phone) {
      data.phone = authUser.phone;
    }

    if (
      data.email === undefined &&
      data.phone === undefined &&
      existing.lastLoginAt
    ) {
      return existing;
    }

    return this.repo.updateAuthFields(existing.id, data).catch((error) => {
      throw this.toConflict(error, "Unable to sync local user account");
    });
  }

  private normalizeProviderOnboarding(
    body: ProviderOnboardingBody,
  ): ProviderOnboardingData {
    return {
      profession: body.profession,
      description: body.description,
      experience: body.experience,
      hourlyRate: body.hourlyRate,
      categoryIds: this.unique(body.categoryIds),
      skills: this.unique(body.skills.map((skill) => skill.trim()).filter(Boolean)),
      serviceZones: this.uniqueZones(body.serviceZones),
      tradeIds: this.unique(body.tradeIds),
      primaryTradeId: body.primaryTradeId,
    };
  }

  private async validateProviderOnboarding(
    data: ProviderOnboardingData,
  ): Promise<void> {
    if (data.tradeIds.length > 3) {
      throw new BadRequestException("A provider can have at most 3 trades");
    }

    if (data.primaryTradeId && !data.tradeIds.includes(data.primaryTradeId)) {
      throw new BadRequestException("primaryTradeId must be included in tradeIds");
    }

    const [categoryCount, tradeCount] = await Promise.all([
      this.repo.countCategories(data.categoryIds),
      this.repo.countTrades(data.tradeIds),
    ]);

    if (categoryCount !== data.categoryIds.length) {
      throw new BadRequestException("One or more categories are invalid");
    }

    if (tradeCount !== data.tradeIds.length) {
      throw new BadRequestException("One or more trades are invalid");
    }
  }

  private toMeUser(user: UserWithProvider): MeUser {
    return {
      ...user,
      profileComplete: Boolean(user.firstName && user.lastName && user.role),
      provider: user.provider ? this.toProviderResponse(user.provider) : null,
    };
  }

  private toProviderResponse(provider: ProviderWithRelations): ProviderResponse {
    return {
      ...provider,
      categories: provider.categories.map((item) => item.category),
      trades: provider.trades.map((item) => ({
        ...item.trade,
        isPrimary: item.isPrimary,
        experience: item.experience,
      })),
      badges: provider.trustScore?.badges ?? [],
    };
  }

  private unique(values: string[]): string[] {
    return [...new Set(values)];
  }

  private uniqueZones(
    zones: ProviderOnboardingBody["serviceZones"],
  ): ProviderOnboardingData["serviceZones"] {
    const seen = new Set<string>();

    return zones.filter((zone) => {
      const key = `${zone.city}:${zone.commune ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private toConflict(error: unknown, message: string): ConflictException {
    if (this.isKnownPrismaError(error, "P2002")) {
      return new ConflictException(message);
    }

    if (error instanceof Error) {
      return new ConflictException(error.message);
    }

    return new ConflictException(message);
  }

  private isKnownPrismaError(
    error: unknown,
    code: string,
  ): error is Prisma.PrismaClientKnownRequestError {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: unknown }).code === code
    );
  }
}
