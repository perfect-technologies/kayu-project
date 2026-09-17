import { mediaApi } from "@kayu/api";
import type { UploadPurpose } from "@kayu/schemas";
import { apiClient } from "@/lib/api";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase";

export type UploadedObject = { path: string; bucket: string; url: string | null };

export type UploadOptions = {
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
};

export class UploadError extends Error {
  constructor(
    message: string,
    public readonly status: number | null = null,
  ) {
    super(message);
    this.name = "UploadError";
  }
}

const PUBLIC_PURPOSES: ReadonlySet<UploadPurpose> = new Set(["avatar", "media"]);

/** Public URL of an object in one of the public buckets (`avatars`, `provider-media`). */
export function publicObjectUrl(bucket: string, path: string): string {
  return createClient().storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

function putWithProgress(url: string, file: File, options: UploadOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("apikey", publicEnv.supabaseAnonKey);
    xhr.setRequestHeader("Authorization", `Bearer ${publicEnv.supabaseAnonKey}`);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.setRequestHeader("cache-control", "max-age=3600");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) options.onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        options.onProgress?.(100);
        resolve();
      } else {
        reject(new UploadError(xhr.responseText || `Upload failed (${xhr.status})`, xhr.status));
      }
    };
    xhr.onerror = () => reject(new UploadError("Network error during upload"));
    xhr.onabort = () => reject(new UploadError("Upload aborted"));
    if (options.signal) {
      if (options.signal.aborted) {
        xhr.abort();
        return;
      }
      options.signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }
    xhr.send(file);
  });
}

/**
 * Signs an upload through `POST /me/uploads/sign` then PUTs the bytes straight to the signed
 * Supabase Storage URL, reporting progress. Returns the object path (what the API expects)
 * and the public URL for public purposes.
 */
export async function uploadFile(purpose: UploadPurpose, file: File, options: UploadOptions = {}): Promise<UploadedObject> {
  options.onProgress?.(0);
  const signed = await mediaApi(apiClient).sign({
    purpose,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    bytes: file.size,
  });
  await putWithProgress(signed.signedUrl, file, options);
  return {
    path: signed.path,
    bucket: signed.bucket,
    url: PUBLIC_PURPOSES.has(purpose) ? publicObjectUrl(signed.bucket, signed.path) : null,
  };
}
