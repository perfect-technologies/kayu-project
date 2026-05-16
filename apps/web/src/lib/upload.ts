import { createClient } from "@/lib/supabase";
import { apiClient } from "@/lib/api";
import { mediaApi } from "@kayu/api";

export type UploadPurpose = "avatar" | "portfolio" | "verification";

/**
 * Sign + upload a file to Supabase Storage and return the stored object path.
 * The backend `mediaApi.sign` issues a signed upload URL+token; the browser
 * Supabase client uploads the bytes directly (no file goes through NestJS).
 */
export async function uploadFile(
  purpose: UploadPurpose,
  file: File,
): Promise<{ path: string }> {
  const signed = await mediaApi(apiClient).sign({
    purpose,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
  });
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(signed.bucket)
    .uploadToSignedUrl(signed.path, signed.token, file);
  if (error) {
    throw new Error(error.message || "Téléversement impossible");
  }
  return { path: signed.path };
}
