import assert from "node:assert/strict";
import test from "node:test";
import { RecentAddressesService } from "./recent-addresses.service";

function fake(rows: Array<{ address: string | null; commune: string | null; createdAt: Date }>) {
  return {
    booking: {
      findMany: async () => rows.map((r, i) => ({ id: `b_${i}`, ...r })),
    },
  } as unknown as ConstructorParameters<typeof RecentAddressesService>[0];
}

test("returns latest unique addresses, parsed", async () => {
  const prisma = fake([
    { address: "Av. de la Justice n° 42, Gombe, Kinshasa", commune: "Gombe", createdAt: new Date("2026-05-12") },
    { address: "Bd Lumumba 12, Limete, Kinshasa", commune: "Limete", createdAt: new Date("2026-05-11") },
    { address: "Av. de la Justice n° 42, Gombe, Kinshasa", commune: "Gombe", createdAt: new Date("2026-05-10") },
  ]);
  const service = new RecentAddressesService(prisma);
  const out = await service.findForClient("client_1", 3);

  assert.equal(out.length, 2);
  assert.equal(out[0].commune, "Gombe");
  assert.equal(out[0].street, "Av. de la Justice n° 42");
  assert.equal(out[0].lastUsedAt, new Date("2026-05-12").toISOString());
  assert.equal(out[1].commune, "Limete");
  assert.equal(out[1].street, "Bd Lumumba 12");
});

test("respects the limit", async () => {
  const prisma = fake([
    { address: "D, Masina, Kinshasa", commune: "Masina", createdAt: new Date("2026-05-13") },
    { address: "C, Lemba, Kinshasa", commune: "Lemba", createdAt: new Date("2026-05-12") },
    { address: "B, Limete, Kinshasa", commune: "Limete", createdAt: new Date("2026-05-11") },
    { address: "A, Gombe, Kinshasa", commune: "Gombe", createdAt: new Date("2026-05-10") },
  ]);
  const service = new RecentAddressesService(prisma);
  const out = await service.findForClient("client_1", 2);
  assert.equal(out.length, 2);
});

test("falls back to raw when commune column is null and address is unparseable", async () => {
  const prisma = fake([
    { address: "near the big mango tree", commune: null, createdAt: new Date("2026-05-10") },
  ]);
  const service = new RecentAddressesService(prisma);
  const out = await service.findForClient("client_1", 3);
  assert.equal(out[0].street, null);
  assert.equal(out[0].commune, null);
  assert.equal(out[0].raw, "near the big mango tree");
});
