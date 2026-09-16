import assert from "node:assert/strict";
import test from "node:test";
import { HttpException } from "@nestjs/common";
import { PlacesService } from "./places.service";

const actor = { id: "user_1", role: "CLIENT", isActive: true } as never;

function hasCode(status: number, code: string) {
  return (error: unknown) => {
    assert.ok(error instanceof HttpException, String(error));
    assert.equal(error.getStatus(), status);
    assert.equal((error.getResponse() as { code: string }).code, code);
    return true;
  };
}

function makeService(options: {
  parentKind?: string;
  siblings?: Array<{ label: string; aliases: string[] }>;
  pending?: Array<{ label: string }>;
  pendingCount?: number;
  chain?: unknown[];
  assertSelectable?: () => Promise<unknown>;
} = {}) {
  const calls: Record<string, unknown[]> = { count: [], findMany: [], create: [] };
  const prisma = {
    place: {
      count: async (args: unknown) => {
        calls.count.push(args);
        return 2;
      },
      findMany: async (args: { select: { _count?: unknown } }) => {
        calls.findMany.push(args);
        if (args.select._count) {
          return [
            { id: "gombe", kind: "COMMUNE", label: "Gombe", parentId: "kin", _count: { children: 3 } },
            { id: "limete", kind: "COMMUNE", label: "Limete", parentId: "kin", _count: { children: 0 } },
          ];
        }
        return options.siblings ?? [];
      },
    },
    placeSuggestion: {
      findMany: async () => options.pending ?? [],
      count: async () => options.pendingCount ?? 0,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        calls.create.push(data);
        return {
          id: "sugg_1",
          ...data,
          status: "PENDING",
          resolvedPlaceId: null,
          createdAt: new Date("2026-09-16T10:00:00Z"),
          resolvedAt: null,
        };
      },
    },
  };
  const tree = {
    chain: async () => options.chain ?? [],
    assertSelectable:
      options.assertSelectable ??
      (async () => [
        { id: "cd", kind: "COUNTRY" },
        { id: "parent", kind: options.parentKind ?? "COMMUNE" },
      ]),
  };
  return { service: new PlacesService(prisma as never, tree as never), calls };
}

test("list filters active non-merged places by kind, parent and label or alias", async () => {
  const { service, calls } = makeService();
  const page = await service.list({ page: 2, limit: 10, kind: "COMMUNE", parentId: "kin", q: "gom" });

  assert.deepEqual(calls.count[0], {
    where: {
      active: true,
      mergedIntoId: null,
      kind: "COMMUNE",
      parentId: "kin",
      OR: [{ label: { contains: "gom", mode: "insensitive" } }, { aliases: { has: "gom" } }],
    },
  });
  const findArgs = calls.findMany[0] as { skip: number; take: number; orderBy: unknown };
  assert.equal(findArgs.skip, 10);
  assert.equal(findArgs.take, 10);
  assert.deepEqual(findArgs.orderBy, [{ label: "asc" }, { id: "asc" }]);
  assert.deepEqual(page, {
    items: [
      { id: "gombe", kind: "COMMUNE", label: "Gombe", parentId: "kin", hasChildren: true },
      { id: "limete", kind: "COMMUNE", label: "Limete", parentId: "kin", hasChildren: false },
    ],
    total: 2,
    page: 2,
    limit: 10,
  });
});

test("list by ids ignores the other filters", async () => {
  const { service, calls } = makeService();
  await service.list({ page: 1, limit: 100, ids: ["a", "b"], kind: "CITY", q: "x" });
  assert.deepEqual(calls.count[0], { where: { id: { in: ["a", "b"] }, active: true, mergedIntoId: null } });
});

test("ancestors returns the chain and 404s on an unknown place", async () => {
  const chain = [{ id: "cd" }, { id: "kin" }];
  assert.deepEqual(await makeService({ chain }).service.ancestors("kin"), { items: chain });
  await assert.rejects(() => makeService().service.ancestors("missing"), hasCode(404, "NOT_FOUND"));
});

test("suggest creates a pending suggestion under an allowed parent", async () => {
  const { service, calls } = makeService({ parentKind: "COMMUNE" });
  const suggestion = await service.suggest(actor, { kind: "QUARTIER", label: "Golf", parentId: "parent" });

  assert.equal(suggestion.status, "PENDING");
  assert.deepEqual(calls.create[0], { userId: "user_1", kind: "QUARTIER", label: "Golf", parentId: "parent" });
});

test("suggest refuses a parent of the wrong kind or an unusable parent", async () => {
  await assert.rejects(
    () => makeService({ parentKind: "COUNTRY" }).service.suggest(actor, { kind: "QUARTIER", label: "X", parentId: "parent" }),
    hasCode(400, "INVALID_REFERENCE"),
  );
  const { service } = makeService({
    assertSelectable: async () => {
      throw new HttpException({ code: "INVALID_REFERENCE" }, 400);
    },
  });
  await assert.rejects(
    () => service.suggest(actor, { kind: "QUARTIER", label: "X", parentId: "parent" }),
    hasCode(400, "INVALID_REFERENCE"),
  );
});

test("suggest refuses duplicates of existing places or pending suggestions, accent-insensitively", async () => {
  await assert.rejects(
    () =>
      makeService({ siblings: [{ label: "Révolution", aliases: [] }] }).service.suggest(actor, {
        kind: "QUARTIER",
        label: "revolution",
        parentId: "parent",
      }),
    hasCode(409, "ALREADY_EXISTS"),
  );
  await assert.rejects(
    () =>
      makeService({ siblings: [{ label: "Commerce", aliases: ["Kin-Commerce"] }] }).service.suggest(actor, {
        kind: "QUARTIER",
        label: "kin commerce",
        parentId: "parent",
      }),
    hasCode(409, "ALREADY_EXISTS"),
  );
  await assert.rejects(
    () =>
      makeService({ pending: [{ label: "Golf" }] }).service.suggest(actor, {
        kind: "QUARTIER",
        label: "GOLF",
        parentId: "parent",
      }),
    hasCode(409, "ALREADY_EXISTS"),
  );
});

test("suggest caps pending suggestions per user at ten", async () => {
  await assert.rejects(
    () =>
      makeService({ pendingCount: 10 }).service.suggest(actor, {
        kind: "QUARTIER",
        label: "Golf",
        parentId: "parent",
      }),
    hasCode(409, "LIMIT_REACHED"),
  );
  await makeService({ pendingCount: 9 }).service.suggest(actor, {
    kind: "QUARTIER",
    label: "Golf",
    parentId: "parent",
  });
});
