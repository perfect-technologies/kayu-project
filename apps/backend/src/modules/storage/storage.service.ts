import { ForbiddenException, Inject, Injectable, InternalServerErrorException } from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_CLIENT = "SUPABASE_CLIENT";

export type UploadPurpose = "avatar" | "portfolio" | "verification";

const BUCKETS: Record<UploadPurpose, string> = {
  avatar: "avatars",
  portfolio: "portfolio",
  verification: "verification-docs",
};

const PUBLIC: Record<UploadPurpose, boolean> = {
  avatar: true,
  portfolio: true,
  verification: false,
};

@Injectable()
export class StorageService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
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
      // no empty path segments (e.g. trailing slash, "//")
      path
        .slice(prefix.length)
        .split("/")
        .every((seg) => seg.length > 0);
    if (!valid) {
      throw new ForbiddenException("Upload path does not belong to the caller");
    }
    return true;
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

  resolveStoredUrl(purpose: UploadPurpose, path: string): string {
    const bucket = this.bucketFor(purpose);
    if (this.isPublic(purpose)) {
      const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    }
    return `storage://${bucket}/${path}`;
  }
}
