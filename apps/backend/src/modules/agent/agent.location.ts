import type { PlaceKind } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import type { AddressesService } from "../addresses/addresses.service";
import type { PlaceTreeService } from "../places/place-tree.service";

export type ClientLocationNode = { id: string; kind: PlaceKind; label: string };

export type ClientLocation = {
  source: "address" | "user";
  chain: ClientLocationNode[];
  addressLabel: string | null;
  addressId: string | null;
};

export type LocationDeps = {
  addresses: Pick<AddressesService, "list">;
  placeTree: Pick<PlaceTreeService, "chain">;
};

const ADDRESS_PAGE = { page: 1, limit: 50 } as const;

const toNode = (place: ClientLocationNode): ClientLocationNode => ({ id: place.id, kind: place.kind, label: place.label });

// RFC §4.3: default address chain, else User.placeId chain, else nothing known. Read-only.
export async function resolveDefaultLocation(actor: Actor, deps: LocationDeps): Promise<ClientLocation | null> {
  const { items } = await deps.addresses.list(actor, ADDRESS_PAGE);
  const preferred = items.find((address) => address.isDefault && address.placeChain.length > 0);
  if (preferred) {
    return { source: "address", chain: preferred.placeChain.map(toNode), addressLabel: preferred.label, addressId: preferred.id };
  }

  if (actor.placeId) {
    const chain = await deps.placeTree.chain(actor.placeId);
    if (chain.length > 0) return { source: "user", chain: chain.map(toNode), addressLabel: null, addressId: null };
  }

  return null;
}
