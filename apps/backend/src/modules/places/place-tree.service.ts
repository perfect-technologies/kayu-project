import { HttpStatus, Injectable } from "@nestjs/common";
import type { Place, PlaceKind, Prisma } from "@prisma/client";
import { apiError } from "../../common/http/errors";
import { PrismaService } from "../../database/prisma.service";

export type PlaceSummary = {
  id: string;
  kind: PlaceKind;
  label: string;
  parentId: string | null;
  hasChildren: boolean;
};

type PlaceClient = Pick<Prisma.TransactionClient, "place">;

type PlaceRow = Pick<Place, "id" | "kind" | "label" | "parentId" | "active" | "mergedIntoId"> & {
  _count?: { children: number };
};

const MAX_DEPTH = 12;

export const PLACE_PARENT_KINDS: Record<PlaceKind, PlaceKind[]> = {
  COUNTRY: [],
  PROVINCE: ["COUNTRY"],
  CITY: ["PROVINCE", "COUNTRY"],
  TERRITORY: ["PROVINCE"],
  COMMUNE: ["CITY", "TERRITORY"],
  SECTOR: ["TERRITORY"],
  CHIEFDOM: ["TERRITORY"],
  QUARTIER: ["COMMUNE"],
  VILLAGE: ["SECTOR", "CHIEFDOM"],
};

const placeSelect = {
  id: true,
  kind: true,
  label: true,
  parentId: true,
  active: true,
  mergedIntoId: true,
  _count: { select: { children: { where: { active: true } } } },
} satisfies Prisma.PlaceSelect;

export function toPlaceSummary(place: PlaceRow): PlaceSummary {
  return {
    id: place.id,
    kind: place.kind,
    label: place.label,
    parentId: place.parentId,
    hasChildren: (place._count?.children ?? 0) > 0,
  };
}

@Injectable()
export class PlaceTreeService {
  constructor(private readonly prisma: PrismaService) {}

  async assertSelectable(placeId: string, client: PlaceClient = this.prisma): Promise<PlaceSummary[]> {
    const rows = await this.loadWithAncestors([placeId], client);
    const chain = this.chainFrom(placeId, rows);
    const usable =
      chain.length > 0 &&
      chain.every((row) => row.active && !row.mergedIntoId) &&
      chain[0]!.parentId === null;
    if (!usable) {
      throw apiError(HttpStatus.BAD_REQUEST, "INVALID_REFERENCE", "Choisissez un lieu valide.");
    }
    return chain.map(toPlaceSummary);
  }

  async chain(placeId: string | null | undefined, client: PlaceClient = this.prisma): Promise<PlaceSummary[]> {
    if (!placeId) return [];
    return (await this.chains([placeId], client)).get(placeId) ?? [];
  }

  async chains(
    placeIds: Array<string | null | undefined>,
    client: PlaceClient = this.prisma,
  ): Promise<Map<string, PlaceSummary[]>> {
    const ids = [...new Set(placeIds.filter((id): id is string => Boolean(id)))];
    const result = new Map<string, PlaceSummary[]>();
    if (ids.length === 0) return result;
    const rows = await this.loadWithAncestors(ids, client);
    for (const id of ids) {
      result.set(id, this.chainFrom(id, rows).map(toPlaceSummary));
    }
    return result;
  }

  async descendantIds(placeId: string, client: PlaceClient = this.prisma): Promise<string[]> {
    const all = [placeId];
    let frontier = [placeId];
    for (let depth = 0; depth < MAX_DEPTH && frontier.length > 0; depth += 1) {
      const children = await client.place.findMany({
        where: { parentId: { in: frontier } },
        select: { id: true },
      });
      frontier = children.map((child) => child.id).filter((id) => !all.includes(id));
      all.push(...frontier);
    }
    return all;
  }

  private async loadWithAncestors(ids: string[], client: PlaceClient): Promise<Map<string, PlaceRow>> {
    const rows = new Map<string, PlaceRow>();
    let pending = ids;
    for (let depth = 0; depth < MAX_DEPTH && pending.length > 0; depth += 1) {
      const found = (await client.place.findMany({
        where: { id: { in: pending } },
        select: placeSelect,
      })) as PlaceRow[];
      for (const row of found) rows.set(row.id, row);
      pending = [
        ...new Set(
          found
            .map((row) => row.parentId)
            .filter((parentId): parentId is string => Boolean(parentId) && !rows.has(parentId!)),
        ),
      ];
    }
    return rows;
  }

  private chainFrom(id: string, rows: Map<string, PlaceRow>): PlaceRow[] {
    const chain: PlaceRow[] = [];
    let current = rows.get(id);
    while (current && chain.length < MAX_DEPTH) {
      chain.unshift(current);
      current = current.parentId ? rows.get(current.parentId) : undefined;
    }
    return chain;
  }
}
