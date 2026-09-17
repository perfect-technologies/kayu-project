import assert from "node:assert/strict";
import test from "node:test";
import { HttpException } from "@nestjs/common";
import { AdminPlacesService } from "./admin-places.service";

const admin = { id: "admin_1", role: "ADMIN", isActive: true } as never;

type Row = Record<string, any>;

function hasCode(status: number, code: string) {
  return (error: unknown) => {
    assert.ok(error instanceof HttpException, String(error));
    assert.equal(error.getStatus(), status);
    assert.equal((error.getResponse() as { code: string }).code, code);
    return true;
  };
}

function matches(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([key, condition]) => {
    if (key === "NOT") return !matches(row, condition);
    if (condition !== null && typeof condition === "object") {
      if ("startsWith" in condition) return String(row[key]).startsWith(condition.startsWith);
      if ("in" in condition) return condition.in.includes(row[key]);
    }
    return (row[key] ?? null) === condition;
  });
}

function place(id: string, kind: string, parentId: string | null, extra: Row = {}): Row {
  return {
    id,
    kind,
    label: id,
    slug: id,
    parentId,
    aliases: [],
    source: null,
    latitude: null,
    longitude: null,
    active: true,
    mergedIntoId: null,
    createdAt: new Date("2026-09-01T00:00:00Z"),
    updatedAt: new Date("2026-09-01T00:00:00Z"),
    ...extra,
  };
}

function makeHarness(places: Row[], suggestions: Row[] = []) {
  const logs: Row[] = [];
  const notifications: Row[] = [];
  const repointed: Record<string, Row[]> = { user: [], provider: [], address: [], booking: [] };
  let nextId = 1;

  const withCount = (row: Row) => ({
    ...row,
    _count: { children: places.filter((child) => child.parentId === row.id).length },
  });

  const tx: Row = {
    place: {
      findUnique: async ({ where }: Row) => {
        const row = places.find((item) => item.id === where.id);
        return row ? withCount(row) : null;
      },
      findUniqueOrThrow: async ({ where }: Row) => withCount(places.find((item) => item.id === where.id)!),
      findMany: async ({ where }: Row) => places.filter((row) => matches(row, where)).map(withCount),
      count: async ({ where }: Row) => places.filter((row) => matches(row, where)).length,
      create: async ({ data }: Row) => {
        const row = place(`place_new_${nextId++}`, data.kind, data.parentId, data);
        places.push(row);
        return withCount(row);
      },
      update: async ({ where, data }: Row) => {
        const row = places.find((item) => item.id === where.id)!;
        for (const [key, value] of Object.entries(data)) if (value !== undefined) row[key] = value;
        return withCount(row);
      },
      updateMany: async ({ where, data }: Row) => {
        const rows = places.filter((row) => matches(row, where));
        rows.forEach((row) => Object.assign(row, data));
        return { count: rows.length };
      },
    },
    placeSuggestion: {
      findUnique: async ({ where }: Row) => suggestions.find((row) => row.id === where.id) ?? null,
      update: async ({ where, data }: Row) => Object.assign(suggestions.find((row) => row.id === where.id)!, data),
      updateMany: async ({ where, data }: Row) => {
        const rows = suggestions.filter((row) => matches(row, where));
        rows.forEach((row) => Object.assign(row, data));
        return { count: rows.length };
      },
    },
  };
  for (const model of Object.keys(repointed)) {
    tx[model] = {
      updateMany: async (args: Row) => {
        repointed[model]!.push(args);
        return { count: 1 };
      },
    };
  }

  const prisma = { ...tx, $transaction: async (run: (client: Row) => unknown) => run(tx) };
  const activity = { log: async (entry: Row) => logs.push(entry) };
  const notificationsService = { create: async (params: Row) => notifications.push(params) };
  const service = new AdminPlacesService(prisma as never, {} as never, activity as never, notificationsService as never);
  return { service, places, suggestions, logs, notifications, repointed };
}

const kinshasaTree = () => [
  place("cd", "COUNTRY", null, { slug: "cd" }),
  place("kin_prov", "PROVINCE", "cd", { slug: "cd-province-kinshasa" }),
  place("kin", "CITY", "kin_prov", { slug: "cd-province-kinshasa-city-kinshasa", label: "Kinshasa" }),
  place("gombe", "COMMUNE", "kin", { label: "Gombe" }),
];

test("create derives a path slug, suffixes collisions and journals the ip", async () => {
  const places = kinshasaTree();
  places.push(place("taken", "COMMUNE", "kin", { label: "Old", slug: "cd-province-kinshasa-city-kinshasa-commune-ngaliema" }));
  const { service, logs } = makeHarness(places);

  const created = await service.create(admin, { kind: "COMMUNE", label: "Ngaliema", parentId: "kin", aliases: [] }, "10.0.0.1");

  assert.equal(created.slug, "cd-province-kinshasa-city-kinshasa-commune-ngaliema-2");
  assert.equal(created.active, true);
  assert.equal(logs[0]!.action, "place.create");
  assert.equal(logs[0]!.ipAddress, "10.0.0.1");

  const country = await service.create(admin, { kind: "COUNTRY", label: "Gabon", aliases: [] });
  assert.equal(country.slug, "country-gabon");
});

test("create enforces parent kinds and refuses duplicate labels under the same parent", async () => {
  const { service } = makeHarness(kinshasaTree());
  await assert.rejects(
    () => service.create(admin, { kind: "QUARTIER", label: "Golf", parentId: "kin", aliases: [] }),
    hasCode(400, "INVALID_REFERENCE"),
  );
  await assert.rejects(
    () => service.create(admin, { kind: "PROVINCE", label: "Kongo", aliases: [] }),
    hasCode(400, "INVALID_REFERENCE"),
  );
  await assert.rejects(
    () => service.create(admin, { kind: "COMMUNE", label: "GOMBÉ", parentId: "kin", aliases: [] }),
    hasCode(409, "ALREADY_EXISTS"),
  );
});

test("update refuses to reactivate a merged place", async () => {
  const places = kinshasaTree();
  places.push(place("old", "COMMUNE", "kin", { active: false, mergedIntoId: "gombe" }));
  const { service } = makeHarness(places);
  await assert.rejects(() => service.update(admin, "old", { active: true }), hasCode(409, "INVALID_TRANSITION"));
  await assert.rejects(() => service.update(admin, "missing", { label: "X" }), hasCode(404, "NOT_FOUND"));
});

test("merge requires same kind and parent, an active target and a childless source", async () => {
  const places = kinshasaTree();
  places.push(place("bzv", "CITY", "cd"));
  places.push(place("limete", "COMMUNE", "kin", { label: "Limete" }));
  places.push(place("limete_q", "QUARTIER", "limete"));
  places.push(place("inactive", "COMMUNE", "kin", { active: false }));
  const { service } = makeHarness(places);

  await assert.rejects(() => service.merge(admin, { fromId: "gombe", intoId: "bzv" }), hasCode(409, "INVALID_TRANSITION"));
  await assert.rejects(() => service.merge(admin, { fromId: "gombe", intoId: "inactive" }), hasCode(409, "INVALID_TRANSITION"));
  await assert.rejects(
    () => service.merge(admin, { fromId: "limete", intoId: "gombe" }),
    (error: unknown) => {
      hasCode(409, "REFERENCED")(error);
      assert.deepEqual(((error as HttpException).getResponse() as { counts: unknown }).counts, { children: 1 });
      return true;
    },
  );
  await assert.rejects(() => service.merge(admin, { fromId: "nope", intoId: "gombe" }), hasCode(404, "NOT_FOUND"));
});

test("merge repoints every place reference and retires the source", async () => {
  const places = kinshasaTree();
  places.push(place("gombe_dup", "COMMUNE", "kin", { label: "La Gombe" }));
  places.push(place("older", "COMMUNE", "kin", { active: false, mergedIntoId: "gombe_dup" }));
  const suggestions = [
    { id: "s1", parentId: "gombe_dup", resolvedPlaceId: null, status: "PENDING" },
    { id: "s2", parentId: "kin", resolvedPlaceId: "gombe_dup", status: "APPROVED" },
  ];
  const { service, repointed, logs } = makeHarness(places, suggestions);

  const result = await service.merge(admin, { fromId: "gombe_dup", intoId: "gombe" }, "10.0.0.2");

  for (const model of ["user", "provider", "address", "booking"]) {
    assert.deepEqual(repointed[model], [{ where: { placeId: "gombe_dup" }, data: { placeId: "gombe" } }]);
  }
  assert.equal(suggestions[0]!.parentId, "gombe");
  assert.equal(suggestions[1]!.resolvedPlaceId, "gombe");
  assert.equal(places.find((row) => row.id === "older")!.mergedIntoId, "gombe");
  assert.equal(result.from.active, false);
  assert.equal(result.from.mergedIntoId, "gombe");
  assert.deepEqual(result.repointed, { users: 1, providers: 1, addresses: 1, bookings: 1, suggestions: 1 });
  assert.equal(logs[0]!.action, "place.merge");
});

test("approve creates the place, resolves the suggestion and notifies the author", async () => {
  const suggestions = [{ id: "s1", userId: "user_9", kind: "QUARTIER", label: "Golf", parentId: "gombe", status: "PENDING" }];
  const places = kinshasaTree();
  places[3]!.slug = "cd-province-kinshasa-city-kinshasa-commune-gombe";
  const { service, notifications, logs } = makeHarness(places, suggestions);

  const result = await service.approve(admin, "s1", "10.0.0.3");

  const created = places.find((row) => row.label === "Golf")!;
  assert.equal(created.slug, "cd-province-kinshasa-city-kinshasa-commune-gombe-quartier-golf");
  assert.equal(result.status, "APPROVED");
  assert.equal(result.resolvedPlaceId, created.id);
  assert.ok(result.resolvedAt);
  assert.equal(notifications[0]!.type, "PLACE_SUGGESTION_RESOLVED");
  assert.equal(notifications[0]!.userId, "user_9");
  assert.deepEqual(notifications[0]!.data, { suggestionId: "s1", placeId: created.id, status: "APPROVED" });
  assert.deepEqual(logs[0]!.metadata, { placeId: created.id, linkedExisting: false });
});

test("approve links an existing same-label place and reactivates it", async () => {
  const places = [...kinshasaTree(), place("golf", "QUARTIER", "gombe", { label: "Golf", active: false })];
  const suggestions = [{ id: "s1", userId: "user_9", kind: "QUARTIER", label: "golf", parentId: "gombe", status: "PENDING" }];
  const { service } = makeHarness(places, suggestions);

  const result = await service.approve(admin, "s1");

  assert.equal(result.resolvedPlaceId, "golf");
  assert.equal(places.filter((row) => row.kind === "QUARTIER").length, 1);
  assert.equal(places.find((row) => row.id === "golf")!.active, true);
});

test("reject resolves and notifies; a processed suggestion cannot be decided again", async () => {
  const suggestions = [{ id: "s1", userId: "user_9", kind: "QUARTIER", label: "Golf", parentId: "gombe", status: "PENDING" }];
  const { service, notifications } = makeHarness(kinshasaTree(), suggestions);

  const result = await service.reject(admin, "s1");
  assert.equal(result.status, "REJECTED");
  assert.equal((notifications[0]!.data as Row).status, "REJECTED");

  await assert.rejects(() => service.approve(admin, "s1"), hasCode(409, "INVALID_TRANSITION"));
  await assert.rejects(() => service.reject(admin, "missing"), hasCode(404, "NOT_FOUND"));
});
