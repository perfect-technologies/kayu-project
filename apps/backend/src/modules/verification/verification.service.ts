import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  VerificationDoc,
  VerificationDocKind,
  VerificationStatus,
} from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import type { UploadVerificationDocInput } from "../../common/contract";
import { PrismaService } from "../../database/prisma.service";
import { StorageService } from "../storage/storage.service";

export const REQUIRED_VERIFICATION_KINDS: VerificationDocKind[] = [
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
        select: { verificationStatus: true },
      }),
      this.prisma.verificationDoc.findMany({
        where: { providerId },
        orderBy: { uploadedAt: "asc" },
      }),
    ]);

    return this.buildStateResponse(provider.verificationStatus, docs);
  }

  async uploadDoc(actor: Actor, body: UploadVerificationDocInput) {
    const providerId = await this.requireProviderId(actor);
    this.storage.assertOwnedPath("verification", actor.id, body.path);
    this.storage.assertUploadAllowed("verification", body.mime, body.bytes);
    const fileName = this.normalizeFileName(body.kind, body.fileName);

    const { doc, replacedPath } = await this.prisma.$transaction(async (tx) => {
      const provider = await tx.provider.findUniqueOrThrow({
        where: { id: providerId },
        select: { verificationStatus: true },
      });
      const existing = await tx.verificationDoc.findUnique({
        where: { providerId_kind: { providerId, kind: body.kind } },
        select: { storagePath: true },
      });
      const fields = {
        storagePath: body.path,
        fileName,
        mime: body.mime,
        bytes: body.bytes,
        uploadedAt: new Date(),
        reviewedAt: null,
        reviewedById: null,
        decision: null,
        rejectionReason: null,
      };
      const doc = await tx.verificationDoc.upsert({
        where: { providerId_kind: { providerId, kind: body.kind } },
        create: { providerId, kind: body.kind, ...fields },
        update: fields,
      });

      const docs = await tx.verificationDoc.findMany({ where: { providerId } });
      const nextStatus = this.nextStatusAfterDocMutation(provider.verificationStatus, docs);
      if (nextStatus !== provider.verificationStatus) {
        await tx.provider.update({
          where: { id: providerId },
          data: { verificationStatus: nextStatus },
        });
      }

      const replacedPath =
        existing && existing.storagePath !== body.path ? existing.storagePath : null;
      return { doc, replacedPath };
    });

    if (replacedPath) {
      await this.storage.removeObjects([{ purpose: "verification", path: replacedPath }], actor.id);
    }

    return { success: true as const, doc: this.mapDoc(doc) };
  }

  async removeDoc(actor: Actor, id: string) {
    const providerId = await this.requireProviderId(actor);
    const removedPath = await this.prisma.$transaction(async (tx) => {
      const [provider, doc] = await Promise.all([
        tx.provider.findUniqueOrThrow({
          where: { id: providerId },
          select: { verificationStatus: true },
        }),
        tx.verificationDoc.findUnique({
          where: { id },
          select: { id: true, providerId: true, storagePath: true },
        }),
      ]);
      if (!doc || doc.providerId !== providerId) {
        throw new NotFoundException("Document introuvable");
      }

      await tx.verificationDoc.delete({ where: { id } });

      const remainingDocs = await tx.verificationDoc.findMany({ where: { providerId } });
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
      return doc.storagePath;
    });

    await this.storage.removeObjects([{ purpose: "verification", path: removedPath }], actor.id);
    return { success: true as const };
  }

  async submit(actor: Actor) {
    const providerId = await this.requireProviderId(actor);
    const docs = await this.prisma.verificationDoc.findMany({
      where: { providerId },
    });
    const present = new Set(docs.map((d) => d.kind));
    const missing = REQUIRED_VERIFICATION_KINDS.filter((k) => !present.has(k));
    if (missing.length > 0) {
      throw new BadRequestException({
        message: "Documents manquants",
        missing,
      });
    }

    const provider = await this.prisma.provider.update({
      where: { id: providerId },
      data: { verificationStatus: "UNDER_REVIEW" },
      select: { verificationStatus: true },
    });

    return this.buildStateResponse(provider.verificationStatus, docs);
  }

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
    verificationStatus: VerificationStatus,
    docs: VerificationDoc[],
  ): VerificationStatus {
    if (this.hasMissingRequiredDocs(docs)) return "PENDING";
    if (docs.some((doc) => doc.decision === "REJECTED")) return "REJECTED";
    if (verificationStatus === "VERIFIED" && this.requiredDocsApproved(docs)) return "VERIFIED";
    if (verificationStatus === "UNDER_REVIEW") return "UNDER_REVIEW";
    return "PENDING";
  }

  private buildStateResponse(verificationStatus: VerificationStatus, docs: VerificationDoc[]) {
    const state = this.deriveState(verificationStatus, docs);
    const present = new Set(docs.map((d) => d.kind));
    const missingKinds = REQUIRED_VERIFICATION_KINDS.filter((k) => !present.has(k));
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
      progress: this.deriveProgress(state, docs.length),
      docs: docs.map((d) => this.mapDoc(d)),
      missingKinds,
      rejectionReason: firstRejected?.rejectionReason ?? null,
      submittedAt,
      reviewedAt,
      storage: VERIFICATION_STORAGE,
    };
  }

  private deriveState(
    verificationStatus: VerificationStatus,
    docs: VerificationDoc[],
  ): VerificationStateLabel {
    if (this.hasMissingRequiredDocs(docs)) {
      return docs.length === 0 ? "NOT_STARTED" : "IN_PROGRESS";
    }
    if (docs.some((doc) => doc.decision === "REJECTED")) return "REJECTED";
    if (verificationStatus === "VERIFIED" || this.requiredDocsApproved(docs)) return "VERIFIED";
    if (verificationStatus === "UNDER_REVIEW") return "IN_REVIEW";
    return "IN_PROGRESS";
  }

  private deriveProgress(state: VerificationStateLabel, docCount: number): number {
    if (state === "VERIFIED") return 100;
    if (state === "IN_REVIEW") return 75;
    if (state === "NOT_STARTED" || state === "REJECTED") return 0;
    const total = REQUIRED_VERIFICATION_KINDS.length;
    return Math.round((Math.min(docCount, total) / total) * 70);
  }

  private latestUploadedAt(docs: VerificationDoc[]): Date | null {
    return docs.reduce<Date | null>((latest, d) => {
      if (!latest || d.uploadedAt > latest) return d.uploadedAt;
      return latest;
    }, null);
  }

  private hasMissingRequiredDocs(docs: VerificationDoc[]) {
    const present = new Set(docs.map((doc) => doc.kind));
    return REQUIRED_VERIFICATION_KINDS.some((kind) => !present.has(kind));
  }

  private requiredDocsApproved(docs: VerificationDoc[]) {
    return REQUIRED_VERIFICATION_KINDS.every((kind) =>
      docs.some((doc) => doc.kind === kind && doc.decision === "APPROVED"),
    );
  }

  private mapDoc(doc: VerificationDoc) {
    return {
      id: doc.id,
      kind: doc.kind,
      storagePath: doc.storagePath,
      fileName: doc.fileName,
      mime: doc.mime,
      bytes: doc.bytes,
      uploadedAt: doc.uploadedAt,
      reviewedAt: doc.reviewedAt,
      reviewedById: doc.reviewedById,
      decision: doc.decision,
      rejectionReason: doc.rejectionReason,
      storagePolicy: VERIFICATION_STORAGE.mode,
    };
  }

  private normalizeFileName(kind: VerificationDocKind, fileName?: string) {
    const raw = fileName?.trim();
    if (!raw) return `${kind.toLowerCase()}-${Date.now()}.bin`;
    const sanitized = raw.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
    return sanitized.slice(0, 255) || `${kind.toLowerCase()}-${Date.now()}.bin`;
  }
}
