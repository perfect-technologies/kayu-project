import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import type {
  ConfirmAvatarInput,
  SignReadQuery,
  UploadSignRequestInput,
} from "../../common/contract";
import { contractPipe } from "../../common/contract/pipe";
import { CurrentActor } from "../../common/decorators/current-actor.decorator";
import { ActorGuard } from "../../common/guards/actor.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { apiError } from "../../common/http/errors";
import { PrismaService } from "../../database/prisma.service";
import { releasePreviousAvatar } from "../identity/avatar-cleanup";
import { StorageService } from "./storage.service";

@Controller("me")
@UseGuards(SupabaseGuard, ActorGuard)
export class MediaController {
  constructor(
    private readonly storage: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  @Post("uploads/sign")
  @HttpCode(200)
  sign(
    @CurrentActor() actor: Actor,
    @Body(contractPipe("UploadSignRequestDto")) body: UploadSignRequestInput,
  ) {
    this.storage.assertUploadAllowed(body.purpose, body.mimeType, body.bytes);
    return this.storage.createSignedUpload(body.purpose, actor.id, body.fileName);
  }

  @Post("avatar")
  @HttpCode(200)
  async setAvatar(
    @CurrentActor() actor: Actor,
    @Body(contractPipe("ConfirmAvatarDto")) body: ConfirmAvatarInput,
  ) {
    this.storage.assertOwnedPath("avatar", actor.id, body.path);
    const avatarUrl = this.storage.resolveStoredUrl("avatar", body.path);
    const [previous, provider] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: actor.id }, select: { avatar: true } }),
      this.prisma.provider.findUnique({ where: { userId: actor.id }, select: { profilePhoto: true } }),
    ]);
    await this.prisma.user.update({ where: { id: actor.id }, data: { avatar: avatarUrl } });
    await releasePreviousAvatar({
      storage: this.storage,
      userId: actor.id,
      previousUrl: previous?.avatar,
      nextUrl: avatarUrl,
      providerPhoto: provider?.profilePhoto,
    });
    return { success: true as const, avatarUrl };
  }

  @Get("media/sign-read")
  async signRead(
    @CurrentActor() actor: Actor,
    @Query(contractPipe("SignReadQueryParams")) query: SignReadQuery,
  ) {
    const parsed = this.storage.parsePath(query.path);
    if (!parsed) {
      throw apiError(HttpStatus.BAD_REQUEST, "INVALID_MEDIA", "Chemin de fichier invalide");
    }
    if (this.storage.isPublic(parsed.purpose)) {
      throw apiError(HttpStatus.BAD_REQUEST, "INVALID_MEDIA", "Ce fichier est public");
    }

    const allowed =
      parsed.ownerId === actor.id ||
      actor.role === "ADMIN" ||
      (parsed.purpose === "attachments" &&
        (await this.isConversationParticipant(actor.id, query.path)));
    if (!allowed) throw new ForbiddenException("Accès refusé à ce fichier");

    return this.storage.createSignedRead(parsed.purpose, query.path);
  }

  private async isConversationParticipant(userId: string, path: string): Promise<boolean> {
    const message = await this.prisma.message.findFirst({
      where: {
        deletedAt: null,
        attachments: { array_contains: [{ path }] },
        conversation: { OR: [{ clientId: userId }, { provider: { userId } }] },
      },
      select: { id: true },
    });
    return Boolean(message);
  }
}
