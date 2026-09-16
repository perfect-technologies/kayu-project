import assert from "node:assert/strict";
import test from "node:test";
import { HttpException } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { AdminProvidersService } from "./admin-providers.service";

const admin = { id: "admin_1", role: "ADMIN", isActive: true } as Actor;
const uploadedAt = new Date("2026-09-10T10:00:00.000Z");

type Doc = {
  id: string;
  providerId: string;
  kind: string;
  decision: "APPROVED" | "REJECTED" | null;
  uploadedAt: Date;
};

const doc = (kind: string, decision: Doc["decision"] = null, offset = 0): Doc => ({
  id: `doc_${kind.toLowerCase()}`,
  providerId: "provider_1",
  kind,
  decision,
  uploadedAt: new Date(uploadedAt.getTime() + offset),
});

function makeService(options: { docs?: Doc[]; verificationStatus?: string; premiumTier?: string } = {}) {
  const docs = options.docs ?? [];
  const calls = {
    docUpdates: [] as Array<{ where: { id: string }; data: Record<string, unknown> }>,
    providerUpdates: [] as Array<{ where: { id: string }; data: Record<string, unknown> }>,
    notifications: [] as Array<Record<string, any>>,
    logs: [] as Array<Record<string, any>>,
  };
  const providerRow = {
    id: "provider_1",
    userId: "provider_user",
    hidden: false,
    premiumTier: options.premiumTier ?? "BOOSTED",
    premiumUntil: new Date("2026-12-31T00:00:00.000Z"),
    verificationStatus: options.verificationStatus ?? "UNDER_REVIEW",
  };
  const tx = {
    provider: {
      findUnique: async () => providerRow,
      update: async (args: { where: { id: string }; data: Record<string, unknown> }) => {
        calls.providerUpdates.push(args);
        return {
          ...providerRow,
          ...args.data,
          displayName: "Plomberie Paul",
          profilePhoto: null,
          phone: "+243810000001",
          isAvailable: true,
          ratingAvg: { toString: () => "4.5", valueOf: () => 4.5 },
          ratingCount: 2,
          completedJobs: 3,
          publishedAt: uploadedAt,
          subcategory: { name: "Dépannage" },
          place: { label: "Gombe" },
          user: { id: "provider_user", firstName: "Paul", lastName: "K", isActive: true },
        };
      },
    },
    verificationDoc: {
      findMany: async () => docs,
      update: async (args: { where: { id: string }; data: Record<string, unknown> }) => {
        calls.docUpdates.push(args);
        return {};
      },
    },
  };
  const prisma = { $transaction: async <T>(callback: (client: typeof tx) => Promise<T>) => callback(tx) };
  const notifications = {
    create: async (params: Record<string, unknown>) => {
      calls.notifications.push(params);
      return params;
    },
  };
  const activity = {
    log: async (entry: Record<string, unknown>) => {
      calls.logs.push(entry);
    },
  };
  return {
    service: new AdminProvidersService(prisma as never, notifications as never, activity as never),
    calls,
  };
}

test("VERIFIED override is refused while required documents are missing", async () => {
  const { service, calls } = makeService({ docs: [doc("ID_FRONT"), doc("ID_BACK")] });

  await assert.rejects(
    () => service.update(admin, "provider_1", { verificationStatus: "VERIFIED" }),
    (error: unknown) => {
      assert.ok(error instanceof HttpException);
      assert.equal(error.getStatus(), 400);
      const body = error.getResponse() as { code: string; missingKinds: string[] };
      assert.equal(body.code, "DOCS_MISSING");
      assert.deepEqual(body.missingKinds, ["SELFIE", "ADDRESS"]);
      return true;
    },
  );
  assert.equal(calls.providerUpdates.length, 0);
  assert.equal(calls.notifications.length, 0);
});

test("VERIFIED override approves every undecided document and notifies the owner", async () => {
  const { service, calls } = makeService({
    docs: [doc("ID_FRONT", "APPROVED"), doc("ID_BACK"), doc("SELFIE", "REJECTED"), doc("ADDRESS")],
  });

  const result = await service.update(admin, "provider_1", { verificationStatus: "VERIFIED" }, "10.0.0.9");

  assert.deepEqual(
    calls.docUpdates.map((update) => [update.where.id, update.data.decision, update.data.reviewedById]),
    [
      ["doc_id_back", "APPROVED", "admin_1"],
      ["doc_selfie", "APPROVED", "admin_1"],
      ["doc_address", "APPROVED", "admin_1"],
    ],
  );
  assert.equal(calls.providerUpdates[0]!.data.verificationStatus, "VERIFIED");
  assert.equal(calls.notifications.length, 1);
  assert.equal(calls.notifications[0]!.type, "VERIFICATION_UPDATED");
  assert.equal(calls.notifications[0]!.userId, "provider_user");
  assert.equal(calls.logs[0]!.action, "provider.update");
  assert.equal(calls.logs[0]!.ipAddress, "10.0.0.9");
  assert.equal(result.verificationStatus, "VERIFIED");
  assert.equal(result.ratingAvg, 4.5);
  assert.equal(result.owner.name, "Paul K");
});

test("REJECTED override rejects the first undecided document with the reason", async () => {
  const { service, calls } = makeService({
    verificationStatus: "UNDER_REVIEW",
    docs: [doc("ID_FRONT", "APPROVED"), doc("ID_BACK", null, 1000), doc("SELFIE", null, 2000)],
  });

  await service.update(admin, "provider_1", {
    verificationStatus: "REJECTED",
    rejectionReason: "Pièce illisible",
  });

  assert.equal(calls.docUpdates.length, 1);
  assert.equal(calls.docUpdates[0]!.where.id, "doc_id_back");
  assert.equal(calls.docUpdates[0]!.data.decision, "REJECTED");
  assert.equal(calls.docUpdates[0]!.data.rejectionReason, "Pièce illisible");
  assert.match(calls.notifications[0]!.message, /Pièce illisible/);
});

test("an unchanged status does not notify, and dropping to FREE clears premiumUntil", async () => {
  const { service, calls } = makeService({ verificationStatus: "PENDING" });

  const result = await service.update(admin, "provider_1", {
    verificationStatus: "PENDING",
    premiumTier: "FREE",
    hidden: true,
  });

  assert.deepEqual(calls.providerUpdates[0]!.data, {
    hidden: true,
    premiumTier: "FREE",
    premiumUntil: null,
    verificationStatus: "PENDING",
  });
  assert.equal(calls.notifications.length, 0);
  assert.equal(result.premiumUntil, null);
  assert.deepEqual(calls.logs[0]!.metadata.hidden, { from: false, to: true });
});

test("a missing provider is a 404", async () => {
  const tx = { provider: { findUnique: async () => null } };
  const service = new AdminProvidersService(
    { $transaction: async <T>(callback: (client: typeof tx) => Promise<T>) => callback(tx) } as never,
    {} as never,
    {} as never,
  );
  await assert.rejects(
    () => service.update(admin, "nope", { hidden: true }),
    (error: unknown) => error instanceof HttpException && error.getStatus() === 404,
  );
});
