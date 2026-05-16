import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { CurrentActor, LazyZodValidationPipe } from "../../common";
import { ActorGuard } from "../../common/guards/actor.guard";
import { SupabaseGuard } from "../../common/guards/supabase.guard";
import { PrismaService } from "../../database/prisma.service";
import { StorageService } from "./storage.service";

type UploadSignBody = {
  purpose: "avatar" | "portfolio" | "verification";
  fileName: string;
  mimeType: string;
};

type ConfirmAvatarBody = { path: string };

const signBodyPipe = new LazyZodValidationPipe(async () => {
  const { UploadSignRequestDto } = await import("@kayu/schemas");
  return UploadSignRequestDto;
});

const confirmAvatarPipe = new LazyZodValidationPipe(async () => {
  const { ConfirmAvatarDto } = await import("@kayu/schemas");
  return ConfirmAvatarDto;
});

@Controller("me")
@UseGuards(SupabaseGuard, ActorGuard)
export class MediaController {
  constructor(
    private readonly storage: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  @Post("uploads/sign")
  sign(
    @CurrentActor() actor: Actor,
    @Body(signBodyPipe) body: UploadSignBody,
  ) {
    return this.storage.createSignedUpload(
      body.purpose,
      actor.id,
      body.fileName,
    );
  }

  @Post("avatar")
  async setAvatar(
    @CurrentActor() actor: Actor,
    @Body(confirmAvatarPipe) body: ConfirmAvatarBody,
  ) {
    this.storage.assertOwnedPath("avatar", actor.id, body.path);
    const avatarUrl = this.storage.resolveStoredUrl("avatar", body.path);
    await this.prisma.user.update({
      where: { id: actor.id },
      data: { avatar: avatarUrl },
    });
    return { success: true as const, avatarUrl };
  }
}
