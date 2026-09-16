import { HttpStatus, Injectable } from "@nestjs/common";
import type { PlaceKind, PlaceSuggestion, Prisma } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import type { CreatePlaceSuggestionInput, PlacesQuery } from "../../common/contract";
import { apiError, notFound } from "../../common/http/errors";
import { pageArgs, toPage } from "../../common/http/pagination";
import { normalizeLabel } from "../../common/util/people";
import { PrismaService } from "../../database/prisma.service";
import { PLACE_PARENT_KINDS, PlaceTreeService, toPlaceSummary } from "./place-tree.service";

export const MAX_PENDING_SUGGESTIONS = 10;

export const summarySelect = {
  id: true,
  kind: true,
  label: true,
  parentId: true,
  active: true,
  mergedIntoId: true,
  _count: { select: { children: { where: { active: true } } } },
} satisfies Prisma.PlaceSelect;

export function mapSuggestion(suggestion: PlaceSuggestion) {
  return {
    id: suggestion.id,
    kind: suggestion.kind,
    label: suggestion.label,
    parentId: suggestion.parentId,
    status: suggestion.status,
    resolvedPlaceId: suggestion.resolvedPlaceId,
    createdAt: suggestion.createdAt,
    resolvedAt: suggestion.resolvedAt,
  };
}

export function sameLabel(label: string, candidate: { label: string; aliases?: string[] }) {
  const target = normalizeLabel(label);
  return (
    normalizeLabel(candidate.label) === target ||
    (candidate.aliases ?? []).some((alias) => normalizeLabel(alias) === target)
  );
}

export function searchLabelWhere(q: string): Prisma.PlaceWhereInput {
  return { OR: [{ label: { contains: q, mode: "insensitive" } }, { aliases: { has: q } }] };
}

export function assertParentKind(kind: PlaceKind, parentKind: PlaceKind | null) {
  const allowed = PLACE_PARENT_KINDS[kind];
  const valid = parentKind === null ? allowed.length === 0 : allowed.includes(parentKind);
  if (!valid) {
    throw apiError(
      HttpStatus.BAD_REQUEST,
      "INVALID_REFERENCE",
      parentKind === null ? "Sélectionnez le lieu parent." : "Ce type de lieu ne peut pas dépendre de ce parent.",
    );
  }
}

@Injectable()
export class PlacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tree: PlaceTreeService,
  ) {}

  async list(query: PlacesQuery) {
    const where: Prisma.PlaceWhereInput = query.ids?.length
      ? { id: { in: query.ids }, active: true, mergedIntoId: null }
      : {
          active: true,
          mergedIntoId: null,
          ...(query.kind ? { kind: query.kind } : {}),
          ...(query.parentId ? { parentId: query.parentId } : {}),
          ...(query.q ? searchLabelWhere(query.q) : {}),
        };

    const [total, rows] = await Promise.all([
      this.prisma.place.count({ where }),
      this.prisma.place.findMany({
        where,
        select: summarySelect,
        orderBy: [{ label: "asc" }, { id: "asc" }],
        ...pageArgs(query),
      }),
    ]);

    return toPage(rows.map(toPlaceSummary), total, query);
  }

  async ancestors(id: string) {
    const items = await this.tree.chain(id);
    if (items.length === 0) throw notFound("Lieu introuvable");
    return { items };
  }

  async suggest(actor: Actor, input: CreatePlaceSuggestionInput) {
    const parentChain = await this.tree.assertSelectable(input.parentId);
    assertParentKind(input.kind, parentChain[parentChain.length - 1]!.kind);

    const [siblings, pendingSame, pendingCount] = await Promise.all([
      this.prisma.place.findMany({
        where: { parentId: input.parentId, kind: input.kind, mergedIntoId: null },
        select: { label: true, aliases: true },
      }),
      this.prisma.placeSuggestion.findMany({
        where: { parentId: input.parentId, kind: input.kind, status: "PENDING" },
        select: { label: true },
      }),
      this.prisma.placeSuggestion.count({ where: { userId: actor.id, status: "PENDING" } }),
    ]);

    if (siblings.some((sibling) => sameLabel(input.label, sibling))) {
      throw apiError(HttpStatus.CONFLICT, "ALREADY_EXISTS", "Ce lieu existe déjà.");
    }
    if (pendingSame.some((suggestion) => sameLabel(input.label, suggestion))) {
      throw apiError(HttpStatus.CONFLICT, "ALREADY_EXISTS", "Ce lieu a déjà été proposé.");
    }
    if (pendingCount >= MAX_PENDING_SUGGESTIONS) {
      throw apiError(
        HttpStatus.CONFLICT,
        "LIMIT_REACHED",
        `${MAX_PENDING_SUGGESTIONS} propositions en attente maximum.`,
      );
    }

    const suggestion = await this.prisma.placeSuggestion.create({
      data: {
        userId: actor.id,
        kind: input.kind,
        label: input.label,
        parentId: input.parentId,
      },
    });
    return mapSuggestion(suggestion);
  }
}
