import assert from "node:assert/strict";
import test from "node:test";
import { HttpException } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import { AddressesService } from "./addresses.service";

type Row = {
  id: string;
  userId: string;
  label: string;
  recipient: string | null;
  addressLine: string;
  placeId: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function setup(seed: Array<Partial<Row>> = [], options: { invalidPlace?: boolean } = {}) {
  let clock = 0;
  const rows: Row[] = seed.map((row, index) => ({
    id: `addr_${index + 1}`,
    userId: "user_1",
    label: "HOME",
    recipient: null,
    addressLine: `Rue ${index + 1}`,
    placeId: null,
    country: "RDC",
    latitude: null,
    longitude: null,
    isDefault: false,
    createdAt: new Date(Date.UTC(2026, 0, index + 1)),
    updatedAt: new Date(Date.UTC(2026, 0, index + 1)),
    ...row,
  }));
  const client = {
    address: {
      count: async ({ where }: { where: { userId: string } }) => rows.filter((row) => row.userId === where.userId).length,
      findMany: async ({ where }: { where: { userId: string } }) =>
        rows
          .filter((row) => row.userId === where.userId)
          .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || b.createdAt.getTime() - a.createdAt.getTime()),
      findFirst: async ({ where }: { where: { id?: string; userId: string } }) =>
        rows
          .filter((row) => row.userId === where.userId && (!where.id || row.id === where.id))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null,
      create: async ({ data }: { data: Omit<Row, "id" | "createdAt" | "updatedAt"> }) => {
        clock += 1;
        const row = { id: `addr_new_${clock}`, createdAt: new Date(Date.UTC(2026, 5, clock)), updatedAt: new Date(), ...data } as Row;
        rows.push(row);
        return row;
      },
      update: async ({ where, data }: { where: { id: string }; data: Partial<Row> }) => {
        const row = rows.find((item) => item.id === where.id)!;
        Object.assign(row, data);
        return row;
      },
      updateMany: async ({ where, data }: { where: { userId: string; isDefault: boolean }; data: Partial<Row> }) => {
        const matched = rows.filter((row) => row.userId === where.userId && row.isDefault === where.isDefault);
        matched.forEach((row) => Object.assign(row, data));
        return { count: matched.length };
      },
      delete: async ({ where }: { where: { id: string } }) => {
        rows.splice(rows.findIndex((row) => row.id === where.id), 1);
      },
    },
  };
  const prisma = { ...client, $transaction: async (cb: (tx: typeof client) => Promise<unknown>) => cb(client) };
  const chain = [
    { id: "cg", kind: "COUNTRY", label: "Congo", parentId: null, hasChildren: true },
    { id: "bzv", kind: "CITY", label: "Brazzaville", parentId: "cg", hasChildren: false },
  ];
  const places = {
    assertSelectable: async () => {
      if (options.invalidPlace) throw new HttpException({ code: "INVALID_REFERENCE" }, 400);
      return chain;
    },
    chain: async (id: string | null) => (id ? chain : []),
    chains: async (ids: Array<string | null>) => new Map(ids.filter(Boolean).map((id) => [id as string, chain])),
  };
  return { service: new AddressesService(prisma as never, places as never), rows };
}

const actor = { id: "user_1", role: "CLIENT", isActive: true } as Actor;
const status = (code: number, apiCode?: string) => (error: unknown) =>
  error instanceof HttpException &&
  error.getStatus() === code &&
  (!apiCode || (error.getResponse() as { code?: string }).code === apiCode);

test("the first address becomes the default and inherits its country from the place chain", async () => {
  const { service } = setup();
  const created = await service.create(actor, { label: "HOME", addressLine: "Av. de la Paix 3", placeId: "bzv" });
  assert.equal(created.isDefault, true);
  assert.equal(created.country, "Congo");
  assert.equal(created.placeChain.length, 2);
});

test("a new default demotes the previous one; a non-default addition keeps it", async () => {
  const { service, rows } = setup([{ isDefault: true }]);
  await service.create(actor, { label: "WORK", addressLine: "Bureau" });
  assert.equal(rows.filter((row) => row.isDefault).length, 1);
  assert.equal(rows.find((row) => row.isDefault)!.id, "addr_1");

  const promoted = await service.create(actor, { label: "OTHER", addressLine: "Maman", isDefault: true });
  assert.deepEqual(rows.filter((row) => row.isDefault).map((row) => row.id), [promoted.id]);
  assert.equal(promoted.country, "RDC");
});

test("patching isDefault demotes siblings; invalid places are refused before writing", async () => {
  const { service, rows } = setup([{ isDefault: true }, {}]);
  const updated = await service.update(actor, "addr_2", { isDefault: true, recipient: "Paul" });
  assert.equal(updated.isDefault, true);
  assert.equal(updated.recipient, "Paul");
  assert.equal(rows.find((row) => row.id === "addr_1")!.isDefault, false);

  const invalid = setup([{}], { invalidPlace: true });
  await assert.rejects(() => invalid.service.update(actor, "addr_1", { placeId: "inactive" }), status(400));
  await assert.rejects(() => invalid.service.create(actor, { label: "HOME", addressLine: "x", placeId: "inactive" }), status(400));
  assert.equal(invalid.rows.length, 1);
});

test("deleting the default promotes the newest remaining address", async () => {
  const { service, rows } = setup([{ isDefault: true }, {}, {}]);
  assert.deepEqual(await service.remove(actor, "addr_1"), { ok: true });
  assert.deepEqual(rows.map((row) => [row.id, row.isDefault]), [
    ["addr_2", false],
    ["addr_3", true],
  ]);
  await service.remove(actor, "addr_2");
  assert.equal(rows.find((row) => row.id === "addr_3")!.isDefault, true);
});

test("foreign or unknown ids are 404 and the address book is capped at 20", async () => {
  const foreign = setup([{ userId: "someone_else" }]);
  await assert.rejects(() => foreign.service.update(actor, "addr_1", { recipient: "x" }), status(404));
  await assert.rejects(() => foreign.service.remove(actor, "addr_1"), status(404));

  const full = setup(Array.from({ length: 20 }, () => ({})));
  await assert.rejects(() => full.service.create(actor, { label: "HOME", addressLine: "x" }), status(409, "LIMIT_REACHED"));
});

test("list puts the default first with place chains", async () => {
  const { service } = setup([{ placeId: "bzv" }, { isDefault: true }]);
  const page = await service.list(actor, { page: 1, limit: 50 });
  assert.equal(page.total, 2);
  assert.equal(page.items[0]!.id, "addr_2");
  assert.equal(page.items[1]!.placeChain.length, 2);
});
