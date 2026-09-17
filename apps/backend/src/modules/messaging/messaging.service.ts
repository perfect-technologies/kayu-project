import { ForbiddenException, HttpStatus, Injectable } from "@nestjs/common";
import type { Message, Prisma } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import type {
  ConversationsQuery,
  MessageAttachmentInput,
  MessagesQuery,
  SendMessageInput,
  StartConversationInput,
} from "../../common/contract";
import { apiError, forbidden, notFound } from "../../common/http/errors";
import { pageArgs, toPage } from "../../common/http/pagination";
import { lockRow } from "../../common/util/db";
import { fullName } from "../../common/util/people";
import { PrismaService } from "../../database/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { SafetyService } from "../safety/safety.service";
import { StorageService } from "../storage/storage.service";

const PREVIEW_LENGTH = 120;
const ATTACHMENT_PREVIEW = "Pièce jointe";
const DELETED_PREVIEW = "Message supprimé";

const conversationInclude = {
  client: { select: { id: true, firstName: true, lastName: true, avatar: true, isActive: true } },
  provider: {
    select: {
      id: true,
      userId: true,
      displayName: true,
      profilePhoto: true,
      user: { select: { isActive: true } },
    },
  },
} satisfies Prisma.ConversationInclude;

type ConversationRecord = Prisma.ConversationGetPayload<{ include: typeof conversationInclude }>;
type Side = "client" | "provider";

export type ConversationItem = {
  id: string;
  subject: string | null;
  lastMessageAt: Date;
  lastPreview: string | null;
  unread: number;
  side: Side;
  counterpart: { userId: string; providerId: string | null; name: string; photo: string | null };
  blocked: boolean;
  createdAt: Date;
};

export type MessageItem = {
  id: string;
  conversationId: string;
  senderId: string;
  mine: boolean;
  body: string | null;
  attachments: MessageAttachmentInput[];
  createdAt: Date;
  deletedAt: Date | null;
};

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly safety: SafetyService,
    private readonly storage: StorageService,
  ) {}

  async list(actor: Actor, query: ConversationsQuery) {
    const providerId = await this.ownProviderId(actor.id);
    const where: Prisma.ConversationWhereInput = {
      OR: [{ clientId: actor.id }, ...(providerId ? [{ providerId }] : [])],
    };

    const [total, rows, blockedIds, clientUnread, providerUnread] = await Promise.all([
      this.prisma.conversation.count({ where }),
      this.prisma.conversation.findMany({
        where,
        include: conversationInclude,
        orderBy: [{ lastMessageAt: "desc" }, { id: "desc" }],
        ...pageArgs(query),
      }),
      this.safety.blockedUserIds(actor.id),
      this.prisma.conversation.aggregate({
        where: { clientId: actor.id },
        _sum: { clientUnread: true },
      }),
      providerId
        ? this.prisma.conversation.aggregate({
            where: { providerId },
            _sum: { providerUnread: true },
          })
        : Promise.resolve(null),
    ]);

    const blocked = new Set(blockedIds);
    return {
      ...toPage(
        rows.map((row) => this.toItem(row, actor.id, blocked)),
        total,
        query,
      ),
      unreadTotal: (clientUnread._sum.clientUnread ?? 0) + (providerUnread?._sum.providerUnread ?? 0),
    };
  }

  async start(actor: Actor, input: StartConversationInput) {
    const provider = await this.prisma.provider.findUnique({
      where: { id: input.providerId },
      select: { id: true, userId: true, hidden: true, user: { select: { isActive: true } } },
    });
    if (!provider || provider.hidden) throw notFound("Prestataire introuvable");
    if (provider.userId === actor.id) {
      throw apiError(HttpStatus.BAD_REQUEST, "SELF_ACTION", "Vous ne pouvez pas vous écrire à vous-même.");
    }
    if (await this.safety.isBlocked(actor.id, provider.userId)) throw this.blockedError();
    if (!provider.user.isActive) throw this.recipientUnavailable();
    this.assertAttachmentsOwned(actor.id, input.attachments);

    const { conversationId, message } = await this.prisma.$transaction(async (tx) => {
      const conversation = await tx.conversation.upsert({
        where: { clientId_providerId: { clientId: actor.id, providerId: provider.id } },
        create: { clientId: actor.id, providerId: provider.id, subject: input.subject || null },
        update: {},
        include: conversationInclude,
      });
      const message = await this.sendInTransaction(tx, actor, conversation, input);
      return { conversationId: conversation.id, message };
    });

    const conversation = await this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversationId },
      include: conversationInclude,
    });
    return {
      conversation: this.toItem(conversation, actor.id, new Set()),
      message: this.toMessage(message, actor.id),
    };
  }

  async messages(actor: Actor, conversationId: string, query: MessagesQuery) {
    const conversation = await this.findParticipantConversation(actor.id, conversationId);
    const side = this.sideOf(conversation, actor.id);

    const [total, rows, blocked] = await Promise.all([
      this.prisma.message.count({ where: { conversationId } }),
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        ...pageArgs(query),
      }),
      this.safety.isBlocked(actor.id, this.counterpartUserId(conversation, side)),
    ]);

    const unreadField = side === "client" ? "clientUnread" : "providerUnread";
    if (conversation[unreadField] > 0) {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { [unreadField]: 0 },
      });
      conversation[unreadField] = 0;
    }

    return {
      ...toPage(
        rows.reverse().map((row) => this.toMessage(row, actor.id)),
        total,
        query,
      ),
      conversation: this.toItem(
        conversation,
        actor.id,
        new Set(blocked ? [this.counterpartUserId(conversation, side)] : []),
      ),
    };
  }

  async send(actor: Actor, conversationId: string, input: SendMessageInput): Promise<MessageItem> {
    const conversation = await this.findParticipantConversation(actor.id, conversationId);
    const side = this.sideOf(conversation, actor.id);
    const counterpartId = this.counterpartUserId(conversation, side);

    this.assertAttachmentsOwned(actor.id, input.attachments);
    if (await this.safety.isBlocked(actor.id, counterpartId)) throw this.blockedError();
    const counterpartActive =
      side === "client" ? conversation.provider.user.isActive : conversation.client.isActive;
    if (!counterpartActive) throw this.recipientUnavailable();

    const message = await this.prisma.$transaction((tx) =>
      this.sendInTransaction(tx, actor, conversation, input),
    );
    return this.toMessage(message, actor.id);
  }

  async deleteMessage(actor: Actor, conversationId: string, messageId: string) {
    const message = await this.prisma.message.findFirst({
      where: { id: messageId, conversationId },
      include: { conversation: { select: { clientId: true, provider: { select: { userId: true } } } } },
    });
    if (!message) throw notFound("Message introuvable");

    if (actor.role !== "ADMIN") {
      const participant =
        message.conversation.clientId === actor.id || message.conversation.provider.userId === actor.id;
      if (!participant) throw notFound("Message introuvable");
      if (message.senderId !== actor.id) throw forbidden("Seul l'auteur peut supprimer ce message");
    }
    if (message.deletedAt) return { ok: true as const };

    await this.prisma.$transaction(async (tx) => {
      await tx.message.update({ where: { id: messageId }, data: { deletedAt: new Date() } });
      const latest = await tx.message.findFirst({
        where: { conversationId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: { id: true },
      });
      if (latest?.id === messageId) {
        await tx.conversation.update({
          where: { id: conversationId },
          data: { lastPreview: DELETED_PREVIEW },
        });
      }
    });
    return { ok: true as const };
  }

  private async sendInTransaction(
    tx: Prisma.TransactionClient,
    actor: Actor,
    conversation: ConversationRecord,
    input: SendMessageInput,
  ): Promise<Message> {
    await lockRow(tx, "Conversation", conversation.id);
    const side = this.sideOf(conversation, actor.id);
    const body = input.body?.trim() ? input.body.trim() : null;

    const message = await tx.message.create({
      data: {
        conversationId: conversation.id,
        senderId: actor.id,
        body,
        attachments: input.attachments as unknown as Prisma.InputJsonValue,
      },
    });

    await tx.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: message.createdAt,
        lastPreview: body ? body.slice(0, PREVIEW_LENGTH) : ATTACHMENT_PREVIEW,
        ...(side === "client"
          ? { clientUnread: 0, providerUnread: { increment: 1 } }
          : { providerUnread: 0, clientUnread: { increment: 1 } }),
      },
    });

    const senderName = side === "client" ? fullName(actor) : conversation.provider.displayName;
    await this.notifications.create(
      {
        userId: this.counterpartUserId(conversation, side),
        type: "NEW_MESSAGE",
        title: "Nouveau message",
        message: `${senderName} vous a envoyé un message.`,
        data: { conversationId: conversation.id, messageId: message.id },
      },
      tx,
    );

    return message;
  }

  private async findParticipantConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: conversationInclude,
    });
    if (
      !conversation ||
      (conversation.clientId !== userId && conversation.provider.userId !== userId)
    ) {
      throw notFound("Conversation introuvable");
    }
    return conversation;
  }

  private assertAttachmentsOwned(userId: string, attachments: MessageAttachmentInput[]) {
    for (const attachment of attachments) {
      try {
        this.storage.assertOwnedPath("attachments", userId, attachment.path);
      } catch {
        throw new ForbiddenException("Cette pièce jointe ne vous appartient pas");
      }
    }
  }

  private async ownProviderId(userId: string): Promise<string | null> {
    const provider = await this.prisma.provider.findUnique({
      where: { userId },
      select: { id: true },
    });
    return provider?.id ?? null;
  }

  private sideOf(conversation: ConversationRecord, userId: string): Side {
    return conversation.clientId === userId ? "client" : "provider";
  }

  private counterpartUserId(conversation: ConversationRecord, side: Side): string {
    return side === "client" ? conversation.provider.userId : conversation.clientId;
  }

  private toItem(conversation: ConversationRecord, userId: string, blocked: Set<string>): ConversationItem {
    const side = this.sideOf(conversation, userId);
    const counterpart =
      side === "client"
        ? {
            userId: conversation.provider.userId,
            providerId: conversation.provider.id,
            name: conversation.provider.displayName,
            photo: conversation.provider.profilePhoto,
          }
        : {
            userId: conversation.client.id,
            providerId: null,
            name: fullName(conversation.client),
            photo: conversation.client.avatar,
          };
    return {
      id: conversation.id,
      subject: conversation.subject,
      lastMessageAt: conversation.lastMessageAt,
      lastPreview: conversation.lastPreview,
      unread: side === "client" ? conversation.clientUnread : conversation.providerUnread,
      side,
      counterpart,
      blocked: blocked.has(counterpart.userId),
      createdAt: conversation.createdAt,
    };
  }

  toMessage(message: Message, userId: string): MessageItem {
    const deleted = Boolean(message.deletedAt);
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      mine: message.senderId === userId,
      body: deleted ? null : message.body,
      attachments: deleted
        ? []
        : Array.isArray(message.attachments)
          ? (message.attachments as unknown as MessageAttachmentInput[])
          : [],
      createdAt: message.createdAt,
      deletedAt: message.deletedAt,
    };
  }

  private blockedError() {
    return apiError(HttpStatus.FORBIDDEN, "BLOCKED", "Cette conversation est bloquée.");
  }

  private recipientUnavailable() {
    return apiError(
      HttpStatus.FORBIDDEN,
      "RECIPIENT_UNAVAILABLE",
      "Ce destinataire n'est pas disponible.",
    );
  }
}
