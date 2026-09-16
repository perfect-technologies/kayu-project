"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { MessageAttachment } from "@kayu/schemas";
import { Skeleton } from "@/components/ui/skeleton";
import { messagerieCopy } from "@/copy/messagerie";
import { cn } from "@/lib/utils";
import { useSignedAttachment } from "./useSignedAttachment";

const copy = messagerieCopy.thread;

function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={copy.attachmentImage} className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4" onClick={onClose}>
      <button type="button" onClick={onClose} aria-label={copy.closeImage} className="icon-button absolute top-4 right-4">
        <X size={18} aria-hidden />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="max-h-full max-w-full rounded-2xl object-contain" onClick={(event) => event.stopPropagation()} />
    </div>
  );
}

function Attachment({ attachment, mine }: { attachment: MessageAttachment; mine: boolean }) {
  const signed = useSignedAttachment(attachment.path);
  const [open, setOpen] = useState(false);

  if (signed.isLoading) {
    return (
      <span className="block" aria-label={copy.attachmentLoading}>
        <Skeleton className={attachment.kind === "image" ? "h-40 w-48 max-w-full rounded-2xl" : "h-12 w-56 max-w-full rounded-full"} />
      </span>
    );
  }
  if (signed.isError || !signed.data) {
    return <span className={cn("block text-xs italic", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>{copy.attachmentFailed}</span>;
  }
  const url = signed.data.url;
  if (attachment.kind === "audio") {
    return <audio controls preload="metadata" src={url} aria-label={copy.attachmentAudio} className="block h-11 w-64 max-w-full" />;
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={copy.openImage} className="block overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={copy.attachmentImage} loading="lazy" className="max-h-56 w-auto max-w-full rounded-2xl object-cover" />
      </button>
      {open && <Lightbox url={url} onClose={() => setOpen(false)} />}
    </>
  );
}

/** Image thumbnails (lightbox) and audio players, resolved through `GET /me/media/sign-read`. */
export function MessageAttachments({ attachments, mine }: { attachments: MessageAttachment[]; mine: boolean }) {
  if (attachments.length === 0) return null;
  return (
    <div className="mt-1 flex flex-col gap-2">
      {attachments.map((attachment, index) => (
        <Attachment key={`${attachment.path}-${index}`} attachment={attachment} mine={mine} />
      ))}
    </div>
  );
}
