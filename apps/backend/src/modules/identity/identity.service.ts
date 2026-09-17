import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { IActorResolver } from "../../common/auth/actor-resolver.interface";
import type { Actor, AuthContextUser } from "../../common/auth/types";
import type { UpdateProfileInput } from "../../common/contract";
import { assertActive } from "../../common/guards/actor.guard";
import { isUniqueViolation } from "../../common/util/db";
import { PlaceTreeService } from "../places/place-tree.service";
import { StorageService } from "../storage/storage.service";
import { releasePreviousAvatar } from "./avatar-cleanup";
import { IdentityRepository, type UserWithProvider } from "./identity.repository";

export type MeUser = Omit<UserWithProvider, "provider"> & {
  profileComplete: boolean;
  provider: { id: string; hidden: boolean; verificationStatus: string } | null;
};

@Injectable()
export class IdentityService implements IActorResolver {
  constructor(
    private readonly repo: IdentityRepository,
    private readonly places: PlaceTreeService,
    private readonly storage: StorageService,
  ) {}

  resolve(authUser: AuthContextUser): Promise<Actor> {
    return this.getOrCreateUser(authUser);
  }

  async getMe(authUser: AuthContextUser): Promise<{ success: true; user: MeUser }> {
    const user = await this.getOrCreateUser(authUser);
    assertActive(user);
    return { success: true, user: this.toMeUser(user) };
  }

  async updateProfile(actor: Actor, input: UpdateProfileInput): Promise<{ success: true; user: MeUser }> {
    if (input.placeId) await this.places.assertSelectable(input.placeId);

    const data: Prisma.UserUncheckedUpdateInput = {};
    if (input.firstName !== undefined) data.firstName = input.firstName;
    if (input.lastName !== undefined) data.lastName = input.lastName;
    if (input.avatar !== undefined) data.avatar = input.avatar;
    if (input.bio !== undefined) data.bio = input.bio;
    if (input.gender !== undefined) data.gender = input.gender;
    if (input.birthdate !== undefined) {
      data.birthdate = input.birthdate ? new Date(`${input.birthdate}T00:00:00.000Z`) : null;
    }
    if (input.placeId !== undefined) data.placeId = input.placeId;
    if (input.country !== undefined) data.country = input.country;

    const previous = await this.repo.findById(actor.id);
    if (!previous) throw new NotFoundException("Utilisateur introuvable");

    const user = await this.repo.update(actor.id, data);

    if (input.avatar !== undefined) {
      const provider = await this.repo.findProviderPhoto(actor.id);
      await releasePreviousAvatar({
        storage: this.storage,
        userId: actor.id,
        previousUrl: previous.avatar,
        nextUrl: user.avatar,
        providerPhoto: provider?.profilePhoto,
      });
    }

    return { success: true, user: this.toMeUser(user) };
  }

  async acceptTerms(actor: Actor): Promise<{ success: true; user: MeUser }> {
    const existing = await this.repo.findById(actor.id);
    if (!existing) throw new NotFoundException("Utilisateur introuvable");
    const user = existing.termsAcceptedAt
      ? existing
      : await this.repo.update(actor.id, { termsAcceptedAt: new Date() });
    return { success: true, user: this.toMeUser(user) };
  }

  toMeUser(user: UserWithProvider): MeUser {
    return {
      ...user,
      profileComplete: Boolean(user.firstName?.trim() && user.lastName?.trim()),
      provider: user.provider
        ? {
            id: user.provider.id,
            hidden: user.provider.hidden,
            verificationStatus: user.provider.verificationStatus,
          }
        : null,
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
          throw this.toConflict(error, "Impossible de créer le compte local");
        });
    }

    const data: Prisma.UserUncheckedUpdateInput = {};
    if (authUser.email && authUser.email !== existing.email) data.email = authUser.email;
    if (authUser.phone && authUser.phone !== existing.phone) data.phone = authUser.phone;

    if (data.email === undefined && data.phone === undefined && existing.lastLoginAt) {
      return existing;
    }

    data.lastLoginAt = new Date();
    return this.repo.update(existing.id, data).catch((error) => {
      throw this.toConflict(error, "Impossible de synchroniser le compte local");
    });
  }

  private toConflict(error: unknown, message: string): ConflictException {
    if (isUniqueViolation(error)) return new ConflictException(message);
    return new ConflictException(error instanceof Error ? error.message : message);
  }
}
