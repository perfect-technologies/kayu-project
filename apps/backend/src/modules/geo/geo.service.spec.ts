import assert from "node:assert/strict";
import test from "node:test";
import { HttpException } from "@nestjs/common";
import { GeoService } from "./geo.service";

type Place = { id: string; label: string; parentId: string | null; latitude: number | null; longitude: number | null };

function makeService(places: Place[], nominatim: Array<Record<string, string>> | "error" = []) {
  const requests: string[] = [];
  const prisma = {
    place: {
      findUnique: async ({ where }: { where: { id: string } }) => places.find((place) => place.id === where.id) ?? null,
    },
  };
  const service = new GeoService(prisma as never);
  service.fetcher = (async (url: string) => {
    requests.push(url);
    if (nominatim === "error") throw new Error("offline");
    return { ok: true, json: async () => nominatim } as Response;
  }) as typeof fetch;
  return { service, requests };
}

const tree: Place[] = [
  { id: "cd", label: "RDC", parentId: null, latitude: null, longitude: null },
  { id: "kin", label: "Kinshasa", parentId: "cd", latitude: -4.4419, longitude: 15.2663 },
  { id: "gombe", label: "Gombe", parentId: "kin", latitude: null, longitude: null },
];

function notFound(error: unknown) {
  assert.ok(error instanceof HttpException);
  assert.equal(error.getStatus(), 404);
  assert.equal((error.getResponse() as { code: string }).code, "NOT_FOUND");
  return true;
}

test("a place without coordinates uses its nearest located ancestor", async () => {
  const { service, requests } = makeService(tree);
  assert.deepEqual(await service.geocode({ placeId: "gombe" }), {
    lat: -4.4419,
    lng: 15.2663,
    label: "Gombe, Kinshasa, RDC",
    source: "place",
  });
  assert.equal(requests.length, 0);
});

test("a place chain without coordinates falls back to Nominatim restricted to CD and CG", async () => {
  const unlocated = tree.map((place) => ({ ...place, latitude: null, longitude: null }));
  const { service, requests } = makeService(unlocated, [
    { lat: "-4.30", lon: "15.28", display_name: "Gombe, Kinshasa, République démocratique du Congo" },
  ]);

  const result = await service.geocode({ placeId: "gombe" });

  assert.deepEqual(result, {
    lat: -4.3,
    lng: 15.28,
    label: "Gombe, Kinshasa, République démocratique du Congo",
    source: "nominatim",
  });
  const url = new URL(requests[0]!);
  assert.equal(url.searchParams.get("q"), "Gombe, Kinshasa, RDC");
  assert.equal(url.searchParams.get("countrycodes"), "cd,cg");
});

test("unknown places, empty or failing lookups are 404", async () => {
  await assert.rejects(() => makeService(tree).service.geocode({ placeId: "missing" }), notFound);
  await assert.rejects(() => makeService(tree, []).service.geocode({ q: "nulle part" }), notFound);
  await assert.rejects(() => makeService(tree, "error").service.geocode({ q: "Matadi" }), notFound);
});

test("distance keeps its haversine response", () => {
  const { service } = makeService(tree);
  const result = service.distance({ lat: -4.325, lng: 15.2833, providerLat: -4.35, providerLng: 15.35 });
  assert.equal(result.success, true);
  assert.equal((result as { status: string }).status, "medium");
  assert.equal((result as { distance: number }).distance, 7.9);
  assert.match(String(service.distance({ lat: 0, lng: 0 }).message), /providerLat/);
});
