import {
  ForbiddenException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Optional,
} from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MEDIA_LIMITS, type UploadPurpose } from "../../common/contract";
import { apiError } from "../../common/http/errors";
import { ActivityLogService } from "../activity/activity-log.service";

export const SUPABASE_CLIENT = "SUPABASE_CLIENT";

export type { UploadPurpose };

export type StoredObject = { purpose: UploadPurpose; path: string };

const PURPOSES: UploadPurpose[] = ["avatar", "media", "attachments", "verification"];

const BUCKETS: Record<UploadPurpose, string> = {
  avatar: "avatars",
  media: "provider-media",
  attachments: "message-attachments",
  verification: "verification-docs",
};

const PUBLIC: Record<UploadPurpose, boolean> = {
  avatar: true,
  media: true,
  attachments: false,
  verification: false,
};

const ALLOWED_MIMES: Record<UploadPurpose, readonly string[]> = {
  avatar: MEDIA_LIMITS.imageMimes,
  media: [...MEDIA_LIMITS.imageMimes, ...MEDIA_LIMITS.videoMimes],
  attachments: [...MEDIA_LIMITS.imageMimes, ...MEDIA_LIMITS.audioMimes],
  verification: [...MEDIA_LIMITS.imageMimes, ...MEDIA_LIMITS.documentMimes],
};

export const SIGNED_READ_TTL_SECONDS = 300;

@Injectable()
export class StorageService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    @Optional() private readonly activity?: ActivityLogService,
  ) {}

  private envPrefix(): string {
    const p = process.env.STORAGE_ENV_PREFIX?.trim();
    return p ? `${p}/` : "";
  }

  bucketFor(purpose: UploadPurpose): string {
    return BUCKETS[purpose];
  }

  isPublic(purpose: UploadPurpose): boolean {
    return PUBLIC[purpose];
  }

  assertUploadAllowed(purpose: UploadPurpose, mimeType: string, bytes?: number): void {
    if (!ALLOWED_MIMES[purpose].includes(mimeType)) {
      throw apiError(HttpStatus.BAD_REQUEST, "INVALID_MEDIA", "Type de fichier non pris en charge");
    }
    if (bytes === undefined) return;
    const max = mimeType.startsWith("video/")
      ? MEDIA_LIMITS.maxVideoBytes
      : mimeType.startsWith("audio/")
        ? MEDIA_LIMITS.maxAudioBytes
        : mimeType === "application/pdf"
          ? MEDIA_LIMITS.maxDocumentBytes
          : MEDIA_LIMITS.maxImageBytes;
    if (bytes > max) {
      throw apiError(HttpStatus.BAD_REQUEST, "INVALID_MEDIA", "Fichier trop volumineux");
    }
  }

  buildObjectPath(
    purpose: UploadPurpose,
    actorId: string,
    fileName: string,
  ): string {
    const safe = fileName
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 200);
    const suffix = `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    return `${this.envPrefix()}${purpose}/${actorId}/${suffix}-${safe}`;
  }

  assertOwnedPath(
    purpose: UploadPurpose,
    actorId: string,
    path: string,
  ): true {
    const prefix = `${this.envPrefix()}${purpose}/${actorId}/`;
    const valid =
      typeof path === "string" &&
      path.startsWith(prefix) &&
      !path.includes("..") &&
      !path.includes("\\") &&
      !path.startsWith("/") &&
      path
        .slice(prefix.length)
        .split("/")
        .every((seg) => seg.length > 0);
    if (!valid) {
      throw new ForbiddenException("Upload path does not belong to the caller");
    }
    return true;
  }

  parsePath(path: string): { purpose: UploadPurpose; ownerId: string } | null {
    const prefix = this.envPrefix();
    if (!path.startsWith(prefix)) return null;
    const [purpose, ownerId, ...rest] = path.slice(prefix.length).split("/");
    if (!PURPOSES.includes(purpose as UploadPurpose) || !ownerId || rest.length === 0) return null;
    try {
      this.assertOwnedPath(purpose as UploadPurpose, ownerId, path);
    } catch {
      return null;
    }
    return { purpose: purpose as UploadPurpose, ownerId };
  }

  async createSignedUpload(
    purpose: UploadPurpose,
    actorId: string,
    fileName: string,
  ): Promise<{ bucket: string; path: string; token: string; signedUrl: string }> {
    const bucket = this.bucketFor(purpose);
    const path = this.buildObjectPath(purpose, actorId, fileName);
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path);
    if (error || !data) {
      throw new InternalServerErrorException(`Failed to create signed upload URL: ${error?.message ?? "unknown"}`);
    }
    return { bucket, path, token: data.token, signedUrl: data.signedUrl };
  }

  async createSignedRead(
    purpose: UploadPurpose,
    path: string,
    expiresInSeconds = SIGNED_READ_TTL_SECONDS,
  ): Promise<{ url: string; expiresAt: string }> {
    const { data, error } = await this.supabase.storage
      .from(this.bucketFor(purpose))
      .createSignedUrl(path, expiresInSeconds);
    if (error || !data) {
      throw new InternalServerErrorException(`Failed to create signed read URL: ${error?.message ?? "unknown"}`);
    }
    return {
      url: data.signedUrl,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    };
  }

  resolveStoredUrl(purpose: UploadPurpose, path: string): string {
    const bucket = this.bucketFor(purpose);
    if (this.isPublic(purpose)) {
      const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    }
    return `storage://${bucket}/${path}`;
  }

  objectFromUrl(url: string | null | undefined): StoredObject | null {
    if (!url) return null;
    for (const purpose of PURPOSES) {
      const marker = `/${this.bucketFor(purpose)}/`;
      const index = url.indexOf(marker);
      if (index === -1) continue;
      const path = decodeURIComponent(url.slice(index + marker.length).split("?")[0] ?? "");
      if (this.parsePath(path)?.purpose === purpose) return { purpose, path };
    }
    return null;
  }

  // Best-effort: objects are removed after the database commit; failures are journaled.
  async removeObjects(objects: StoredObject[], actorId?: string | null): Promise<void> {
    const byPurpose = new Map<UploadPurpose, string[]>();
    for (const object of objects) {
      const paths = byPurpose.get(object.purpose) ?? [];
      if (!paths.includes(object.path)) paths.push(object.path);
      byPurpose.set(object.purpose, paths);
    }

    for (const [purpose, paths] of byPurpose) {
      const bucket = this.bucketFor(purpose);
      let failure: string | null = null;
      try {
        const { error } = await this.supabase.storage.from(bucket).remove(paths);
        failure = error?.message ?? null;
      } catch (error) {
        failure = error instanceof Error ? error.message : String(error);
      }
      if (failure) {
        await this.activity
          ?.log({
            userId: actorId ?? null,
            action: "storage.delete_failed",
            entityType: "storage",
            entityId: bucket,
            metadata: { bucket, paths, error: failure },
          })
          .catch(() => undefined);
      }
    }
  }
}
