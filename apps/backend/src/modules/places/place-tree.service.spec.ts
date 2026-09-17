import assert from "node:assert/strict";
import test from "node:test";
import { HttpException } from "@nestjs/common";
import { PlaceTreeService } from "./place-tree.service";

type Row = {
  id: string;
  kind: string;
  label: string;
  parentId: string | null;
  active: boolean;
  mergedIntoId: string | null;
};

function fakePrisma(rows: Row[]) {
  return {
    place: {
      findMany: async ({ where }: { where: { id?: { in: string[] }; parentId?: { in: string[] } } }) => {
        if (where.id) {
          return rows
            .filter((row) => where.id!.in.includes(row.id))
            .map((row) => ({
              ...row,
              _count: { children: rows.filter((child) => child.parentId === row.id && child.active).length },
            }));
        }
        return rows.filter((row) => row.parentId && where.parentId!.in.includes(row.parentId));
      },
    },
  };
}

const place = (id: string, kind: string, parentId: string | null, extra: Partial<Row> = {}): Row => ({
  id,
  kind,
  label: id,
  parentId,
  active: true,
  mergedIntoId: null,
  ...extra,
});

const tree = [
  place("cd", "COUNTRY", null),
  place("kin_prov", "PROVINCE", "cd"),
  place("kin", "CITY", "kin_prov"),
  place("gombe", "COMMUNE", "kin"),
  place("gare", "QUARTIER", "gombe"),
  place("limete", "COMMUNE", "kin", { active: false }),
  place("old", "COMMUNE", "kin", { mergedIntoId: "gombe" }),
];

test("chain returns root-first summaries with hasChildren", async () => {
  const service = new PlaceTreeService(fakePrisma(tree) as never);
  const chain = await service.chain("gare");
  assert.deepEqual(
    chain.map((item) => item.id),
    ["cd", "kin_prov", "kin", "gombe", "gare"],
  );
  assert.equal(chain[3]!.hasChildren, true);
  assert.equal(chain[4]!.hasChildren, false);
});

test("assertSelectable rejects inactive, merged and unknown places", async () => {
  const service = new PlaceTreeService(fakePrisma(tree) as never);
  assert.equal((await service.assertSelectable("gombe")).length, 4);
  for (const id of ["limete", "old", "missing"]) {
    await assert.rejects(
      () => service.assertSelectable(id),
      (error: unknown) => error instanceof HttpException && error.getStatus() === 400,
    );
  }
});

test("assertSelectable rejects a place under an inactive ancestor", async () => {
  const rows = tree.map((row) => (row.id === "kin" ? { ...row, active: false } : row));
  const service = new PlaceTreeService(fakePrisma(rows) as never);
  await assert.rejects(() => service.assertSelectable("gare"));
});

test("descendantIds walks every level including the place itself", async () => {
  const service = new PlaceTreeService(fakePrisma(tree) as never);
  const ids = await service.descendantIds("kin");
  assert.deepEqual(new Set(ids), new Set(["kin", "gombe", "gare", "limete", "old"]));
});
