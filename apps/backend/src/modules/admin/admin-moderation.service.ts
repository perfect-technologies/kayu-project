import { HttpStatus, Injectable } from "@nestjs/common";
import type { Prisma, Report, ReportTargetKind } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import type {
  AdminContactSearchQuery,
  AdminConversationSearchQuery,
  AdminMessagesQuery,
  AdminReportSearchQuery,
  AdminResolveReportInput,
  AdminReviewSearchQuery,
  AdminUpdateContactInput,
  AdminUpdateReviewInput,
} from "../../common/contract";
import { apiError } from "../../common/http/errors";
import { pageArgs, toPage } from "../../common/http/pagination";
import { lockRow } from "../../common/util/db";
import { fullName } from "../../common/util/people";
import { PrismaService } from "../../database/prisma.service";
import { ActivityLogService } from "../activity/activity-log.service";
import { recomputeProviderAggregates } from "../reviews/rating-aggregates";
import { StorageService, type StoredObject } from "../storage/storage.service";

const nameSelect = { id: true, firstName: true, lastName: true } as const;

const reviewInclude = {
  client: { select: nameSelect },
  provider: { select: { id: true, displayName: true } },
} satisfies Prisma.ReviewInclude;

const conversationInclude = {
  client: { select: nameSelect },
  provider: { select: { id: true, userId: true, displayName: true } },
  _count: { select: { messages: true } },
} satisfies Prisma.ConversationInclude;

const reportInclude = {
  reporter: { select: nameSelect },
} satisfies Prisma.ReportInclude;

type ReviewRecord = Prisma.ReviewGetPayload<{ include: typeof reviewInclude }>;
type ConversationRecord = Prisma.ConversationGetPayload<{ include: typeof conversationInclude }>;
type ReportRecord = Prisma.ReportGetPayload<{ include: typeof reportInclude }>;
type ReportTarget = { kind: ReportTargetKind; id: string; label: string; exists: boolean };

export const DELETED_MESSAGE_PREVIEW = "Message supprimé";

const excerpt = (value: string | null | undefined, max = 80) => {
  const text = value?.trim();
  if (!text) return null;
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

export function attachmentPaths(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) =>
      item && typeof item === "object" && !Array.isArray(item) && typeof item.path === "string"
        ? item.path
        : null,
    )
    .filter((path): path is string => Boolean(path));
}

@Injectable()
export class AdminModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityLogService,
    private readonly storage: StorageService,
  ) {}

  async listReviews(query: AdminReviewSearchQuery) {
    const where: Prisma.ReviewWhereInput = {};
    if (query.rating !== undefined) where.rating = query.rating;
    if (query.isPublic !== undefined) where.isPublic = query.isPublic;
    if (query.q) {
      const contains = { contains: query.q, mode: "insensitive" as const };
      where.OR = [
        { comment: contains },
        { client: { firstName: contains } },
        { client: { lastName: contains } },
        { provider: { displayName: contains } },
      ];
    }

    const [total, reviews] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        ...pageArgs(query),
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        include: reviewInclude,
      }),
    ]);
    return toPage(reviews.map((review) => this.mapReview(review)), total, query);
  }

  async deleteReview(actor: Actor, reviewId: string, ipAddress?: string | null) {
    await this.prisma.$transaction(async (tx) => {
      const review = await tx.review.findUnique({ where: { id: reviewId } });
      if (!review) throw apiError(HttpStatus.NOT_FOUND, "NOT_FOUND", "Avis introuvable");

      await lockRow(tx, "Provider", review.providerId);
      await tx.review.delete({ where: { id: reviewId } });
      const aggregates = await recomputeProviderAggregates(tx, review.providerId);

      await this.activity.log(
        {
          userId: actor.id,
          action: "review.delete",
          entityType: "Review",
          entityId: reviewId,
          metadata: {
            providerId: review.providerId,
            bookingId: review.bookingId,
            clientId: review.clientId,
            rating: review.rating,
            ratingAvg: aggregates.ratingAvg,
            ratingCount: aggregates.ratingCount,
          },
          ipAddress: ipAddress ?? null,
        },
        tx,
      );
    });
    return { ok: true as const };
  }

  async updateReview(
    actor: Actor,
    reviewId: string,
    body: AdminUpdateReviewInput,
    ipAddress?: string | null,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.findUnique({ where: { id: reviewId } });
      if (!review) throw apiError(HttpStatus.NOT_FOUND, "NOT_FOUND", "Avis introuvable");

      await lockRow(tx, "Provider", review.providerId);
      const updated = await tx.review.update({
        where: { id: reviewId },
        data: { isPublic: body.isPublic },
        include: reviewInclude,
      });
      await recomputeProviderAggregates(tx, review.providerId);

      await this.activity.log(
        {
          userId: actor.id,
          action: "review.update",
          entityType: "Review",
          entityId: reviewId,
          metadata: {
            providerId: review.providerId,
            isPublic: { from: review.isPublic, to: body.isPublic },
          },
          ipAddress: ipAddress ?? null,
        },
        tx,
      );
      return this.mapReview(updated);
    });
  }

  async listConversations(query: AdminConversationSearchQuery) {
    const where: Prisma.ConversationWhereInput = {};
    if (query.q) {
      const contains = { contains: query.q, mode: "insensitive" as const };
      where.OR = [
        { subject: contains },
        { client: { firstName: contains } },
        { client: { lastName: contains } },
        { provider: { displayName: contains } },
      ];
    }

    const [total, conversations] = await Promise.all([
      this.prisma.conversation.count({ where }),
      this.prisma.conversation.findMany({
        where,
        ...pageArgs(query),
        orderBy: [{ lastMessageAt: "desc" }, { id: "asc" }],
        include: conversationInclude,
      }),
    ]);
    return toPage(
      conversations.map((conversation) => this.mapConversation(conversation)),
      total,
      query,
    );
  }

  async conversationMessages(conversationId: string, query: AdminMessagesQuery) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: conversationInclude,
    });
    if (!conversation) {
      throw apiError(HttpStatus.NOT_FOUND, "NOT_FOUND", "Conversation introuvable");
    }

    const where = { conversationId };
    const [total, messages] = await Promise.all([
      this.prisma.message.count({ where }),
      this.prisma.message.findMany({
        where,
        ...pageArgs(query),
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        include: { sender: { select: nameSelect } },
      }),
    ]);

    return {
      ...toPage(
        messages.map((message) => ({
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          sender: {
            id: message.sender.id,
            name: fullName(message.sender),
            side:
              message.senderId === conversation.clientId
                ? ("client" as const)
                : ("provider" as const),
          },
          body: message.body,
          attachments: message.attachments,
          createdAt: message.createdAt,
          deletedAt: message.deletedAt,
        })),
        total,
        query,
      ),
      conversation: this.mapConversation(conversation),
    };
  }

  async deleteConversation(actor: Actor, conversationId: string, ipAddress?: string | null) {
    const objects = await this.prisma.$transaction(async (tx) => {
      const conversation = await tx.conversation.findUnique({
        where: { id: conversationId },
        select: { id: true, clientId: true, providerId: true, subject: true },
      });
      if (!conversation) {
        throw apiError(HttpStatus.NOT_FOUND, "NOT_FOUND", "Conversation introuvable");
      }

      const messages = await tx.message.findMany({
        where: { conversationId },
        select: { attachments: true },
      });
      await tx.conversation.delete({ where: { id: conversationId } });

      await this.activity.log(
        {
          userId: actor.id,
          action: "conversation.delete",
          entityType: "Conversation",
          entityId: conversationId,
          metadata: {
            clientId: conversation.clientId,
            providerId: conversation.providerId,
            subject: conversation.subject,
            messageCount: messages.length,
          },
          ipAddress: ipAddress ?? null,
        },
        tx,
      );

      return messages
        .flatMap((message) => attachmentPaths(message.attachments))
        .map((path): StoredObject | null =>
          this.storage.parsePath(path)?.purpose === "attachments"
            ? { purpose: "attachments", path }
            : null,
        )
        .filter((object): object is StoredObject => Boolean(object));
    });

    if (objects.length > 0) await this.storage.removeObjects(objects, actor.id);
    return { ok: true as const };
  }

  async deleteMessage(actor: Actor, messageId: string, ipAddress?: string | null) {
    await this.prisma.$transaction(async (tx) => {
      const message = await tx.message.findUnique({
        where: { id: messageId },
        select: { id: true, conversationId: true, senderId: true, deletedAt: true },
      });
      if (!message) throw apiError(HttpStatus.NOT_FOUND, "NOT_FOUND", "Message introuvable");
      if (message.deletedAt) return;

      await tx.message.update({ where: { id: messageId }, data: { deletedAt: new Date() } });

      const latest = await tx.message.findFirst({
        where: { conversationId: message.conversationId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: { id: true },
      });
      if (latest?.id === messageId) {
        await tx.conversation.update({
          where: { id: message.conversationId },
          data: { lastPreview: DELETED_MESSAGE_PREVIEW },
        });
      }

      await this.activity.log(
        {
          userId: actor.id,
          action: "message.delete",
          entityType: "Message",
          entityId: messageId,
          metadata: { conversationId: message.conversationId, senderId: message.senderId },
          ipAddress: ipAddress ?? null,
        },
        tx,
      );
    });
    return { ok: true as const };
  }

  async listContacts(query: AdminContactSearchQuery) {
    const where: Prisma.ContactMessageWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.q) {
      const contains = { contains: query.q, mode: "insensitive" as const };
      where.OR = [{ name: contains }, { email: contains }, { subject: contains }];
    }

    const [total, contacts] = await Promise.all([
      this.prisma.contactMessage.count({ where }),
      this.prisma.contactMessage.findMany({
        where,
        ...pageArgs(query),
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      }),
    ]);
    return toPage(contacts, total, query);
  }

  async updateContact(
    actor: Actor,
    contactId: string,
    body: AdminUpdateContactInput,
    ipAddress?: string | null,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const contact = await tx.contactMessage.findUnique({ where: { id: contactId } });
      if (!contact) throw apiError(HttpStatus.NOT_FOUND, "NOT_FOUND", "Message introuvable");

      const updated = await tx.contactMessage.update({
        where: { id: contactId },
        data: { status: body.status },
      });
      await this.activity.log(
        {
          userId: actor.id,
          action: "contact.update",
          entityType: "ContactMessage",
          entityId: contactId,
          metadata: { status: { from: contact.status, to: body.status } },
          ipAddress: ipAddress ?? null,
        },
        tx,
      );
      return updated;
    });
  }

  async deleteContact(actor: Actor, contactId: string, ipAddress?: string | null) {
    await this.prisma.$transaction(async (tx) => {
      const contact = await tx.contactMessage.findUnique({ where: { id: contactId } });
      if (!contact) throw apiError(HttpStatus.NOT_FOUND, "NOT_FOUND", "Message introuvable");

      await tx.contactMessage.delete({ where: { id: contactId } });
      await this.activity.log(
        {
          userId: actor.id,
          action: "contact.delete",
          entityType: "ContactMessage",
          entityId: contactId,
          metadata: { email: contact.email, subject: contact.subject },
          ipAddress: ipAddress ?? null,
        },
        tx,
      );
    });
    return { ok: true as const };
  }

  async listReports(query: AdminReportSearchQuery) {
    const where: Prisma.ReportWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.targetKind) where.targetKind = query.targetKind;

    const [total, reports] = await Promise.all([
      this.prisma.report.count({ where }),
      this.prisma.report.findMany({
        where,
        ...pageArgs(query),
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        include: reportInclude,
      }),
    ]);
    const targets = await this.resolveTargets(reports);
    return toPage(
      reports.map((report) => this.mapReport(report, targets)),
      total,
      query,
    );
  }

  async resolveReport(
    actor: Actor,
    reportId: string,
    body: AdminResolveReportInput,
    ipAddress?: string | null,
  ) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const report = await tx.report.findUnique({ where: { id: reportId } });
      if (!report) throw apiError(HttpStatus.NOT_FOUND, "NOT_FOUND", "Signalement introuvable");
      if (report.status === "RESOLVED") {
        throw apiError(HttpStatus.CONFLICT, "INVALID_TRANSITION", "Ce signalement est déjà traité");
      }

      const saved = await tx.report.update({
        where: { id: reportId },
        data: {
          status: "RESOLVED",
          resolution: body.resolution,
          resolvedById: actor.id,
          resolvedAt: new Date(),
        },
        include: reportInclude,
      });
      await this.activity.log(
        {
          userId: actor.id,
          action: "report.resolve",
          entityType: "Report",
          entityId: reportId,
          metadata: {
            targetKind: report.targetKind,
            targetId: report.targetId,
            resolution: body.resolution,
          },
          ipAddress: ipAddress ?? null,
        },
        tx,
      );
      return saved;
    });

    const targets = await this.resolveTargets([updated]);
    return this.mapReport(updated, targets);
  }

  private async resolveTargets(reports: Report[]): Promise<Map<string, ReportTarget>> {
    const idsFor = (kind: ReportTargetKind) => [
      ...new Set(reports.filter((report) => report.targetKind === kind).map((r) => r.targetId)),
    ];
    const [users, providers, reviews, messages, conversations] = await Promise.all([
      this.findIfAny(idsFor("USER"), (ids) =>
        this.prisma.user.findMany({ where: { id: { in: ids } }, select: nameSelect }),
      ),
      this.findIfAny(idsFor("PROVIDER"), (ids) =>
        this.prisma.provider.findMany({
          where: { id: { in: ids } },
          select: { id: true, displayName: true },
        }),
      ),
      this.findIfAny(idsFor("REVIEW"), (ids) =>
        this.prisma.review.findMany({
          where: { id: { in: ids } },
          select: { id: true, rating: true, comment: true },
        }),
      ),
      this.findIfAny(idsFor("MESSAGE"), (ids) =>
        this.prisma.message.findMany({
          where: { id: { in: ids } },
          select: { id: true, body: true },
        }),
      ),
      this.findIfAny(idsFor("CONVERSATION"), (ids) =>
        this.prisma.conversation.findMany({
          where: { id: { in: ids } },
          select: { id: true, subject: true },
        }),
      ),
    ]);

    const targets = new Map<string, ReportTarget>();
    const put = (kind: ReportTargetKind, id: string, label: string) =>
      targets.set(`${kind}:${id}`, { kind, id, label, exists: true });
    users.forEach((user) => put("USER", user.id, fullName(user)));
    providers.forEach((provider) => put("PROVIDER", provider.id, provider.displayName));
    reviews.forEach((review) =>
      put(
        "REVIEW",
        review.id,
        [`Avis ${review.rating}/5`, excerpt(review.comment)].filter(Boolean).join(" · "),
      ),
    );
    messages.forEach((message) => put("MESSAGE", message.id, excerpt(message.body) ?? "Pièce jointe"));
    conversations.forEach((conversation) =>
      put("CONVERSATION", conversation.id, conversation.subject?.trim() || "Conversation"),
    );
    return targets;
  }

  private async findIfAny<T>(ids: string[], find: (ids: string[]) => Promise<T[]>): Promise<T[]> {
    return ids.length === 0 ? [] : find(ids);
  }

  private mapReport(report: ReportRecord, targets: Map<string, ReportTarget>) {
    return {
      id: report.id,
      targetKind: report.targetKind,
      targetId: report.targetId,
      reason: report.reason,
      status: report.status,
      resolution: report.resolution,
      resolvedById: report.resolvedById,
      resolvedAt: report.resolvedAt,
      createdAt: report.createdAt,
      reporter: report.reporter
        ? { id: report.reporter.id, name: fullName(report.reporter) }
        : null,
      target: targets.get(`${report.targetKind}:${report.targetId}`) ?? {
        kind: report.targetKind,
        id: report.targetId,
        label: "Élément supprimé",
        exists: false,
      },
    };
  }

  private mapReview(review: ReviewRecord) {
    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      reply: review.reply,
      isPublic: review.isPublic,
      createdAt: review.createdAt,
      bookingId: review.bookingId,
      client: { id: review.client.id, name: fullName(review.client) },
      provider: { id: review.provider.id, displayName: review.provider.displayName },
    };
  }

  private mapConversation(conversation: ConversationRecord) {
    return {
      id: conversation.id,
      subject: conversation.subject,
      lastMessageAt: conversation.lastMessageAt,
      lastPreview: conversation.lastPreview,
      client: { id: conversation.client.id, name: fullName(conversation.client) },
      provider: {
        id: conversation.provider.id,
        userId: conversation.provider.userId,
        displayName: conversation.provider.displayName,
      },
      messageCount: conversation._count.messages,
      createdAt: conversation.createdAt,
    };
  }
}
