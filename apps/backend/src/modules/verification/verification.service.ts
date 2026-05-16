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
import { StorageService } from "../storage/storage.service";

type UploadDocInput = {
  kind: VerificationDocKind;
  path: string;
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

const VERIFICATION_STORAGE = {
  mode: "SUPABASE_PRIVATE" as const,
  title: "Stockage privé Supabase",
  description:
    "Les pièces KYC sont stockées dans un bucket privé Supabase. Seule l'équipe de vérification y accède.",
};

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

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
    this.storage.assertOwnedPath("verification", actor.id, body.path);
    const normalizedFileName = this.normalizeFileName(body.kind, body.fileName);
    const generatedUrl = this.storage.resolveStoredUrl("verification", body.path);

    const doc = await this.prisma.$transaction(async (tx) => {
      const provider = await tx.provider.findUniqueOrThrow({
        where: { id: providerId },
        select: { verificationStatus: true },
      });
      const existing = await tx.verificationDoc.findFirst({
        where: { providerId, kind: body.kind },
        select: { id: true },
      });

      const saved = existing
        ? await tx.verificationDoc.update({
            where: { id: existing.id },
            data: {
              url: generatedUrl,
              fileName: normalizedFileName,
              fileSize: body.fileSize ?? null,
              mimeType: body.mimeType ?? null,
              uploadedAt: new Date(),
              reviewedAt: null,
              reviewedBy: null,
              decision: null,
              rejectionReason: null,
            },
          })
        : await tx.verificationDoc.create({
            data: {
              providerId,
              kind: body.kind,
              url: generatedUrl,
              fileName: normalizedFileName,
              fileSize: body.fileSize ?? null,
              mimeType: body.mimeType ?? null,
            },
          });

      const docs = await tx.verificationDoc.findMany({
        where: { providerId },
      });
      const nextStatus = this.nextStatusAfterDocMutation(
        provider.verificationStatus,
        docs,
      );
      if (nextStatus !== provider.verificationStatus) {
        await tx.provider.update({
          where: { id: providerId },
          data: { verificationStatus: nextStatus },
        });
      }

      return saved;
    });

    return { success: true as const, doc: this.mapDoc(doc) };
  }

  async removeDoc(actor: Actor, id: string) {
    const providerId = await this.requireProviderId(actor);
    await this.prisma.$transaction(async (tx) => {
      const [provider, doc] = await Promise.all([
        tx.provider.findUniqueOrThrow({
          where: { id: providerId },
          select: { verificationStatus: true },
        }),
        tx.verificationDoc.findUnique({
          where: { id },
          select: { id: true, providerId: true },
        }),
      ]);
      if (!doc || doc.providerId !== providerId) {
        throw new NotFoundException("Document introuvable");
      }

      await tx.verificationDoc.delete({ where: { id } });

      const remainingDocs = await tx.verificationDoc.findMany({
        where: { providerId },
      });
      const nextStatus = this.nextStatusAfterDocMutation(
        provider.verificationStatus,
        remainingDocs,
      );
      if (nextStatus !== provider.verificationStatus) {
        await tx.provider.update({
          where: { id: providerId },
          data: { verificationStatus: nextStatus },
        });
      }
    });
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

  private nextStatusAfterDocMutation(
    verificationStatus: "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED",
    docs: VerificationDoc[],
  ) {
    if (this.hasMissingRequiredDocs(docs)) {
      return "PENDING";
    }
    if (docs.some((doc) => doc.decision === "REJECTED")) {
      return "REJECTED";
    }
    if (
      verificationStatus === "VERIFIED" &&
      this.requiredDocsApproved(docs)
    ) {
      return "VERIFIED";
    }
    if (verificationStatus === "UNDER_REVIEW") {
      return "UNDER_REVIEW";
    }
    return "PENDING";
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
      storage: VERIFICATION_STORAGE,
    };
  }

  private deriveState(
    verificationStatus: "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED",
    docs: VerificationDoc[],
  ): VerificationStateLabel {
    if (this.hasMissingRequiredDocs(docs)) {
      if (docs.length === 0) return "NOT_STARTED";
      return "IN_PROGRESS";
    }
    if (docs.some((doc) => doc.decision === "REJECTED")) return "REJECTED";
    if (verificationStatus === "VERIFIED" || this.requiredDocsApproved(docs)) {
      return "VERIFIED";
    }
    if (verificationStatus === "UNDER_REVIEW") return "IN_REVIEW";
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

  private hasMissingRequiredDocs(docs: VerificationDoc[]) {
    const present = new Set(docs.map((doc) => doc.kind));
    return REQUIRED_KINDS.some((kind) => !present.has(kind));
  }

  private requiredDocsApproved(docs: VerificationDoc[]) {
    return REQUIRED_KINDS.every((kind) =>
      docs.some((doc) => doc.kind === kind && doc.decision === "APPROVED"),
    );
  }

  private mapDoc(doc: VerificationDoc) {
    return {
      id: doc.id,
      kind: doc.kind,
      url: doc.url,
      storagePolicy: VERIFICATION_STORAGE.mode,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      uploadedAt: doc.uploadedAt,
      reviewedAt: doc.reviewedAt,
      reviewedBy: doc.reviewedBy,
      decision: doc.decision,
      rejectionReason: doc.rejectionReason,
    };
  }

  private normalizeFileName(kind: VerificationDocKind, fileName?: string) {
    const raw = fileName?.trim();
    if (!raw) {
      return `${kind.toLowerCase()}-${Date.now()}.bin`;
    }

    const sanitized = raw.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
    return sanitized.slice(0, 255) || `${kind.toLowerCase()}-${Date.now()}.bin`;
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
