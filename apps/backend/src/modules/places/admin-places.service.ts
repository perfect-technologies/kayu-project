import { HttpStatus, Injectable } from "@nestjs/common";
import type { Place, PlaceKind, Prisma } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import type {
  AdminCreatePlaceInput,
  AdminMergeInput,
  AdminPlaceSearchQuery,
  AdminSuggestionSearchQuery,
  AdminUpdatePlaceInput,
} from "../../common/contract";
import { apiError, notFound } from "../../common/http/errors";
import { pageArgs, toPage } from "../../common/http/pagination";
import { isUniqueViolation } from "../../common/util/db";
import { fullName, slugify } from "../../common/util/people";
import { PrismaService } from "../../database/prisma.service";
import { ActivityLogService } from "../activity/activity-log.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PlaceTreeService } from "./place-tree.service";
import { assertParentKind, mapSuggestion, sameLabel, searchLabelWhere } from "./places.service";

type Tx = Prisma.TransactionClient;

const adminPlaceSelect = {
  id: true,
  kind: true,
  label: true,
  slug: true,
  parentId: true,
  aliases: true,
  source: true,
  latitude: true,
  longitude: true,
  active: true,
  mergedIntoId: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { children: true } },
} satisfies Prisma.PlaceSelect;

type AdminPlaceRow = Prisma.PlaceGetPayload<{ select: typeof adminPlaceSelect }>;

function mapAdminPlace(place: AdminPlaceRow) {
  return {
    id: place.id,
    kind: place.kind,
    label: place.label,
    parentId: place.parentId,
    hasChildren: place._count.children > 0,
    childCount: place._count.children,
    slug: place.slug,
    aliases: place.aliases,
    source: place.source,
    latitude: place.latitude,
    longitude: place.longitude,
    active: place.active,
    mergedIntoId: place.mergedIntoId,
    createdAt: place.createdAt,
    updatedAt: place.updatedAt,
  };
}

async function uniqueSlug(tx: Pick<Tx, "place">, base: string): Promise<string> {
  const taken = new Set(
    (await tx.place.findMany({ where: { slug: { startsWith: base } }, select: { slug: true } })).map(
      (row) => row.slug,
    ),
  );
  if (!taken.has(base)) return base;
  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export function placeSlug(kind: PlaceKind, label: string, parentSlug: string | null): string {
  return `${parentSlug ? `${parentSlug}-` : ""}${kind.toLowerCase()}-${slugify(label)}`;
}

@Injectable()
export class AdminPlacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tree: PlaceTreeService,
    private readonly activity: ActivityLogService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(query: AdminPlaceSearchQuery) {
    const where: Prisma.PlaceWhereInput = {
      ...(query.kind ? { kind: query.kind } : {}),
      ...(query.parentId ? { parentId: query.parentId } : {}),
      ...(query.active !== undefined ? { active: query.active } : {}),
      ...(query.q ? searchLabelWhere(query.q) : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.place.count({ where }),
      this.prisma.place.findMany({
        where,
        select: adminPlaceSelect,
        orderBy: [{ label: "asc" }, { id: "asc" }],
        ...pageArgs(query),
      }),
    ]);
    return toPage(rows.map(mapAdminPlace), total, query);
  }

  async get(id: string) {
    const row = await this.prisma.place.findUnique({ where: { id }, select: adminPlaceSelect });
    if (!row) throw notFound("Lieu introuvable");
    return { ...mapAdminPlace(row), chain: await this.tree.chain(row.id) };
  }

  async create(actor: Actor, input: AdminCreatePlaceInput, ipAddress?: string) {
    return this.write(async (tx) => {
      const parentId = input.parentId ?? null;
      const parent = parentId ? await this.usableParent(tx, parentId) : null;
      assertParentKind(input.kind, parent?.kind ?? null);
      await this.assertNoDuplicate(tx, parentId, input.kind, input.label);

      const place = await tx.place.create({
        data: {
          kind: input.kind,
          label: input.label,
          slug: await uniqueSlug(tx, placeSlug(input.kind, input.label, parent?.slug ?? null)),
          parentId,
          aliases: input.aliases,
          source: input.source ?? null,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          active: input.active ?? true,
        },
        select: adminPlaceSelect,
      });
      await this.activity.log(
        {
          userId: actor.id,
          action: "place.create",
          entityType: "Place",
          entityId: place.id,
          metadata: { kind: place.kind, label: place.label, parentId },
          ipAddress,
        },
        tx,
      );
      return mapAdminPlace(place);
    });
  }

  async update(actor: Actor, id: string, input: AdminUpdatePlaceInput, ipAddress?: string) {
    return this.write(async (tx) => {
      const existing = await tx.place.findUnique({ where: { id } });
      if (!existing) throw notFound("Lieu introuvable");
      if (input.active === true && existing.mergedIntoId) {
        throw apiError(
          HttpStatus.CONFLICT,
          "INVALID_TRANSITION",
          "Un lieu fusionné ne peut pas être réactivé.",
        );
      }
      if (input.label !== undefined && input.label !== existing.label) {
        await this.assertNoDuplicate(tx, existing.parentId, existing.kind, input.label, id);
      }

      const place = await tx.place.update({
        where: { id },
        data: {
          label: input.label,
          aliases: input.aliases,
          source: input.source,
          latitude: input.latitude,
          longitude: input.longitude,
          active: input.active,
        },
        select: adminPlaceSelect,
      });
      await this.activity.log(
        {
          userId: actor.id,
          action: "place.update",
          entityType: "Place",
          entityId: id,
          metadata: { fields: Object.keys(input) },
          ipAddress,
        },
        tx,
      );
      return mapAdminPlace(place);
    });
  }

  async merge(actor: Actor, input: AdminMergeInput, ipAddress?: string) {
    return this.write(async (tx) => {
      const [from, into] = await Promise.all([
        tx.place.findUnique({ where: { id: input.fromId } }),
        tx.place.findUnique({ where: { id: input.intoId } }),
      ]);
      if (!from || !into) throw notFound("Lieu introuvable");
      if (
        from.kind !== into.kind ||
        from.parentId !== into.parentId ||
        from.mergedIntoId ||
        into.mergedIntoId ||
        !into.active
      ) {
        throw apiError(
          HttpStatus.CONFLICT,
          "INVALID_TRANSITION",
          "Fusion possible uniquement entre lieux actifs du même type et du même parent.",
        );
      }
      const children = await tx.place.count({ where: { parentId: from.id } });
      if (children > 0) {
        throw apiError(
          HttpStatus.CONFLICT,
          "REFERENCED",
          "Fusionnez ou réaffectez les subdivisions avant ce lieu.",
          { counts: { children } },
        );
      }

      const repoint = { where: { placeId: from.id }, data: { placeId: into.id } };
      const [users, providers, addresses, bookings, suggestions] = await Promise.all([
        tx.user.updateMany(repoint),
        tx.provider.updateMany(repoint),
        tx.address.updateMany(repoint),
        tx.booking.updateMany(repoint),
        tx.placeSuggestion.updateMany({ where: { parentId: from.id }, data: { parentId: into.id } }),
      ]);
      await tx.placeSuggestion.updateMany({
        where: { resolvedPlaceId: from.id },
        data: { resolvedPlaceId: into.id },
      });
      await tx.place.updateMany({ where: { mergedIntoId: from.id }, data: { mergedIntoId: into.id } });
      await tx.place.update({ where: { id: from.id }, data: { active: false, mergedIntoId: into.id } });

      const repointed = {
        users: users.count,
        providers: providers.count,
        addresses: addresses.count,
        bookings: bookings.count,
        suggestions: suggestions.count,
      };
      await this.activity.log(
        {
          userId: actor.id,
          action: "place.merge",
          entityType: "Place",
          entityId: from.id,
          metadata: { fromId: from.id, intoId: into.id, repointed },
          ipAddress,
        },
        tx,
      );

      const [fromRow, intoRow] = await Promise.all([
        tx.place.findUniqueOrThrow({ where: { id: from.id }, select: adminPlaceSelect }),
        tx.place.findUniqueOrThrow({ where: { id: into.id }, select: adminPlaceSelect }),
      ]);
      return { from: mapAdminPlace(fromRow), into: mapAdminPlace(intoRow), repointed };
    });
  }

  async listSuggestions(query: AdminSuggestionSearchQuery) {
    const where: Prisma.PlaceSuggestionWhereInput = { status: query.status ?? "PENDING" };
    const [total, rows] = await Promise.all([
      this.prisma.placeSuggestion.count({ where }),
      this.prisma.placeSuggestion.findMany({
        where,
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        ...pageArgs(query),
      }),
    ]);
    const chains = await this.tree.chains(rows.map((row) => row.parentId));
    return toPage(
      rows.map((row) => ({
        ...mapSuggestion(row),
        parentChain: row.parentId ? (chains.get(row.parentId) ?? []) : [],
        user: { id: row.user.id, name: fullName(row.user) },
      })),
      total,
      query,
    );
  }

  async approve(actor: Actor, id: string, ipAddress?: string) {
    return this.write(async (tx) => {
      const suggestion = await this.pendingSuggestion(tx, id);
      if (!suggestion.parentId) {
        throw apiError(HttpStatus.BAD_REQUEST, "INVALID_REFERENCE", "Le lieu parent n'existe plus.");
      }
      const parent = await this.usableParent(tx, suggestion.parentId);
      assertParentKind(suggestion.kind, parent.kind);

      const siblings = await tx.place.findMany({
        where: { parentId: parent.id, kind: suggestion.kind, mergedIntoId: null },
        select: { id: true, label: true, aliases: true, active: true },
      });
      const existing = siblings.find((sibling) => sameLabel(suggestion.label, sibling));

      let placeId: string;
      if (existing) {
        placeId = existing.id;
        if (!existing.active) {
          await tx.place.update({ where: { id: existing.id }, data: { active: true } });
        }
      } else {
        const created = await tx.place.create({
          data: {
            kind: suggestion.kind,
            label: suggestion.label,
            slug: await uniqueSlug(tx, placeSlug(suggestion.kind, suggestion.label, parent.slug)),
            parentId: parent.id,
            source: "Proposition utilisateur",
          },
          select: { id: true },
        });
        placeId = created.id;
      }

      const resolved = await tx.placeSuggestion.update({
        where: { id },
        data: { status: "APPROVED", resolvedAt: new Date(), resolvedPlaceId: placeId },
      });
      await this.notifications.create(
        {
          userId: suggestion.userId,
          type: "PLACE_SUGGESTION_RESOLVED",
          title: "Lieu ajouté",
          message: `« ${suggestion.label} » est désormais disponible dans la liste des lieux.`,
          data: { suggestionId: id, placeId, status: "APPROVED" },
        },
        tx,
      );
      await this.activity.log(
        {
          userId: actor.id,
          action: "suggestion.approve",
          entityType: "PlaceSuggestion",
          entityId: id,
          metadata: { placeId, linkedExisting: Boolean(existing) },
          ipAddress,
        },
        tx,
      );
      return mapSuggestion(resolved);
    });
  }

  async reject(actor: Actor, id: string, ipAddress?: string) {
    return this.write(async (tx) => {
      const suggestion = await this.pendingSuggestion(tx, id);
      const resolved = await tx.placeSuggestion.update({
        where: { id },
        data: { status: "REJECTED", resolvedAt: new Date() },
      });
      await this.notifications.create(
        {
          userId: suggestion.userId,
          type: "PLACE_SUGGESTION_RESOLVED",
          title: "Proposition de lieu refusée",
          message: `« ${suggestion.label} » n'a pas été ajouté à la liste des lieux.`,
          data: { suggestionId: id, placeId: null, status: "REJECTED" },
        },
        tx,
      );
      await this.activity.log(
        {
          userId: actor.id,
          action: "suggestion.reject",
          entityType: "PlaceSuggestion",
          entityId: id,
          ipAddress,
        },
        tx,
      );
      return mapSuggestion(resolved);
    });
  }

  private async write<T>(run: (tx: Tx) => Promise<T>): Promise<T> {
    try {
      return await this.prisma.$transaction(run);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw apiError(HttpStatus.CONFLICT, "ALREADY_EXISTS", "Ce lieu existe déjà.");
      }
      throw error;
    }
  }

  private async usableParent(tx: Tx, parentId: string): Promise<Place> {
    const parent = await tx.place.findUnique({ where: { id: parentId } });
    if (!parent || !parent.active || parent.mergedIntoId) {
      throw apiError(HttpStatus.BAD_REQUEST, "INVALID_REFERENCE", "Sélectionnez un lieu parent actif.");
    }
    return parent;
  }

  private async assertNoDuplicate(
    tx: Tx,
    parentId: string | null,
    kind: PlaceKind,
    label: string,
    excludeId?: string,
  ) {
    const siblings = await tx.place.findMany({
      where: { parentId, kind, mergedIntoId: null, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { label: true },
    });
    if (siblings.some((sibling) => sameLabel(label, sibling))) {
      throw apiError(HttpStatus.CONFLICT, "ALREADY_EXISTS", "Ce lieu existe déjà.");
    }
  }

  private async pendingSuggestion(tx: Tx, id: string) {
    const suggestion = await tx.placeSuggestion.findUnique({ where: { id } });
    if (!suggestion) throw notFound("Proposition introuvable");
    if (suggestion.status !== "PENDING") {
      throw apiError(HttpStatus.CONFLICT, "INVALID_TRANSITION", "Cette proposition a déjà été traitée.");
    }
    return suggestion;
  }
}
