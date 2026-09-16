import { Injectable, NotFoundException } from "@nestjs/common";
import type { Notification, Prisma } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import type { NotificationsQuery } from "../../common/contract";
import { pageArgs, toPage } from "../../common/http/pagination";
import { PrismaService } from "../../database/prisma.service";

export type NotificationCreateParams = {
  userId: string;
  type: Prisma.NotificationUncheckedCreateInput["type"];
  title: string;
  message: string;
  data?: Prisma.InputJsonValue;
};

type NotificationClient = Pick<Prisma.TransactionClient, "notification">;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(actor: Actor, query: NotificationsQuery) {
    const where: Prisma.NotificationWhereInput = {
      userId: actor.id,
      ...(query.unreadOnly ? { isRead: false } : {}),
    };

    const [total, unreadCount, rows] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId: actor.id, isRead: false } }),
      this.prisma.notification.findMany({
        where,
        ...pageArgs(query),
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
    ]);

    return { ...toPage(rows.map((row) => this.map(row)), total, query), unreadCount };
  }

  async markRead(actor: Actor, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId: actor.id },
    });
    if (!notification) throw new NotFoundException("Notification introuvable");

    const updated = notification.isRead
      ? notification
      : await this.prisma.notification.update({
          where: { id },
          data: { isRead: true, readAt: new Date() },
        });
    return this.map(updated);
  }

  async markAllRead(actor: Actor) {
    const result = await this.prisma.notification.updateMany({
      where: { userId: actor.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { updatedCount: result.count };
  }

  async create(params: NotificationCreateParams, client: NotificationClient = this.prisma) {
    const notification = await client.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data,
      },
    });
    return this.map(notification);
  }

  async createMany(params: NotificationCreateParams[], client: NotificationClient = this.prisma) {
    if (params.length === 0) return { count: 0 };
    return client.notification.createMany({ data: params });
  }

  private map(notification: Notification) {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
  }
}
