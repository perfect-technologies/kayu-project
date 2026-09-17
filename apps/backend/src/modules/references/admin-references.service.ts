import { HttpStatus, Injectable } from "@nestjs/common";
import type { Prisma, ReferenceType } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import type {
  AdminCreateReferenceInput,
  AdminMergeInput,
  AdminReferenceSearchQuery,
  AdminUpdateReferenceInput,
} from "../../common/contract";
import { apiError, notFound } from "../../common/http/errors";
import { pageArgs, toPage } from "../../common/http/pagination";
import { isUniqueViolation } from "../../common/util/db";
import { normalizeLabel, slugify } from "../../common/util/people";
import { PrismaService } from "../../database/prisma.service";
import { ActivityLogService } from "../activity/activity-log.service";
import { referenceLabelWhere } from "./references.service";

type Tx = Prisma.TransactionClient;

type LinkDelegate = {
  findMany(args: {
    where: { itemId: string; providerId?: { in: string[] } };
    select: { providerId: true };
  }): Promise<Array<{ providerId: string }>>;
  deleteMany(args: { where: { itemId: string; providerId: { in: string[] } } }): Promise<{ count: number }>;
  updateMany(args: { where: { itemId: string }; data: { itemId: string } }): Promise<{ count: number }>;
};

export const REFERENCE_SLUG_PREFIX: Record<ReferenceType, string> = {
  LANGUAGE: "language",
  INTERVENTION_MODE: "mode",
  CURRENCY: "currency",
  PRICE_UNIT: "price-unit",
  SKILL: "skill-custom",
};

const adminReferenceSelect = {
  id: true,
  type: true,
  label: true,
  slug: true,
  aliases: true,
  categoryId: true,
  order: true,
  active: true,
  suggested: true,
  mergedIntoId: true,
  source: true,
  createdAt: true,
  _count: { select: { providerSkills: true, providerRefs: true } },
} satisfies Prisma.ReferenceItemSelect;

type AdminReferenceRow = Prisma.ReferenceItemGetPayload<{ select: typeof adminReferenceSelect }>;

function mapAdminReference(item: AdminReferenceRow) {
  const { _count, ...rest } = item;
  return { ...rest, usageCount: _count.providerSkills + _count.providerRefs };
}

export function referenceSlug(type: ReferenceType, label: string): string {
  return `${REFERENCE_SLUG_PREFIX[type]}-${slugify(label.replace(/²/g, "2"))}`;
}

@Injectable()
export class AdminReferencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityLogService,
  ) {}

  async list(query: AdminReferenceSearchQuery) {
    const where: Prisma.ReferenceItemWhereInput = {
      ...(query.type ? { type: query.type } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.active !== undefined ? { active: query.active } : {}),
      ...(query.q ? referenceLabelWhere(query.q) : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.referenceItem.count({ where }),
      this.prisma.referenceItem.findMany({
        where,
        select: adminReferenceSelect,
        orderBy: [{ type: "asc" }, { order: "asc" }, { label: "asc" }, { id: "asc" }],
        ...pageArgs(query),
      }),
    ]);
    return toPage(rows.map(mapAdminReference), total, query);
  }

  async get(id: string) {
    const row = await this.prisma.referenceItem.findUnique({ where: { id }, select: adminReferenceSelect });
    if (!row) throw notFound("Référence introuvable");
    return mapAdminReference(row);
  }

  async create(actor: Actor, input: AdminCreateReferenceInput, ipAddress?: string) {
    return this.write(async (tx) => {
      const categoryId = await this.resolveCategory(tx, input.type, input.categoryId ?? null);
      await this.assertNoDuplicate(tx, input.type, categoryId, input.label);

      const maxOrder = await tx.referenceItem.aggregate({
        where: { type: input.type },
        _max: { order: true },
      });
      const item = await tx.referenceItem.create({
        data: {
          type: input.type,
          label: input.label,
          slug: await this.uniqueSlug(tx, referenceSlug(input.type, input.label)),
          aliases: input.aliases,
          categoryId,
          order: input.order ?? (maxOrder._max.order ?? -1) + 1,
          active: input.active ?? true,
          suggested: input.suggested ?? true,
          source: input.source ?? null,
        },
        select: adminReferenceSelect,
      });
      await this.activity.log(
        {
          userId: actor.id,
          action: "reference.create",
          entityType: "ReferenceItem",
          entityId: item.id,
          metadata: { type: item.type, label: item.label, categoryId },
          ipAddress,
        },
        tx,
      );
      return mapAdminReference(item);
    });
  }

  async update(actor: Actor, id: string, input: AdminUpdateReferenceInput, ipAddress?: string) {
    return this.write(async (tx) => {
      const existing = await tx.referenceItem.findUnique({ where: { id } });
      if (!existing) throw notFound("Référence introuvable");
      if (input.active === true && existing.mergedIntoId) {
        throw apiError(
          HttpStatus.CONFLICT,
          "INVALID_TRANSITION",
          "Une référence fusionnée ne peut pas être réactivée.",
        );
      }
      const categoryId =
        input.categoryId === undefined
          ? existing.categoryId
          : await this.resolveCategory(tx, existing.type, input.categoryId);
      const label = input.label ?? existing.label;
      if (label !== existing.label || categoryId !== existing.categoryId) {
        await this.assertNoDuplicate(tx, existing.type, categoryId, label, id);
      }

      const item = await tx.referenceItem.update({
        where: { id },
        data: {
          label: input.label,
          aliases: input.aliases,
          categoryId: input.categoryId === undefined ? undefined : categoryId,
          order: input.order,
          active: input.active,
          suggested: input.suggested,
          source: input.source,
        },
        select: adminReferenceSelect,
      });
      await this.activity.log(
        {
          userId: actor.id,
          action: "reference.update",
          entityType: "ReferenceItem",
          entityId: id,
          metadata: { fields: Object.keys(input) },
          ipAddress,
        },
        tx,
      );
      return mapAdminReference(item);
    });
  }

  async merge(actor: Actor, input: AdminMergeInput, ipAddress?: string) {
    return this.write(async (tx) => {
      const [from, into] = await Promise.all([
        tx.referenceItem.findUnique({ where: { id: input.fromId } }),
        tx.referenceItem.findUnique({ where: { id: input.intoId } }),
      ]);
      if (!from || !into) throw notFound("Référence introuvable");
      if (
        from.type !== into.type ||
        (from.type === "SKILL" && from.categoryId !== into.categoryId) ||
        from.mergedIntoId ||
        into.mergedIntoId ||
        !into.active
      ) {
        throw apiError(
          HttpStatus.CONFLICT,
          "INVALID_TRANSITION",
          "Fusion possible uniquement vers une référence active du même type.",
        );
      }

      const skills = await this.repointLinks(
        tx.providerSkill as unknown as LinkDelegate,
        from.id,
        into.id,
      );
      const references = await this.repointLinks(
        tx.providerReference as unknown as LinkDelegate,
        from.id,
        into.id,
      );
      const [currencies, units] = await Promise.all([
        tx.provider.updateMany({
          where: { pricingCurrencyId: from.id },
          data: { pricingCurrencyId: into.id },
        }),
        tx.provider.updateMany({ where: { pricingUnitId: from.id }, data: { pricingUnitId: into.id } }),
      ]);
      await tx.referenceItem.updateMany({
        where: { mergedIntoId: from.id },
        data: { mergedIntoId: into.id },
      });
      await tx.referenceItem.update({
        where: { id: from.id },
        data: { active: false, mergedIntoId: into.id },
      });

      const repointed = {
        providerSkills: skills,
        providerReferences: references,
        pricing: currencies.count + units.count,
      };
      await this.activity.log(
        {
          userId: actor.id,
          action: "reference.merge",
          entityType: "ReferenceItem",
          entityId: from.id,
          metadata: { fromId: from.id, intoId: into.id, type: from.type, repointed },
          ipAddress,
        },
        tx,
      );

      const [fromRow, intoRow] = await Promise.all([
        tx.referenceItem.findUniqueOrThrow({ where: { id: from.id }, select: adminReferenceSelect }),
        tx.referenceItem.findUniqueOrThrow({ where: { id: into.id }, select: adminReferenceSelect }),
      ]);
      return { from: mapAdminReference(fromRow), into: mapAdminReference(intoRow), repointed };
    });
  }

  // Link tables are keyed by (providerId, itemId): a provider holding both items keeps only `into`.
  private async repointLinks(
    delegate: LinkDelegate,
    fromId: string,
    intoId: string,
  ): Promise<number> {
    const holders = await delegate.findMany({ where: { itemId: fromId }, select: { providerId: true } });
    if (holders.length === 0) return 0;
    const both = await delegate.findMany({
      where: { itemId: intoId, providerId: { in: holders.map((row) => row.providerId) } },
      select: { providerId: true },
    });
    if (both.length > 0) {
      await delegate.deleteMany({
        where: { itemId: fromId, providerId: { in: both.map((row) => row.providerId) } },
      });
    }
    const moved = await delegate.updateMany({ where: { itemId: fromId }, data: { itemId: intoId } });
    return moved.count + both.length;
  }

  private async write<T>(run: (tx: Tx) => Promise<T>): Promise<T> {
    try {
      return await this.prisma.$transaction(run);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw apiError(HttpStatus.CONFLICT, "ALREADY_EXISTS", "Cette référence existe déjà.");
      }
      throw error;
    }
  }

  private async resolveCategory(
    tx: Tx,
    type: ReferenceType,
    categoryId: string | null,
  ): Promise<string | null> {
    if (!categoryId) return null;
    if (type !== "SKILL") {
      throw apiError(
        HttpStatus.BAD_REQUEST,
        "INVALID_REFERENCE",
        "Seules les compétences sont rattachées à une catégorie.",
      );
    }
    const category = await tx.category.findUnique({ where: { id: categoryId }, select: { id: true } });
    if (!category) {
      throw apiError(HttpStatus.BAD_REQUEST, "INVALID_REFERENCE", "Catégorie introuvable.");
    }
    return category.id;
  }

  private async assertNoDuplicate(
    tx: Tx,
    type: ReferenceType,
    categoryId: string | null,
    label: string,
    excludeId?: string,
  ) {
    const rows = await tx.referenceItem.findMany({
      where: {
        type,
        mergedIntoId: null,
        ...(type === "SKILL" ? { categoryId } : {}),
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { label: true },
    });
    const target = normalizeLabel(label);
    if (rows.some((row) => normalizeLabel(row.label) === target)) {
      throw apiError(HttpStatus.CONFLICT, "ALREADY_EXISTS", "Ce choix existe déjà.");
    }
  }

  private async uniqueSlug(tx: Tx, base: string): Promise<string> {
    const taken = new Set(
      (
        await tx.referenceItem.findMany({
          where: { slug: { startsWith: base } },
          select: { slug: true },
        })
      ).map((row) => row.slug),
    );
    if (!taken.has(base)) return base;
    let suffix = 2;
    while (taken.has(`${base}-${suffix}`)) suffix += 1;
    return `${base}-${suffix}`;
  }
}
