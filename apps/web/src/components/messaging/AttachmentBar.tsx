"use client";

import { useState } from "react";
import { Image as ImageIcon, Mic, X } from "lucide-react";
import { MEDIA_LIMITS, type MessageAttachmentInput } from "@kayu/schemas";
import { providerCopy } from "@/copy/provider";
import { uploadFile } from "@/lib/media-upload";
import { VoiceRecorder } from "./VoiceRecorder";

const copy = providerCopy.composer.attachments;

export type PendingAttachment = MessageAttachmentInput & { previewUrl: string | null; name: string };

export type AttachmentBarProps = {
  attachments: PendingAttachment[];
  onChange: (next: PendingAttachment[]) => void;
  onError: (message: string | null) => void;
  disabled?: boolean;
};

/** Image picker (JPEG/PNG/WebP ≤ 8 MB, up to 6) and `VoiceRecorder`, uploading through `POST /me/uploads/sign`. */
export function AttachmentBar({ attachments, onChange, onError, disabled }: AttachmentBarProps) {
  const [uploading, setUploading] = useState(false);

  const addFile = async (file: File, kind: "image" | "audio") => {
    onError(null);
    if (attachments.length >= MEDIA_LIMITS.maxAttachments) {
      onError(copy.tooMany);
      return;
    }
    const max = kind === "image" ? MEDIA_LIMITS.maxImageBytes : MEDIA_LIMITS.maxAudioBytes;
    if (file.size > max) {
      onError(copy.tooLarge);
      return;
    }
    setUploading(true);
    try {
      const { path } = await uploadFile("attachments", file);
      onChange([
        ...attachments,
        {
          kind,
          path,
          mime: file.type,
          bytes: file.size,
          previewUrl: kind === "image" ? URL.createObjectURL(file) : null,
          name: file.name,
        },
      ]);
    } catch {
      onError(copy.uploadFailed);
    } finally {
      setUploading(false);
    }
  };

  const remove = (index: number) => onChange(attachments.filter((_, position) => position !== index));
  const full = attachments.length >= MEDIA_LIMITS.maxAttachments;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {attachments.map((attachment, index) => (
        <span key={`${attachment.path}-${index}`} className="relative">
          {attachment.kind === "image" && attachment.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={attachment.previewUrl} alt={attachment.name} className="size-12 rounded-lg object-cover" />
          ) : (
            <span className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-label={copy.audioLabel}>
              <Mic size={18} aria-hidden />
            </span>
          )}
          <button
            type="button"
            onClick={() => remove(index)}
            aria-label={copy.remove}
            className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-red-500 text-white shadow"
          >
            <X size={10} aria-hidden />
          </button>
        </span>
      ))}
      <label
        className={`flex size-11 items-center justify-center rounded-full text-muted-foreground transition ${disabled || uploading || full ? "opacity-55" : "cursor-pointer hover:bg-muted hover:text-primary"}`}
      >
        <span className="sr-only">{copy.image}</span>
        <ImageIcon size={18} aria-hidden />
        <input
          type="file"
          accept={MEDIA_LIMITS.imageMimes.join(",")}
          className="hidden"
          disabled={disabled || uploading || full}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void addFile(file, "image");
            event.target.value = "";
          }}
        />
      </label>
      <VoiceRecorder onRecorded={(file) => void addFile(file, "audio")} onError={onError} disabled={disabled || uploading || full} />
      {uploading && <span className="text-xs text-muted-foreground">{copy.uploading}</span>}
    </div>
  );
}
