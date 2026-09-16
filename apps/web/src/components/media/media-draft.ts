import type { MediaInput, MediaKind, ProviderMedia } from "@kayu/schemas";

/** A media tile in the wizard draft or the editor: an existing row (`id`) or a new upload / link. */
export type MediaDraftItem = {
  key: string;
  kind: MediaKind;
  id?: string;
  path?: string;
  /** Display URL: public storage URL or the YouTube watch URL. */
  url: string;
  youtubeId?: string | null;
  title?: string | null;
};

export function newMediaKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function fromProviderMedia(media: ProviderMedia): MediaDraftItem {
  return {
    key: media.id,
    kind: media.kind,
    id: media.id,
    path: media.storagePath ?? undefined,
    url: media.url,
    youtubeId: media.youtubeId,
    title: media.title,
  };
}

/** What `POST /me/provider` and `PUT /providers/me/media` accept. */
export function toMediaInput(item: MediaDraftItem): MediaInput {
  const title = item.title ?? undefined;
  if (item.id) {
    if (item.kind === "VIDEO_YOUTUBE") return { kind: "VIDEO_YOUTUBE", id: item.id, title };
    return { kind: item.kind, id: item.id, title };
  }
  if (item.kind === "VIDEO_YOUTUBE") return { kind: "VIDEO_YOUTUBE", url: item.url, title };
  return { kind: item.kind, path: item.path, title };
}

export const isImage = (item: MediaDraftItem) => item.kind === "IMAGE";
export const isVideo = (item: MediaDraftItem) => item.kind !== "IMAGE";
