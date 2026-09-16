"use client";

import { useRef, useState } from "react";
import { Image as ImageIcon, Mic, Square, X } from "lucide-react";
import { MEDIA_LIMITS, type MessageAttachmentInput } from "@kayu/schemas";
import { providerCopy } from "@/copy/provider";
import { uploadFile } from "@/lib/upload";

const copy = providerCopy.composer.attachments;

export type PendingAttachment = MessageAttachmentInput & { previewUrl: string | null; name: string };

export type AttachmentBarProps = {
  attachments: PendingAttachment[];
  onChange: (next: PendingAttachment[]) => void;
  onError: (message: string | null) => void;
};

/** Image picker (≤ 8 MB) and voice recorder (`audio/webm`) uploading through `POST /me/uploads/sign`. */
export function AttachmentBar({ attachments, onChange, onError }: AttachmentBarProps) {
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);

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

  const startRecording = async () => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const instance = new MediaRecorder(media, { mimeType: mime });
      chunks.current = [];
      instance.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.current.push(event.data);
      };
      instance.onstop = () => {
        const type = instance.mimeType.split(";")[0] || mime;
        const blob = new Blob(chunks.current, { type });
        const file = new File([blob], `voix-${Date.now()}.${type.endsWith("mp4") ? "m4a" : "webm"}`, { type });
        stream.current?.getTracks().forEach((track) => track.stop());
        void addFile(file, "audio");
      };
      instance.start();
      recorder.current = instance;
      setRecording(true);
    } catch {
      onError(copy.micUnavailable);
    }
  };

  const stopRecording = () => {
    const instance = recorder.current;
    if (instance && instance.state !== "inactive") instance.stop();
    setRecording(false);
  };

  const remove = (index: number) => onChange(attachments.filter((_, position) => position !== index));

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
      <label className="flex size-11 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-primary">
        <span className="sr-only">{copy.image}</span>
        <ImageIcon size={18} aria-hidden />
        <input
          type="file"
          accept={MEDIA_LIMITS.imageMimes.join(",")}
          className="hidden"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void addFile(file, "image");
            event.target.value = "";
          }}
        />
      </label>
      <button
        type="button"
        onClick={recording ? stopRecording : startRecording}
        disabled={uploading}
        aria-label={recording ? copy.stop : copy.record}
        className={`flex size-11 items-center justify-center rounded-full transition ${recording ? "bg-red-50 text-red-600" : "text-muted-foreground hover:bg-muted hover:text-primary"}`}
      >
        {recording ? <Square size={16} aria-hidden className="fill-current" /> : <Mic size={18} aria-hidden />}
      </button>
      {uploading && <span className="text-xs text-muted-foreground">{copy.uploading}</span>}
      {recording && <span className="text-xs font-semibold text-red-500">{copy.recording}</span>}
    </div>
  );
}
