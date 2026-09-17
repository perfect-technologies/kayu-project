import { YOUTUBE_HOSTS } from "@kayu/utils";
import { z } from "zod";
import { IdSchema, StoragePathSchema } from "./common.js";
import { MessageAttachmentKind } from "./enums.js";

export { YOUTUBE_HOSTS };

export const MEDIA_LIMITS = {
  maxImages: 12,
  maxVideos: 12,
  maxVideoBytes: 25 * 1024 * 1024,
  maxImageBytes: 8 * 1024 * 1024,
  maxAudioBytes: 8 * 1024 * 1024,
  maxDocumentBytes: 10 * 1024 * 1024,
  maxAttachments: 6,
  imageMimes: ["image/jpeg", "image/png", "image/webp"],
  videoMimes: ["video/mp4", "video/quicktime", "video/webm"],
  audioMimes: ["audio/webm", "audio/mp4", "audio/mpeg", "audio/ogg"],
  documentMimes: ["application/pdf"],
} as const;

const MediaTitle = z.string().trim().max(120).nullable().optional();

// `id` keeps an existing item in place; otherwise `path` (upload) or `url` (YouTube) adds one.
// The schema checks shape only: the backend resolves the YouTube URL with `parseYouTubeUrl`.
export const MediaInputSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("IMAGE"),
    id: IdSchema.optional(),
    path: StoragePathSchema.optional(),
    title: MediaTitle,
  }),
  z.object({
    kind: z.literal("VIDEO_UPLOAD"),
    id: IdSchema.optional(),
    path: StoragePathSchema.optional(),
    title: MediaTitle,
  }),
  z.object({
    kind: z.literal("VIDEO_YOUTUBE"),
    id: IdSchema.optional(),
    url: z.string().trim().max(300).optional(),
    title: MediaTitle,
  }),
]);

export const MediaListInputSchema = z
  .array(MediaInputSchema)
  .max(MEDIA_LIMITS.maxImages + MEDIA_LIMITS.maxVideos)
  .superRefine((items, ctx) => {
    const images = items.filter((item) => item.kind === "IMAGE").length;
    if (images > MEDIA_LIMITS.maxImages) {
      ctx.addIssue({ code: "custom", message: `${MEDIA_LIMITS.maxImages} images maximum` });
    }
    if (items.length - images > MEDIA_LIMITS.maxVideos) {
      ctx.addIssue({ code: "custom", message: `${MEDIA_LIMITS.maxVideos} vidéos maximum` });
    }
    items.forEach((item, index) => {
      const hasSource = item.kind === "VIDEO_YOUTUBE" ? Boolean(item.url) : Boolean(item.path);
      if (!item.id && !hasSource) {
        ctx.addIssue({
          code: "custom",
          path: [index],
          message: "Chaque média référence un élément existant ou un nouveau fichier",
        });
      }
    });
  });

export const MessageAttachmentInput = z
  .object({
    kind: MessageAttachmentKind,
    path: StoragePathSchema,
    mime: z.string().trim().min(1).max(120),
    bytes: z.number().int().positive(),
  })
  .superRefine((attachment, ctx) => {
    const allowed: readonly string[] =
      attachment.kind === "image" ? MEDIA_LIMITS.imageMimes : MEDIA_LIMITS.audioMimes;
    if (!allowed.includes(attachment.mime)) {
      ctx.addIssue({ code: "custom", path: ["mime"], message: "Type de fichier non pris en charge" });
    }
    const max = attachment.kind === "image" ? MEDIA_LIMITS.maxImageBytes : MEDIA_LIMITS.maxAudioBytes;
    if (attachment.bytes > max) {
      ctx.addIssue({ code: "custom", path: ["bytes"], message: "Fichier trop volumineux" });
    }
  });

export type MediaInput = z.infer<typeof MediaInputSchema>;
export type MediaListInput = z.infer<typeof MediaListInputSchema>;
export type MessageAttachmentInput = z.infer<typeof MessageAttachmentInput>;
