"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { mediaApi, queryKeys } from "@kayu/api";
import { MiniAvatar } from "@/components/ui/MiniAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { compteCopy } from "@/copy/compte";
import { errorMessage } from "@/copy/errors";
import { apiClient } from "@/lib/api";
import { uploadFile } from "@/lib/media-upload";

const copy = compteCopy.header;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

/** 96 px avatar with a camera badge: signed upload (purpose `avatar`) then `POST /me/avatar`. */
export function ProfilePhotoUploader({ src, name }: { src: string | null; name: string }) {
  const { refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const pick = async (file: File) => {
    if (!ACCEPT.includes(file.type)) {
      toast.error(copy.photoType);
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(copy.photoTooLarge);
      return;
    }
    setProgress(0);
    try {
      const { path } = await uploadFile("avatar", file, { onProgress: setProgress });
      await mediaApi(apiClient).setAvatar({ path });
      await refreshUser();
      await queryClient.invalidateQueries({ queryKey: queryKeys.identity.me });
      toast.success(copy.photoUpdated);
    } catch (error) {
      toast.error(error instanceof Error && error.name === "UploadError" ? copy.photoFailed : errorMessage(error));
    } finally {
      setProgress(null);
    }
  };

  const busy = progress !== null;

  return (
    <div className="relative inline-block" aria-busy={busy}>
      <MiniAvatar src={src} name={name} size={96} className="ring-4 ring-white" />
      {busy && (
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-primary/60 text-xs font-bold text-primary-foreground">
          {progress}%
        </span>
      )}
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        aria-label={busy ? copy.uploading : copy.changePhoto}
        className="absolute -right-1 -bottom-1 flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-white disabled:opacity-55"
      >
        <Camera size={18} aria-hidden />
      </button>
      <input
        ref={input}
        type="file"
        accept={ACCEPT.join(",")}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void pick(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}
