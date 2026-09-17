"use client";

import { useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import type { ProviderMedia } from "@kayu/schemas";
import { providerCopy } from "@/copy/provider";

const copy = providerCopy.videos;

function YouTubeTile({ id, title }: { id: string; title: string | null }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      {playing ? (
        <iframe
          className="aspect-video w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?playsinline=1&autoplay=1`}
          title={title ?? copy.play}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} aria-label={copy.play} className="relative block aspect-video w-full overflow-hidden bg-primary">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt={copy.thumbnailAlt} loading="lazy" className="h-full w-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center bg-black/15">
            <span className="flex size-[52px] items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Play size={24} aria-hidden className="fill-current" />
            </span>
          </span>
        </button>
      )}
      <a
        href={`https://www.youtube.com/watch?v=${id}`}
        target="_blank"
        rel="noreferrer"
        className="flex min-h-10 items-center justify-between gap-2 px-3 text-xs font-semibold text-primary"
      >
        {title || copy.openYoutube} <ExternalLink size={14} aria-hidden />
      </a>
    </div>
  );
}

function UploadTile({ url, title }: { url: string; title: string | null }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <p role="status" className="rounded-2xl bg-secondary p-4 text-sm">
        {copy.unavailable}
      </p>
    );
  }
  return (
    <video src={url} controls playsInline preload="metadata" title={title ?? undefined} onError={() => setFailed(true)} className="aspect-video w-full rounded-2xl bg-black">
      {copy.fallback}
    </video>
  );
}

/** YouTube tiles load the iframe on click; uploads use a native player from the public URL. */
export function VideoGallery({ items }: { items: ProviderMedia[] }) {
  if (items.length === 0) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) =>
        item.kind === "VIDEO_YOUTUBE" && item.youtubeId ? (
          <YouTubeTile key={item.id} id={item.youtubeId} title={item.title} />
        ) : (
          <UploadTile key={item.id} url={item.url} title={item.title} />
        ),
      )}
    </div>
  );
}
