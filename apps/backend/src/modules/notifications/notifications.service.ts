import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import { PrismaService } from "../../database/prisma.service";

type NotificationQuery = {
  unreadOnly?: boolean;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

type NotificationCreateParams = {
  userId: string;
  type: Prisma.NotificationUncheckedCreateInput["type"];
  title: string;
  message: string;
  data?: Prisma.InputJsonValue;
};

type NotificationCreateManyParams = NotificationCreateParams[];

type NotificationRecord = Prisma.NotificationGetPayload<Record<string, never>>;

type PrismaClientOrTransaction = PrismaService | Prisma.TransactionClient;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(actor: Actor, query: NotificationQuery) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;
    const where: Prisma.NotificationWhereInput = {
      userId: actor.id,
      ...(query.unreadOnly ? { isRead: false } : {}),
    };

    const [total, unreadCount, notifications] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: {
          userId: actor.id,
          isRead: false,
        },
      }),
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: query.sortOrder ?? "desc",
        },
      }),
    ]);

    return {
      success: true as const,
      notifications: notifications.map((notification) => this.mapNotification(notification)),
      unreadCount,
      pagination: this.buildPagination(page, limit, total),
    };
  }

  async markRead(actor: Actor, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        userId: actor.id,
      },
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    const updated =
      notification.isRead && notification.readAt
        ? notification
        : await this.prisma.notification.update({
            where: { id },
            data: {
              isRead: true,
              readAt: new Date(),
            },
          });

    return {
      success: true as const,
      notification: this.mapNotification(updated),
    };
  }

  async markAllRead(actor: Actor) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId: actor.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      success: true as const,
      updatedCount: result.count,
    };
  }

  async create(
    params: NotificationCreateParams,
    client: PrismaClientOrTransaction = this.prisma,
  ) {
    const notification = await client.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data,
      },
    });

    return this.mapNotification(notification);
  }

  async createMany(
    params: NotificationCreateManyParams,
    client: PrismaClientOrTransaction = this.prisma,
  ) {
    if (params.length === 0) {
      return { count: 0 };
    }

    return client.notification.createMany({
      data: params.map((notification) => ({
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
      })),
    });
  }

  private mapNotification(notification: NotificationRecord) {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
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
}
