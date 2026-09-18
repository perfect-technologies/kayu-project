import assert from "node:assert/strict";
import test from "node:test";
import type { Actor } from "../../common/auth/types";
import { resolveDefaultLocation, type LocationDeps } from "./agent.location";

const cd = { id: "cd", kind: "COUNTRY", label: "RDC", parentId: null, hasChildren: true } as const;
const kin = { id: "kin", kind: "CITY", label: "Kinshasa", parentId: "cd", hasChildren: true } as const;
const gombe = { id: "gombe", kind: "COMMUNE", label: "Gombe", parentId: "kin", hasChildren: true } as const;
const limete = { id: "limete", kind: "COMMUNE", label: "Limete", parentId: "kin", hasChildren: true } as const;

function actor(placeId: string | null): Actor {
  return { id: "user_1", role: "CLIENT", placeId, isActive: true } as Actor;
}

function address(overrides: Record<string, unknown>) {
  return { id: "a1", label: "HOME", isDefault: false, placeId: null, placeChain: [], addressLine: "x", ...overrides };
}

function makeDeps(addresses: unknown[], chain: unknown[] = []) {
  const calls: Record<string, unknown[]> = { list: [], chain: [] };
  const deps: LocationDeps = {
    addresses: {
      list: async (who, query) => {
        calls.list.push([who.id, query]);
        return { items: addresses, total: addresses.length, page: 1, limit: 50 } as never;
      },
    },
    placeTree: {
      chain: async (placeId) => {
        calls.chain.push(placeId);
        return chain as never;
      },
    },
  };
  return { deps, calls };
}

test("the default address's place chain wins, with its label", async () => {
  const { deps, calls } = makeDeps(
    [address({ id: "a2", label: "WORK", placeId: "limete", placeChain: [cd, kin, limete] }), address({ id: "a1", label: "Maison", isDefault: true, placeId: "gombe", placeChain: [cd, kin, gombe] })],
    [cd, kin, limete],
  );
  const location = await resolveDefaultLocation(actor("limete"), deps);
  assert.deepEqual(location, {
    source: "address",
    chain: [
      { id: "cd", kind: "COUNTRY", label: "RDC" },
      { id: "kin", kind: "CITY", label: "Kinshasa" },
      { id: "gombe", kind: "COMMUNE", label: "Gombe" },
    ],
    addressLabel: "Maison",
    addressId: "a1",
  });
  assert.deepEqual(calls.list[0], ["user_1", { page: 1, limit: 50 }]);
  assert.equal(calls.chain.length, 0);
});

test("without a default address carrying a place, User.placeId's chain is used", async () => {
  const { deps, calls } = makeDeps([address({ isDefault: true, placeId: null, placeChain: [] })], [cd, kin, limete]);
  const location = await resolveDefaultLocation(actor("limete"), deps);
  assert.equal(location?.source, "user");
  assert.deepEqual(location?.chain.map((place) => place.label), ["RDC", "Kinshasa", "Limete"]);
  assert.equal(location?.addressLabel, null);
  assert.equal(location?.addressId, null);
  assert.deepEqual(calls.chain, ["limete"]);
});

test("nothing known when there is no address and no user place, or the place chain is empty", async () => {
  assert.equal(await resolveDefaultLocation(actor(null), makeDeps([]).deps), null);
  assert.equal(await resolveDefaultLocation(actor("ghost"), makeDeps([], []).deps), null);
});
