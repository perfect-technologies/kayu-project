"use client";

import { ExternalLink, Facebook, Film, Instagram, Music2, Youtube } from "lucide-react";
import type { ProviderMedia, SocialLinks } from "@kayu/schemas";
import { parseYouTubeUrl } from "@kayu/utils";
import { VideoGallery } from "@/components/media/VideoGallery";
import { providerCopy } from "@/copy/provider";

const copy = providerCopy.social;

type Platform = "youtube" | "instagram" | "tiktok" | "facebook";

const PLATFORMS: Record<Platform, { Icon: typeof Youtube; color: string; label: string }> = {
  youtube: { Icon: Youtube, color: "text-red-500", label: copy.youtube },
  instagram: { Icon: Instagram, color: "text-pink-500", label: copy.instagram },
  tiktok: { Icon: Music2, color: "text-slate-800", label: copy.tiktok },
  facebook: { Icon: Facebook, color: "text-blue-600", label: copy.facebook },
};

function embedUrl(platform: Platform, url: string): string | null {
  if (platform === "youtube") return parseYouTubeUrl(url)?.embedUrl ?? null;
  if (platform === "tiktok") {
    const id = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/)?.[1];
    return id ? `https://www.tiktok.com/embed/v2/${id}` : null;
  }
  if (platform === "instagram") {
    const path = url.match(/instagram\.com\/(p|reel)\/([\w-]+)/);
    return path ? `https://www.instagram.com/${path[1]}/${path[2]}/embed` : null;
  }
  if (platform === "facebook") {
    return /facebook\.com\/.+\/(posts|videos|photos)\//.test(url)
      ? `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&show_text=false&width=350`
      : null;
  }
  return null;
}

function Embed({ platform, url }: { platform: Platform; url: string }) {
  const { Icon, color, label } = PLATFORMS[platform];
  const src = embedUrl(platform, url);
  if (!src) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex aspect-video items-center justify-center gap-2 rounded-2xl border border-border bg-muted text-sm font-semibold text-foreground/70 transition hover:bg-muted/70"
      >
        <Icon aria-hidden className={color} size={20} /> {label} <ExternalLink size={14} aria-hidden />
      </a>
    );
  }
  const tall = platform === "tiktok" || platform === "instagram";
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-soft">
      <a href={url} target="_blank" rel="noreferrer" className="flex min-h-10 items-center gap-2 border-b border-border px-3 text-xs font-bold text-foreground">
        <Icon aria-hidden className={color} size={16} /> {label}
        <ExternalLink size={12} aria-hidden className="ml-auto text-muted-foreground" />
      </a>
      <div className={tall ? "h-[420px]" : "aspect-video"}>
        <iframe src={src} title={label} allowFullScreen loading="lazy" className="h-full w-full" />
      </div>
    </div>
  );
}

export function SocialEmbeds({ social, videos }: { social: SocialLinks; videos: ProviderMedia[] }) {
  const socials = (
    [
      ["youtube", social.youtubeUrl],
      ["instagram", social.instagramUrl],
      ["tiktok", social.tiktokUrl],
      ["facebook", social.facebookUrl],
    ] as Array<[Platform, string | null]>
  ).filter((entry): entry is [Platform, string] => Boolean(entry[1] && entry[1].trim()));

  if (socials.length === 0 && videos.length === 0) return null;

  return (
    <section className="space-y-5">
      {socials.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-extrabold text-foreground">{copy.title}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {socials.map(([platform, url]) => (
              <Embed key={platform} platform={platform} url={url} />
            ))}
          </div>
        </div>
      )}
      {videos.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-foreground">
            <Film size={18} aria-hidden className="text-primary" /> {providerCopy.videos.title}
          </h2>
          <VideoGallery items={videos} />
        </div>
      )}
    </section>
  );
}
