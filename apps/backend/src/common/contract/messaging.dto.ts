import { z } from "zod";
import { IdSchema, pagination } from "./common";
import { ReportTargetKind } from "./enums";
import { MEDIA_LIMITS, MessageAttachmentInput } from "./media";

const messageBody = z.string().trim().max(4000).optional();
const attachments = z.array(MessageAttachmentInput).max(MEDIA_LIMITS.maxAttachments).default([]);
const hasContent = (body: { body?: string; attachments: unknown[] }) =>
  Boolean(body.body && body.body.length > 0) || body.attachments.length > 0;

export const StartConversationDto = z
  .object({
    providerId: IdSchema,
    subject: z.string().trim().max(160).optional(),
    body: messageBody,
    attachments,
  })
  .refine(hasContent, { path: ["body"], message: "Écrivez un message ou joignez un fichier" });

export const SendMessageDto = z
  .object({
    body: messageBody,
    attachments,
  })
  .refine(hasContent, { path: ["body"], message: "Écrivez un message ou joignez un fichier" });

export const ConversationsQueryParams = pagination(20);
export const MessagesQueryParams = pagination(30);

export const CreateReportDto = z.object({
  targetKind: ReportTargetKind,
  targetId: IdSchema,
  reason: z.string().trim().min(3).max(1000),
});

export const CreateBlockDto = z.object({
  userId: IdSchema,
});

export const BlocksQueryParams = pagination(50);

export type StartConversationInput = z.infer<typeof StartConversationDto>;
export type SendMessageInput = z.infer<typeof SendMessageDto>;
export type ConversationsQuery = z.infer<typeof ConversationsQueryParams>;
export type MessagesQuery = z.infer<typeof MessagesQueryParams>;
export type CreateReportInput = z.infer<typeof CreateReportDto>;
export type CreateBlockInput = z.infer<typeof CreateBlockDto>;
export type BlocksQuery = z.infer<typeof BlocksQueryParams>;
