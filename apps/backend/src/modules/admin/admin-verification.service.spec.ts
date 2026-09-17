import assert from "node:assert/strict";
import test from "node:test";
import { HttpException } from "@nestjs/common";
import type { VerificationDoc } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import { deriveVerificationStatusFromDocs } from "./admin-verification.helpers";
import { AdminVerificationService } from "./admin-verification.service";

const admin = { id: "admin_1", role: "ADMIN", isActive: true } as Actor;
const uploadedAt = new Date("2026-09-10T10:00:00.000Z");

function doc(kind: VerificationDoc["kind"], decision: VerificationDoc["decision"] = null): VerificationDoc {
  return {
    id: `doc_${kind.toLowerCase()}`,
    providerId: "provider_1",
    kind,
    storagePath: `verification/provider_user/${kind.toLowerCase()}.jpg`,
    fileName: `${kind.toLowerCase()}.jpg`,
    mime: "image/jpeg",
    bytes: 1024,
    uploadedAt,
    reviewedAt: decision ? uploadedAt : null,
    reviewedById: decision ? "admin_0" : null,
    decision,
    rejectionReason: decision === "REJECTED" ? "Floue" : null,
  };
}

test("status derivation: missing required docs, rejection, full approval, otherwise under review", () => {
  assert.equal(deriveVerificationStatusFromDocs([doc("ID_FRONT", "APPROVED")]), "PENDING");
  assert.equal(
    deriveVerificationStatusFromDocs([
      doc("ID_FRONT", "APPROVED"),
      doc("ID_BACK", "REJECTED"),
      doc("SELFIE"),
      doc("ADDRESS"),
    ]),
    "REJECTED",
  );
  assert.equal(
    deriveVerificationStatusFromDocs([
      doc("ID_FRONT", "APPROVED"),
      doc("ID_BACK", "APPROVED"),
      doc("SELFIE", "APPROVED"),
      doc("ADDRESS", "APPROVED"),
      doc("CERT_OPTIONAL"),
    ]),
    "VERIFIED",
  );
  assert.equal(
    deriveVerificationStatusFromDocs([
      doc("ID_FRONT", "APPROVED"),
      doc("ID_BACK"),
      doc("SELFIE", "APPROVED"),
      doc("ADDRESS", "APPROVED"),
    ]),
    "UNDER_REVIEW",
  );
});

function makeService(docs: VerificationDoc[], status = "UNDER_REVIEW") {
  const calls = {
    providerUpdates: [] as unknown[],
    notifications: [] as Array<Record<string, any>>,
    logs: [] as Array<Record<string, any>>,
    findFirst: [] as unknown[],
  };
  const tx = {
    provider: {
      findUnique: async () => ({ id: "provider_1", userId: "provider_user", verificationStatus: status }),
      update: async (args: unknown) => {
        calls.providerUpdates.push(args);
        return {};
      },
    },
    verificationDoc: {
      findFirst: async (args: { where: { id: string; providerId: string } }) => {
        calls.findFirst.push(args);
        return docs.find((item) => item.id === args.where.id && item.providerId === args.where.providerId) ?? null;
      },
      update: async ({ where, data }: { where: { id: string }; data: Partial<VerificationDoc> }) => {
        const target = docs.find((item) => item.id === where.id)!;
        Object.assign(target, data);
        return { ...target };
      },
      findMany: async () => docs,
    },
  };
  const prisma = { $transaction: async <T>(callback: (client: typeof tx) => Promise<T>) => callback(tx) };
  const notifications = { create: async (params: Record<string, unknown>) => calls.notifications.push(params) };
  const activity = { log: async (entry: Record<string, unknown>) => calls.logs.push(entry) };
  return {
    service: new AdminVerificationService(prisma as never, notifications as never, activity as never),
    calls,
  };
}

test("approving the last pending document verifies the provider, notifies and journals", async () => {
  const docs = [doc("ID_FRONT", "APPROVED"), doc("ID_BACK", "APPROVED"), doc("SELFIE", "APPROVED"), doc("ADDRESS")];
  const { service, calls } = makeService(docs);

  const result = await service.reviewDoc(
    admin,
    { providerId: "provider_1", docId: "doc_address", decision: "APPROVED" },
    "10.0.0.3",
  );

  assert.equal(result.success, true);
  assert.equal(result.previousStatus, "UNDER_REVIEW");
  assert.equal(result.verificationStatus, "VERIFIED");
  assert.equal(result.reviewedDoc.reviewedById, "admin_1");
  assert.equal(result.reviewedDoc.storagePath, "verification/provider_user/address.jpg");
  assert.deepEqual(calls.providerUpdates, [
    { where: { id: "provider_1" }, data: { verificationStatus: "VERIFIED" } },
  ]);
  assert.equal(calls.notifications[0]!.type, "VERIFICATION_UPDATED");
  assert.equal(calls.logs[0]!.action, "verification.review_doc");
  assert.equal(calls.logs[0]!.ipAddress, "10.0.0.3");
});

test("a rejection with an unchanged aggregate status does not notify", async () => {
  const docs = [doc("ID_FRONT", "REJECTED"), doc("ID_BACK"), doc("SELFIE"), doc("ADDRESS")];
  const { service, calls } = makeService(docs, "REJECTED");

  const result = await service.reviewDoc(admin, {
    providerId: "provider_1",
    docId: "doc_id_back",
    decision: "REJECTED",
    rejectionReason: "Coupée",
  });

  assert.equal(result.verificationStatus, "REJECTED");
  assert.equal(result.reviewedDoc.rejectionReason, "Coupée");
  assert.equal(calls.providerUpdates.length, 0);
  assert.equal(calls.notifications.length, 0);
});

test("a document that belongs to another provider is a 404", async () => {
  const { service } = makeService([{ ...doc("SELFIE"), providerId: "provider_2" }]);
  await assert.rejects(
    () => service.reviewDoc(admin, { providerId: "provider_1", docId: "doc_selfie", decision: "APPROVED" }),
    (error: unknown) => error instanceof HttpException && error.getStatus() === 404,
  );
});
