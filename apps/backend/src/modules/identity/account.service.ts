import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Actor } from "../../common/auth/types";
import { apiError, notFound } from "../../common/http/errors";
import { lockRow } from "../../common/util/db";
import { PrismaService } from "../../database/prisma.service";
import { ActivityLogService } from "../activity/activity-log.service";
import { recomputeProviderAggregates } from "../reviews/rating-aggregates";
import {
  StorageService,
  SUPABASE_CLIENT,
  type StoredObject,
} from "../storage/storage.service";

type Attachment = { path?: unknown };

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly activity: ActivityLogService,
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async deleteAccount(actor: Actor): Promise<{ ok: true }> {
    if (actor.role === "ADMIN") throw this.adminRefusal();

    const { authUserId, objects } = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: actor.id },
        select: {
          id: true,
          role: true,
          authUserId: true,
          avatar: true,
          provider: {
            select: {
              id: true,
              profilePhoto: true,
              media: { select: { storagePath: true } },
              verificationDocs: { select: { storagePath: true } },
            },
          },
        },
      });
      if (!user) throw notFound("Utilisateur introuvable");
      if (user.role === "ADMIN") throw this.adminRefusal();

      const providerId = user.provider?.id ?? null;
      const asClient = { clientId: user.id };
      const involving = providerId ? [asClient, { providerId }] : [asClient];

      const [reviewed, booked] = await Promise.all([
        tx.review.findMany({ where: { clientId: user.id }, select: { providerId: true } }),
        tx.booking.findMany({ where: { clientId: user.id }, select: { providerId: true } }),
      ]);
      const affected = [
        ...new Set([...reviewed, ...booked].map((row) => row.providerId)),
      ]
        .filter((id) => id !== providerId)
        .sort();
      for (const id of affected) await lockRow(tx, "Provider", id);

      const messages = await tx.message.findMany({
        where: { conversation: { OR: involving } },
        select: { attachments: true },
      });

      const objects: StoredObject[] = [];
      const avatar = this.storage.objectFromUrl(user.avatar);
      if (avatar) objects.push(avatar);
      if (user.provider) {
        const photo = this.storage.objectFromUrl(user.provider.profilePhoto);
        if (photo) objects.push(photo);
        for (const media of user.provider.media) {
          if (media.storagePath) objects.push({ purpose: "media", path: media.storagePath });
        }
        for (const doc of user.provider.verificationDocs) {
          objects.push({ purpose: "verification", path: doc.storagePath });
        }
      }
      for (const message of messages) {
        const attachments = Array.isArray(message.attachments)
          ? (message.attachments as Attachment[])
          : [];
        for (const attachment of attachments) {
          if (typeof attachment?.path === "string") {
            objects.push({ purpose: "attachments", path: attachment.path });
          }
        }
      }

      await tx.conversation.deleteMany({ where: { OR: involving } });
      await tx.clientReview.deleteMany({ where: { OR: involving } });
      await tx.review.deleteMany({ where: { OR: involving } });
      await tx.booking.deleteMany({ where: { OR: involving } });
      if (providerId) await tx.provider.delete({ where: { id: providerId } });
      await tx.user.delete({ where: { id: user.id } });

      for (const id of affected) await recomputeProviderAggregates(tx, id);

      await this.activity.log(
        {
          userId: null,
          action: "account.deleted",
          entityType: "User",
          entityId: user.id,
          metadata: { role: user.role, hadProvider: Boolean(providerId) },
        },
        tx,
      );

      return { authUserId: user.authUserId, objects };
    });

    await this.storage.removeObjects(objects, null).catch(() => undefined);
    await this.deleteAuthUser(actor.id, authUserId);

    return { ok: true };
  }

  private async deleteAuthUser(userId: string, authUserId: string): Promise<void> {
    let failure: string | null = null;
    try {
      const { error } = await this.supabase.auth.admin.deleteUser(authUserId);
      failure = error?.message ?? null;
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
    }
    if (!failure) return;
    await this.activity
      .log({
        userId: null,
        action: "auth.delete_failed",
        entityType: "auth",
        entityId: userId,
        metadata: { authUserId, error: failure },
      })
      .catch(() => undefined);
  }

  private adminRefusal() {
    return apiError(
      HttpStatus.CONFLICT,
      "ADMIN_ACCOUNT",
      "Un compte administrateur ne peut pas être supprimé depuis l'application.",
    );
  }
}
