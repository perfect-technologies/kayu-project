export const YOUTUBE_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtube-nocookie.com",
] as const;

export type ParsedYouTubeUrl = {
  id: string;
  watchUrl: string;
  embedUrl: string;
  thumbnailUrl: string;
};

const ID_RE = /^[A-Za-z0-9_-]{11}$/;
const HOSTS = new Set<string>(YOUTUBE_HOSTS);

export function parseYouTubeUrl(value: string | null | undefined): ParsedYouTubeUrl | null {
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;

  const host = url.hostname.toLowerCase();
  if (!HOSTS.has(host)) return null;

  let id: string | null | undefined;
  if (host === "youtu.be") {
    id = url.pathname.slice(1).replace(/\/$/, "");
  } else if (url.pathname === "/watch") {
    id = url.searchParams.get("v");
  } else {
    id = url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)\/?$/)?.[1];
  }
  if (!id || !ID_RE.test(id)) return null;

  return {
    id,
    watchUrl: `https://www.youtube.com/watch?v=${id}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}
