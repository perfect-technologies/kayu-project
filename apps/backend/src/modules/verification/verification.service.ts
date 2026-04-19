import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  Dispute,
  DisputeEvidence,
  Prisma,
  VerificationDoc,
  VerificationDocKind,
} from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import { PrismaService } from "../../database/prisma.service";

type UploadDocInput = {
  kind: VerificationDocKind;
  url: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
};

type RespondDisputeInput = {
  statement: string;
  evidenceUrls: string[];
};

const REQUIRED_KINDS: VerificationDocKind[] = [
  "ID_FRONT",
  "ID_BACK",
  "SELFIE",
  "ADDRESS",
];

type VerificationStateLabel =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "VERIFIED"
  | "REJECTED";

const disputeInclude = {
  evidences: { orderBy: { uploadedAt: "asc" } },
  booking: {
    select: {
      id: true,
      title: true,
      price: true,
      scheduledDate: true,
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
    },
  },
} satisfies Prisma.DisputeInclude;

type DisputeRecord = Prisma.DisputeGetPayload<{ include: typeof disputeInclude }>;

@Injectable()
export class VerificationService {
  constructor(private readonly prisma: PrismaService) {}

  async getState(actor: Actor) {
    const providerId = await this.requireProviderId(actor);
    const [provider, docs] = await Promise.all([
      this.prisma.provider.findUniqueOrThrow({
        where: { id: providerId },
        select: { verificationStatus: true, updatedAt: true },
      }),
      this.prisma.verificationDoc.findMany({
        where: { providerId },
        orderBy: { uploadedAt: "asc" },
      }),
    ]);

    return this.buildStateResponse(provider.verificationStatus, docs);
  }

  async uploadDoc(actor: Actor, body: UploadDocInput) {
    const providerId = await this.requireProviderId(actor);

    // Only one document per kind — replace any previous doc of this kind.
    await this.prisma.verificationDoc.deleteMany({
      where: { providerId, kind: body.kind },
    });

    const doc = await this.prisma.verificationDoc.create({
      data: {
        providerId,
        kind: body.kind,
        url: body.url,
        fileName: body.fileName ?? null,
        fileSize: body.fileSize ?? null,
        mimeType: body.mimeType ?? null,
      },
    });

    // If the provider was REJECTED, a new upload moves them back to IN_PROGRESS.
    await this.prisma.provider.update({
      where: { id: providerId },
      data: (await this.nextStatusOnUpload(providerId)) ?? {},
    });

    return { success: true as const, doc: this.mapDoc(doc) };
  }

  async removeDoc(actor: Actor, id: string) {
    const providerId = await this.requireProviderId(actor);
    const doc = await this.prisma.verificationDoc.findUnique({
      where: { id },
      select: { id: true, providerId: true },
    });
    if (!doc || doc.providerId !== providerId) {
      throw new NotFoundException("Document introuvable");
    }
    await this.prisma.verificationDoc.delete({ where: { id } });
    return { success: true as const };
  }

  async submit(actor: Actor) {
    const providerId = await this.requireProviderId(actor);
    const docs = await this.prisma.verificationDoc.findMany({
      where: { providerId },
    });
    const present = new Set(docs.map((d) => d.kind));
    const missing = REQUIRED_KINDS.filter((k) => !present.has(k));
    if (missing.length > 0) {
      throw new BadRequestException({
        message: "Documents manquants",
        missing,
      });
    }

    const provider = await this.prisma.provider.update({
      where: { id: providerId },
      data: { verificationStatus: "UNDER_REVIEW" },
      select: { verificationStatus: true, updatedAt: true },
    });

    return this.buildStateResponse(provider.verificationStatus, docs);
  }

  async getDispute(actor: Actor) {
    const providerId = await this.requireProviderId(actor);

    const dispute = await this.prisma.dispute.findFirst({
      where: {
        booking: { providerId },
        status: {
          in: ["NEW", "PENDING_PRO", "INVESTIGATING", "ESCALATED"],
        },
      },
      orderBy: { createdAt: "desc" },
      include: disputeInclude,
    });

    return { dispute: dispute ? this.mapDispute(dispute) : null };
  }

  async respondDispute(
    actor: Actor,
    disputeId: string,
    body: RespondDisputeInput,
  ) {
    const providerId = await this.requireProviderId(actor);

    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { booking: { select: { providerId: true } } },
    });
    if (!dispute || dispute.booking.providerId !== providerId) {
      throw new NotFoundException("Litige introuvable");
    }

    const nextStatus =
      dispute.status === "RESOLVED"
        ? dispute.status
        : dispute.origin === "CLIENT"
          ? "INVESTIGATING"
          : "PENDING_CLIENT";

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.dispute.update({
        where: { id: disputeId },
        data: {
          proStatement: body.statement,
          status: nextStatus,
        },
      });
      if (body.evidenceUrls.length > 0) {
        await tx.disputeEvidence.createMany({
          data: body.evidenceUrls.map((url) => ({
            disputeId,
            uploadedById: actor.id,
            url,
          })),
        });
      }
      return tx.dispute.findUniqueOrThrow({
        where: { id: disputeId },
        include: disputeInclude,
      });
    });

    return { success: true as const, dispute: this.mapDispute(updated) };
  }

  // ---------- Helpers ----------

  private async requireProviderId(actor: Actor): Promise<string> {
    if (actor.role !== "PROVIDER") {
      throw new ForbiddenException("Accès réservé aux prestataires");
    }
    const provider = await this.prisma.provider.findUnique({
      where: { userId: actor.id },
      select: { id: true },
    });
    if (!provider) {
      throw new BadRequestException("Profil prestataire requis");
    }
    return provider.id;
  }

  private async nextStatusOnUpload(providerId: string) {
    const current = await this.prisma.provider.findUniqueOrThrow({
      where: { id: providerId },
      select: { verificationStatus: true },
    });
    if (current.verificationStatus === "REJECTED") {
      return { verificationStatus: "PENDING" as const };
    }
    return null;
  }

  private buildStateResponse(
    verificationStatus: "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED",
    docs: VerificationDoc[],
  ) {
    const state = this.deriveState(verificationStatus, docs);
    const present = new Set(docs.map((d) => d.kind));
    const missingKinds = REQUIRED_KINDS.filter((k) => !present.has(k));

    const progress = this.deriveProgress(state, docs.length);
    const firstRejected = docs.find((d) => d.decision === "REJECTED");
    const submittedAt =
      state === "IN_REVIEW" || state === "VERIFIED" || state === "REJECTED"
        ? this.latestUploadedAt(docs)
        : null;
    const reviewedAt = docs.reduce<Date | null>((latest, d) => {
      if (!d.reviewedAt) return latest;
      if (!latest || d.reviewedAt > latest) return d.reviewedAt;
      return latest;
    }, null);

    return {
      state,
      progress,
      docs: docs.map((d) => this.mapDoc(d)),
      missingKinds,
      rejectionReason: firstRejected?.rejectionReason ?? null,
      submittedAt,
      reviewedAt,
    };
  }

  private deriveState(
    verificationStatus: "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED",
    docs: VerificationDoc[],
  ): VerificationStateLabel {
    if (verificationStatus === "VERIFIED") return "VERIFIED";
    if (verificationStatus === "REJECTED") return "REJECTED";
    if (verificationStatus === "UNDER_REVIEW") return "IN_REVIEW";
    if (docs.length === 0) return "NOT_STARTED";
    return "IN_PROGRESS";
  }

  private deriveProgress(state: VerificationStateLabel, docCount: number): number {
    if (state === "VERIFIED") return 100;
    if (state === "IN_REVIEW") return 75;
    if (state === "NOT_STARTED" || state === "REJECTED") return 0;
    const total = REQUIRED_KINDS.length;
    const capped = Math.min(docCount, total);
    return Math.round((capped / total) * 70);
  }

  private latestUploadedAt(docs: VerificationDoc[]): Date | null {
    return docs.reduce<Date | null>((latest, d) => {
      if (!latest || d.uploadedAt > latest) return d.uploadedAt;
      return latest;
    }, null);
  }

  private mapDoc(doc: VerificationDoc) {
    return {
      id: doc.id,
      kind: doc.kind,
      url: doc.url,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      uploadedAt: doc.uploadedAt,
      decision: doc.decision,
      rejectionReason: doc.rejectionReason,
    };
  }

  private mapDispute(dispute: DisputeRecord) {
    return {
      id: dispute.id,
      bookingId: dispute.bookingId,
      origin: dispute.origin,
      openedById: dispute.openedById,
      reason: dispute.reason,
      clientStatement: dispute.clientStatement,
      proStatement: dispute.proStatement,
      status: dispute.status,
      severity: dispute.severity,
      resolution: dispute.resolution,
      resolutionPct: dispute.resolutionPct,
      resolvedAt: dispute.resolvedAt,
      deadlineAt: dispute.deadlineAt,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt,
      evidences: dispute.evidences.map((e) =>
        this.mapEvidence(e, dispute.openedById),
      ),
      booking: dispute.booking
        ? {
            id: dispute.booking.id,
            title: dispute.booking.title,
            price: dispute.booking.price,
            scheduledDate: dispute.booking.scheduledDate,
          }
        : null,
      client: dispute.booking?.client
        ? {
            id: dispute.booking.client.id,
            firstName: dispute.booking.client.firstName,
            lastName: dispute.booking.client.lastName,
            avatar: dispute.booking.client.avatar,
          }
        : null,
    };
  }

  private mapEvidence(evidence: DisputeEvidence, openedById: string) {
    const uploadedByRole: "client" | "pro" | "ops" =
      evidence.uploadedById === openedById ? "client" : "pro";
    return {
      id: evidence.id,
      url: evidence.url,
      note: evidence.note,
      uploadedAt: evidence.uploadedAt,
      uploadedByRole,
    };
  }
}
