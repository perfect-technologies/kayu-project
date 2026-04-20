import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import { PrismaService } from "../../database/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

type MessageQuery = {
  conversationId?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

type CreateMessageBody = {
  recipientId: string;
  content: string;
  type: "TEXT" | "IMAGE" | "FILE" | "LOCATION" | "BOOKING_REQUEST" | "QUOTE";
  fileUrl?: string;
};

const senderSelect = {
  id: true,
  firstName: true,
  lastName: true,
  avatar: true,
} satisfies Prisma.UserSelect;

const conversationUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  avatar: true,
  role: true,
} satisfies Prisma.UserSelect;

const messageInclude = {
  sender: {
    select: senderSelect,
  },
} satisfies Prisma.MessageInclude;

type MessageRecord = Prisma.MessageGetPayload<{
  include: typeof messageInclude;
}>;

type ConversationRecord = Prisma.ConversationGetPayload<{
  include: {
    user1: {
      select: typeof conversationUserSelect;
    };
    user2: {
      select: typeof conversationUserSelect;
    };
    messages: {
      select: {
        content: true;
        createdAt: true;
        senderId: true;
        sender: {
          select: {
            firstName: true;
            lastName: true;
          };
        };
      };
    };
    _count: {
      select: {
        messages: true;
      };
    };
  };
}>;

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(actor: Actor, query: MessageQuery) {
    if (query.conversationId) {
      return this.getMessages(actor, query);
    }

    return this.getConversations(actor);
  }

  async sendMessage(actor: Actor, body: CreateMessageBody) {
    const recipient = await this.prisma.user.findUnique({
      where: {
        id: body.recipientId,
      },
      select: {
        id: true,
        visibilitySettings: {
          select: {
            allowMessages: true,
          },
        },
      },
    });

    if (!recipient) {
      throw new NotFoundException("Recipient not found");
    }

    if (recipient.id === actor.id) {
      throw new BadRequestException("You cannot message yourself");
    }

    if (recipient.visibilitySettings?.allowMessages === false) {
      throw new BadRequestException("This user is not accepting messages");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const [user1Id, user2Id] = this.getOrderedParticipantIds(actor.id, recipient.id);

      const conversation = await tx.conversation.upsert({
        where: {
          user1Id_user2Id: {
            user1Id,
            user2Id,
          },
        },
        update: {},
        create: {
          user1Id,
          user2Id,
        },
      });

      const created = await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderId: actor.id,
          content: body.content,
          type: body.type,
          fileUrl: body.fileUrl ?? null,
        },
        include: messageInclude,
      });

      await tx.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: created.createdAt,
        },
      });

      await this.notifications.create(
        {
          userId: recipient.id,
          type: "NEW_MESSAGE",
          title: "Nouveau message",
          message: `${this.getDisplayName(actor)} vous a envoye un message`,
          data: {
            conversationId: conversation.id,
            messageId: created.id,
          },
        },
        tx,
      );

      return {
        conversationId: conversation.id,
        message: created,
      };
    });

    return {
      success: true as const,
      conversationId: result.conversationId,
      message: this.mapMessage(result.message),
    };
  }

  private async getMessages(actor: Actor, query: MessageQuery) {
    if (!query.conversationId) {
      throw new BadRequestException("conversationId is required");
    }

    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: query.conversationId,
        OR: [{ user1Id: actor.id }, { user2Id: actor.id }],
      },
      select: {
        id: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }

    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const [total, messages] = await Promise.all([
      this.prisma.message.count({
        where: {
          conversationId: query.conversationId,
          isDeleted: false,
        },
      }),
      this.prisma.message.findMany({
        where: {
          conversationId: query.conversationId,
          isDeleted: false,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: messageInclude,
      }),
    ]);

    await this.prisma.message.updateMany({
      where: {
        conversationId: query.conversationId,
        senderId: {
          not: actor.id,
        },
        isRead: false,
        isDeleted: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      success: true as const,
      messages: messages.reverse().map((message) => this.mapMessage(message)),
      pagination: this.buildPagination(page, limit, total),
    };
  }

  private async getConversations(actor: Actor) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: actor.id }, { user2Id: actor.id }],
      },
      orderBy: {
        lastMessageAt: "desc",
      },
      include: {
        user1: {
          select: conversationUserSelect,
        },
        user2: {
          select: conversationUserSelect,
        },
        messages: {
          where: {
            isDeleted: false,
          },
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
          select: {
            content: true,
            createdAt: true,
            senderId: true,
            sender: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: {
                  not: actor.id,
                },
                isRead: false,
                isDeleted: false,
              },
            },
          },
        },
      },
    });

    return {
      success: true as const,
      conversations: conversations.map((conversation) =>
        this.mapConversation(conversation, actor.id),
      ),
    };
  }

  private mapConversation(conversation: ConversationRecord, actorId: string) {
    const otherUser = conversation.user1Id === actorId ? conversation.user2 : conversation.user1;
    const lastMessage = conversation.messages[0];

    return {
      id: conversation.id,
      otherUser: {
        id: otherUser.id,
        firstName: otherUser.firstName,
        lastName: otherUser.lastName,
        avatar: otherUser.avatar,
        role: otherUser.role,
      },
      lastMessage: lastMessage
        ? {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            senderId: lastMessage.senderId,
            senderName: this.getName(lastMessage.sender.firstName, lastMessage.sender.lastName),
          }
        : null,
      lastMessageAt: conversation.lastMessageAt,
      unreadCount: conversation._count.messages,
      createdAt: conversation.createdAt,
    };
  }

  private mapMessage(message: MessageRecord) {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      type: message.type,
      fileUrl: message.fileUrl,
      isRead: message.isRead,
      readAt: message.readAt,
      isDeleted: message.isDeleted,
      createdAt: message.createdAt,
      sender: message.sender,
    };
  }

  private getOrderedParticipantIds(left: string, right: string): [string, string] {
    return [left, right].sort((a, b) => a.localeCompare(b)) as [string, string];
  }

  private buildPagination(page: number, limit: number, total: number) {
    return {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      hasMore: page * limit < total,
    };
  }

  private getDisplayName(actor: Actor) {
    return this.getName(actor.firstName, actor.lastName) ?? "Un utilisateur";
  }

  private getName(firstName?: string | null, lastName?: string | null) {
    const fullName = `${firstName ?? ""} ${lastName ?? ""}`.trim();
    return fullName || undefined;
  }
}
