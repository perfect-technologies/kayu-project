import { HttpStatus } from "@nestjs/common";
import type {
  Prisma,
  VerificationDoc,
  VerificationDocKind,
  VerificationStatus,
} from "@prisma/client";
import { apiError } from "../../common/http/errors";
import type { NotificationCreateParams } from "../notifications/notifications.service";

export const REQUIRED_VERIFICATION_KINDS: VerificationDocKind[] = [
  "ID_FRONT",
  "ID_BACK",
  "SELFIE",
  "ADDRESS",
];

type DocClient = Pick<Prisma.TransactionClient, "verificationDoc">;

export function mapVerificationDoc(doc: VerificationDoc) {
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
  };
}

export function deriveVerificationStatusFromDocs(docs: VerificationDoc[]): VerificationStatus {
  const present = new Set(docs.map((doc) => doc.kind));
  if (REQUIRED_VERIFICATION_KINDS.some((kind) => !present.has(kind))) return "PENDING";
  if (docs.some((doc) => doc.decision === "REJECTED")) return "REJECTED";
  const required = docs.filter((doc) => REQUIRED_VERIFICATION_KINDS.includes(doc.kind));
  if (required.every((doc) => doc.decision === "APPROVED")) return "VERIFIED";
  return "UNDER_REVIEW";
}

export function latestUploadedAt(docs: VerificationDoc[]): Date | null {
  return docs.reduce<Date | null>(
    (latest, doc) => (!latest || doc.uploadedAt > latest ? doc.uploadedAt : latest),
    null,
  );
}

export function latestReviewedAt(docs: VerificationDoc[]): Date | null {
  return docs.reduce<Date | null>((latest, doc) => {
    if (!doc.reviewedAt) return latest;
    return !latest || doc.reviewedAt > latest ? doc.reviewedAt : latest;
  }, null);
}

export function findRejectionReason(docs: VerificationDoc[]): string | null {
  return docs.find((doc) => doc.decision === "REJECTED")?.rejectionReason ?? null;
}

export async function approveDocsForOverride(
  tx: DocClient,
  providerId: string,
  reviewerId: string,
): Promise<void> {
  const docs = await tx.verificationDoc.findMany({
    where: { providerId },
    orderBy: [{ uploadedAt: "asc" }, { kind: "asc" }],
  });
  const present = new Set(docs.map((doc) => doc.kind));
  const missingKinds = REQUIRED_VERIFICATION_KINDS.filter((kind) => !present.has(kind));
  if (missingKinds.length > 0) {
    throw apiError(
      HttpStatus.BAD_REQUEST,
      "DOCS_MISSING",
      "Les pièces obligatoires ne sont pas toutes déposées",
      { missingKinds },
    );
  }

  const reviewedAt = new Date();
  for (const doc of docs) {
    if (doc.decision === "APPROVED") continue;
    await tx.verificationDoc.update({
      where: { id: doc.id },
      data: { decision: "APPROVED", rejectionReason: null, reviewedAt, reviewedById: reviewerId },
    });
  }
}

export async function rejectDocsForOverride(
  tx: DocClient,
  providerId: string,
  reviewerId: string,
  rejectionReason: string,
): Promise<void> {
  const docs = await tx.verificationDoc.findMany({
    where: { providerId },
    orderBy: [{ uploadedAt: "asc" }, { kind: "asc" }],
  });
  if (docs.length === 0) {
    throw apiError(HttpStatus.BAD_REQUEST, "DOCS_MISSING", "Aucune pièce déposée");
  }

  const target =
    docs.find((doc) => !doc.decision) ?? docs.find((doc) => doc.decision === "APPROVED") ?? docs[0]!;
  await tx.verificationDoc.update({
    where: { id: target.id },
    data: {
      decision: "REJECTED",
      rejectionReason,
      reviewedAt: new Date(),
      reviewedById: reviewerId,
    },
  });
}

export function verificationNotification(
  userId: string,
  providerId: string,
  status: VerificationStatus,
  rejectionReason?: string | null,
): NotificationCreateParams {
  const messages: Record<VerificationStatus, { title: string; message: string }> = {
    VERIFIED: {
      title: "Profil vérifié",
      message: "Votre profil prestataire est vérifié.",
    },
    REJECTED: {
      title: "Vérification refusée",
      message: rejectionReason
        ? `Votre vérification a été refusée : ${rejectionReason}`
        : "Votre vérification a été refusée.",
    },
    UNDER_REVIEW: {
      title: "Vérification en cours",
      message: "Vos pièces sont en cours d'examen.",
    },
    PENDING: {
      title: "Vérification à compléter",
      message: "Votre vérification doit être complétée.",
    },
  };
  return {
    userId,
    type: "VERIFICATION_UPDATED",
    ...messages[status],
    data: { providerId, verificationStatus: status },
  };
}
