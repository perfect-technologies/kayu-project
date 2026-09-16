import { HttpStatus, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import type {
  AdminReviewVerificationDocInput,
  AdminVerificationQueueQuery,
} from "../../common/contract";
import { apiError } from "../../common/http/errors";
import { pageArgs } from "../../common/http/pagination";
import { fullName } from "../../common/util/people";
import { PrismaService } from "../../database/prisma.service";
import { ActivityLogService } from "../activity/activity-log.service";
import { NotificationsService } from "../notifications/notifications.service";
import {
  deriveVerificationStatusFromDocs,
  findRejectionReason,
  latestReviewedAt,
  latestUploadedAt,
  mapVerificationDoc,
  verificationNotification,
} from "./admin-verification.helpers";

const submissionInclude = {
  user: { select: { id: true, email: true, firstName: true, lastName: true } },
  verificationDocs: { orderBy: [{ uploadedAt: "asc" }, { kind: "asc" }] },
} satisfies Prisma.ProviderInclude;

type SubmissionRecord = Prisma.ProviderGetPayload<{ include: typeof submissionInclude }>;

@Injectable()
export class AdminVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly activity: ActivityLogService,
  ) {}

  async listSubmissions(query: AdminVerificationQueueQuery) {
    const where: Prisma.ProviderWhereInput = {
      verificationDocs: { some: {} },
      verificationStatus: query.status ?? { in: ["UNDER_REVIEW", "REJECTED"] },
    };
    if (query.q) {
      where.OR = [
        { displayName: { contains: query.q, mode: "insensitive" } },
        { user: { firstName: { contains: query.q, mode: "insensitive" } } },
        { user: { lastName: { contains: query.q, mode: "insensitive" } } },
        { user: { email: { contains: query.q, mode: "insensitive" } } },
      ];
    }

    const [total, providers, underReview, rejected, verified] = await Promise.all([
      this.prisma.provider.count({ where }),
      this.prisma.provider.findMany({
        where,
        ...pageArgs(query),
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
        include: submissionInclude,
      }),
      this.countWithDocs("UNDER_REVIEW"),
      this.countWithDocs("REJECTED"),
      this.countWithDocs("VERIFIED"),
    ]);

    return {
      success: true as const,
      submissions: providers.map((provider) => this.mapSubmission(provider)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
        hasMore: query.page * query.limit < total,
      },
      stats: { underReview, rejected, verified },
    };
  }

  async reviewDoc(actor: Actor, body: AdminReviewVerificationDocInput, ipAddress?: string | null) {
    const rejectionReason = body.rejectionReason?.trim() || null;

    const result = await this.prisma.$transaction(async (tx) => {
      const provider = await tx.provider.findUnique({
        where: { id: body.providerId },
        select: { id: true, userId: true, verificationStatus: true },
      });
      if (!provider) {
        throw apiError(HttpStatus.NOT_FOUND, "NOT_FOUND", "Prestataire introuvable");
      }

      const existing = await tx.verificationDoc.findFirst({
        where: { id: body.docId, providerId: body.providerId },
      });
      if (!existing) {
        throw apiError(HttpStatus.NOT_FOUND, "NOT_FOUND", "Document introuvable");
      }

      const reviewedDoc = await tx.verificationDoc.update({
        where: { id: existing.id },
        data: {
          decision: body.decision,
          rejectionReason: body.decision === "REJECTED" ? rejectionReason : null,
          reviewedAt: new Date(),
          reviewedById: actor.id,
        },
      });

      const docs = await tx.verificationDoc.findMany({
        where: { providerId: body.providerId },
        orderBy: [{ uploadedAt: "asc" }, { kind: "asc" }],
      });
      const verificationStatus = deriveVerificationStatusFromDocs(docs);

      if (verificationStatus !== provider.verificationStatus) {
        await tx.provider.update({
          where: { id: body.providerId },
          data: { verificationStatus },
        });
        await this.notifications.create(
          verificationNotification(
            provider.userId,
            provider.id,
            verificationStatus,
            findRejectionReason(docs),
          ),
          tx,
        );
      }

      await this.activity.log(
        {
          userId: actor.id,
          action: "verification.review_doc",
          entityType: "VerificationDoc",
          entityId: body.docId,
          metadata: {
            providerId: body.providerId,
            kind: reviewedDoc.kind,
            decision: body.decision,
            rejectionReason,
            previousStatus: provider.verificationStatus,
            verificationStatus,
          },
          ipAddress: ipAddress ?? null,
        },
        tx,
      );

      return { provider, verificationStatus, docs, reviewedDoc };
    });

    return {
      success: true as const,
      providerId: body.providerId,
      previousStatus: result.provider.verificationStatus,
      verificationStatus: result.verificationStatus,
      docs: result.docs.map(mapVerificationDoc),
      reviewedDoc: mapVerificationDoc(result.reviewedDoc),
      reviewedAt: latestReviewedAt(result.docs),
      rejectionReason: findRejectionReason(result.docs),
    };
  }

  private countWithDocs(status: "UNDER_REVIEW" | "REJECTED" | "VERIFIED") {
    return this.prisma.provider.count({
      where: { verificationStatus: status, verificationDocs: { some: {} } },
    });
  }

  private mapSubmission(provider: SubmissionRecord) {
    const docs = provider.verificationDocs;
    return {
      providerId: provider.id,
      providerName: fullName(provider.user, provider.displayName),
      providerEmail: provider.user.email,
      displayName: provider.displayName,
      verificationStatus: provider.verificationStatus,
      submittedAt: latestUploadedAt(docs),
      reviewedAt: latestReviewedAt(docs),
      rejectionReason: findRejectionReason(docs),
      docs: docs.map(mapVerificationDoc),
      counts: {
        total: docs.length,
        pending: docs.filter((doc) => !doc.decision).length,
        approved: docs.filter((doc) => doc.decision === "APPROVED").length,
        rejected: docs.filter((doc) => doc.decision === "REJECTED").length,
      },
    };
  }
}
