import { HttpStatus, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import type {
  AdminCreateCategoryInput,
  AdminCreateSubcategoryInput,
  AdminUpdateCategoryInput,
  AdminUpdateSubcategoryInput,
} from "../../common/contract";
import { apiError, notFound } from "../../common/http/errors";
import { isUniqueViolation } from "../../common/util/db";
import { PrismaService } from "../../database/prisma.service";
import { ActivityLogService } from "../activity/activity-log.service";
import {
  buildTree,
  countMap,
  findNode,
  mergeCounts,
  rollUp,
  subcategorySelect,
  treeOrder,
} from "./category-tree";

type Tx = Prisma.TransactionClient;
type ReadClient = Pick<
  Tx,
  | "category"
  | "subcategory"
  | "provider"
  | "booking"
  | "providerLead"
  | "providerLeadAdditionalSubcategory"
  | "clientWaitlistLeadSubcategory"
>;

export type ReferenceCounts = { providers: number; bookings: number; leads: number };

export async function countReferences(
  client: ReadClient,
  subcategoryIds: string[],
): Promise<ReferenceCounts> {
  if (subcategoryIds.length === 0) return { providers: 0, bookings: 0, leads: 0 };
  const inIds = { in: subcategoryIds };
  const [providers, bookings, primaryLeads, additionalLeads, clientLeads] = await Promise.all([
    client.provider.count({ where: { subcategoryId: inIds } }),
    client.booking.count({ where: { subcategoryId: inIds } }),
    client.providerLead.count({ where: { primarySubcategoryId: inIds } }),
    client.providerLeadAdditionalSubcategory.count({ where: { subcategoryId: inIds } }),
    client.clientWaitlistLeadSubcategory.count({ where: { subcategoryId: inIds } }),
  ]);
  return { providers, bookings, leads: primaryLeads + additionalLeads + clientLeads };
}

function assertUnreferenced(counts: ReferenceCounts, message: string) {
  if (counts.providers + counts.bookings + counts.leads > 0) {
    throw apiError(HttpStatus.CONFLICT, "REFERENCED", message, { counts });
  }
}

@Injectable()
export class AdminCategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityLogService,
  ) {}

  async list() {
    return { items: await this.tree(this.prisma) };
  }

  async get(id: string) {
    const [node] = await this.tree(this.prisma, id);
    if (!node) throw notFound("Catégorie introuvable");
    return node;
  }

  async listSubcategories(categoryId?: string) {
    const flatten = (nodes: Awaited<ReturnType<AdminCategoriesService["tree"]>>): typeof nodes =>
      nodes.flatMap((node) => [node, ...flatten(node.children)]);
    const nodes = flatten((await this.tree(this.prisma, categoryId)).flatMap((category) => category.children));
    return { items: nodes };
  }

  async getSubcategory(id: string) {
    const row = await this.prisma.subcategory.findUnique({ where: { id }, select: { categoryId: true } });
    if (!row) throw notFound("Sous-catégorie introuvable");
    return this.subcategoryNode(this.prisma, row.categoryId, id);
  }

  async createCategory(actor: Actor, input: AdminCreateCategoryInput, ipAddress?: string) {
    return this.write(async (tx) => {
      await this.assertCategorySlugFree(tx, input.slug);
      const maxOrder = await tx.category.aggregate({ _max: { order: true } });
      const category = await tx.category.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description ?? null,
          icon: input.icon ?? null,
          image: input.image ?? null,
          color: input.color ?? null,
          order: input.order ?? (maxOrder._max.order ?? -1) + 1,
          isActive: input.isActive ?? true,
        },
      });
      await this.log(tx, actor, "category.create", "Category", category.id, { slug: category.slug }, ipAddress);
      const [node] = await this.tree(tx, category.id);
      return node!;
    });
  }

  async updateCategory(actor: Actor, id: string, input: AdminUpdateCategoryInput, ipAddress?: string) {
    return this.write(async (tx) => {
      const existing = await tx.category.findUnique({ where: { id } });
      if (!existing) throw notFound("Catégorie introuvable");
      if (input.slug && input.slug !== existing.slug) await this.assertCategorySlugFree(tx, input.slug);
      if (input.isActive === false && existing.isActive) {
        assertUnreferenced(
          await countReferences(tx, await this.categorySubcategoryIds(tx, id)),
          "Cette catégorie est encore utilisée et ne peut pas être désactivée.",
        );
      }

      await tx.category.update({
        where: { id },
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          icon: input.icon,
          image: input.image,
          color: input.color,
          order: input.order,
          isActive: input.isActive,
        },
      });
      await this.log(tx, actor, "category.update", "Category", id, { fields: Object.keys(input) }, ipAddress);
      const [node] = await this.tree(tx, id);
      return node!;
    });
  }

  async deleteCategory(actor: Actor, id: string, ipAddress?: string) {
    return this.write(async (tx) => {
      const existing = await tx.category.findUnique({ where: { id } });
      if (!existing) throw notFound("Catégorie introuvable");
      assertUnreferenced(
        await countReferences(tx, await this.categorySubcategoryIds(tx, id)),
        "Cette catégorie est encore utilisée et ne peut pas être supprimée.",
      );

      // Scoped skills would otherwise become global choices once categoryId is nulled.
      await tx.referenceItem.updateMany({ where: { categoryId: id }, data: { active: false } });
      await tx.category.delete({ where: { id } });
      await this.log(tx, actor, "category.delete", "Category", id, { slug: existing.slug }, ipAddress);
      return { ok: true as const };
    });
  }

  async createSubcategory(actor: Actor, input: AdminCreateSubcategoryInput, ipAddress?: string) {
    return this.write(async (tx) => {
      const category = await tx.category.findUnique({ where: { id: input.categoryId } });
      if (!category) {
        throw apiError(HttpStatus.BAD_REQUEST, "INVALID_REFERENCE", "Catégorie introuvable.");
      }
      const parentId = input.parentId ?? null;
      if (parentId) {
        const parent = await tx.subcategory.findUnique({ where: { id: parentId } });
        if (!parent || parent.categoryId !== input.categoryId || parent.parentId !== null) {
          throw apiError(
            HttpStatus.BAD_REQUEST,
            "INVALID_REFERENCE",
            "Le parent doit être une sous-catégorie de premier niveau de la même catégorie.",
          );
        }
      }
      await this.assertSubcategorySlugFree(tx, input.slug);

      const maxOrder = await tx.subcategory.aggregate({
        where: { categoryId: input.categoryId, parentId },
        _max: { order: true },
      });
      const subcategory = await tx.subcategory.create({
        data: {
          categoryId: input.categoryId,
          parentId,
          name: input.name,
          slug: input.slug,
          description: input.description ?? null,
          icon: input.icon ?? null,
          order: input.order ?? (maxOrder._max.order ?? -1) + 1,
          isActive: input.isActive ?? true,
        },
      });
      await this.log(
        tx,
        actor,
        "subcategory.create",
        "Subcategory",
        subcategory.id,
        { categoryId: input.categoryId, parentId, slug: subcategory.slug },
        ipAddress,
      );
      return this.subcategoryNode(tx, subcategory.categoryId, subcategory.id);
    });
  }

  async updateSubcategory(
    actor: Actor,
    id: string,
    input: AdminUpdateSubcategoryInput,
    ipAddress?: string,
  ) {
    return this.write(async (tx) => {
      const existing = await tx.subcategory.findUnique({ where: { id } });
      if (!existing) throw notFound("Sous-catégorie introuvable");
      if (input.slug && input.slug !== existing.slug) await this.assertSubcategorySlugFree(tx, input.slug);
      if (input.isActive === false && existing.isActive) {
        assertUnreferenced(
          await countReferences(tx, await this.subtreeIds(tx, id)),
          "Cette sous-catégorie est encore utilisée et ne peut pas être désactivée.",
        );
      }

      await tx.subcategory.update({
        where: { id },
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          icon: input.icon,
          order: input.order,
          isActive: input.isActive,
        },
      });
      await this.log(tx, actor, "subcategory.update", "Subcategory", id, { fields: Object.keys(input) }, ipAddress);
      return this.subcategoryNode(tx, existing.categoryId, id);
    });
  }

  async deleteSubcategory(actor: Actor, id: string, ipAddress?: string) {
    return this.write(async (tx) => {
      const existing = await tx.subcategory.findUnique({ where: { id } });
      if (!existing) throw notFound("Sous-catégorie introuvable");
      assertUnreferenced(
        await countReferences(tx, await this.subtreeIds(tx, id)),
        "Cette sous-catégorie est encore utilisée et ne peut pas être supprimée.",
      );
      await tx.subcategory.delete({ where: { id } });
      await this.log(tx, actor, "subcategory.delete", "Subcategory", id, { slug: existing.slug }, ipAddress);
      return { ok: true as const };
    });
  }

  private async tree(client: ReadClient, categoryId?: string) {
    const [categories, subcategories] = await Promise.all([
      client.category.findMany({ where: categoryId ? { id: categoryId } : {}, orderBy: treeOrder }),
      client.subcategory.findMany({
        where: categoryId ? { categoryId } : {},
        select: subcategorySelect,
        orderBy: treeOrder,
      }),
    ]);
    const ids = { in: subcategories.map((sub) => sub.id) };
    const [providers, bookings, primaryLeads, additionalLeads, clientLeads] = await Promise.all([
      client.provider.groupBy({ by: ["subcategoryId"], where: { subcategoryId: ids }, _count: { _all: true } }),
      client.booking.groupBy({ by: ["subcategoryId"], where: { subcategoryId: ids }, _count: { _all: true } }),
      client.providerLead.groupBy({
        by: ["primarySubcategoryId"],
        where: { primarySubcategoryId: ids },
        _count: { _all: true },
      }),
      client.providerLeadAdditionalSubcategory.groupBy({
        by: ["subcategoryId"],
        where: { subcategoryId: ids },
        _count: { _all: true },
      }),
      client.clientWaitlistLeadSubcategory.groupBy({
        by: ["subcategoryId"],
        where: { subcategoryId: ids },
        _count: { _all: true },
      }),
    ]);

    const providerCounts = rollUp(
      subcategories,
      countMap(providers.map((row) => ({ key: row.subcategoryId, count: row._count._all }))),
    );
    const bookingCounts = rollUp(
      subcategories,
      countMap(bookings.map((row) => ({ key: row.subcategoryId, count: row._count._all }))),
    );
    const leadCounts = rollUp(
      subcategories,
      mergeCounts(
        countMap(primaryLeads.map((row) => ({ key: row.primarySubcategoryId, count: row._count._all }))),
        countMap(additionalLeads.map((row) => ({ key: row.subcategoryId, count: row._count._all }))),
        countMap(clientLeads.map((row) => ({ key: row.subcategoryId, count: row._count._all }))),
      ),
    );

    return buildTree(categories, subcategories, {
      activeOnly: false,
      category: (category) => ({
        description: category.description,
        icon: category.icon,
        color: category.color,
        image: category.image,
        order: category.order,
        isActive: category.isActive,
        categoryId: null as string | null,
        parentId: null as string | null,
        counts: {
          providers: providerCounts.byCategory.get(category.id) ?? 0,
          bookings: bookingCounts.byCategory.get(category.id) ?? 0,
          leads: leadCounts.byCategory.get(category.id) ?? 0,
        },
      }),
      subcategory: (sub) => ({
        description: sub.description,
        icon: sub.icon,
        color: null as string | null,
        image: null as string | null,
        order: sub.order,
        isActive: sub.isActive,
        categoryId: sub.categoryId as string | null,
        parentId: sub.parentId,
        counts: {
          providers: providerCounts.bySubcategory.get(sub.id) ?? 0,
          bookings: bookingCounts.bySubcategory.get(sub.id) ?? 0,
          leads: leadCounts.bySubcategory.get(sub.id) ?? 0,
        },
      }),
    });
  }

  private async subcategoryNode(client: ReadClient, categoryId: string, id: string) {
    const node = findNode(await this.tree(client, categoryId), id);
    if (!node) throw notFound("Sous-catégorie introuvable");
    return node;
  }

  private async categorySubcategoryIds(client: ReadClient, categoryId: string) {
    const rows = await client.subcategory.findMany({ where: { categoryId }, select: { id: true } });
    return rows.map((row) => row.id);
  }

  private async subtreeIds(client: ReadClient, id: string) {
    const children = await client.subcategory.findMany({ where: { parentId: id }, select: { id: true } });
    return [id, ...children.map((row) => row.id)];
  }

  private async assertCategorySlugFree(client: ReadClient, slug: string) {
    if (await client.category.findUnique({ where: { slug }, select: { id: true } })) {
      throw apiError(HttpStatus.CONFLICT, "ALREADY_EXISTS", "Ce slug de catégorie est déjà utilisé.");
    }
  }

  private async assertSubcategorySlugFree(client: ReadClient, slug: string) {
    if (await client.subcategory.findUnique({ where: { slug }, select: { id: true } })) {
      throw apiError(HttpStatus.CONFLICT, "ALREADY_EXISTS", "Ce slug de sous-catégorie est déjà utilisé.");
    }
  }

  private log(
    tx: Tx,
    actor: Actor,
    action: string,
    entityType: string,
    entityId: string,
    metadata: Prisma.InputJsonValue,
    ipAddress?: string,
  ) {
    return this.activity.log({ userId: actor.id, action, entityType, entityId, metadata, ipAddress }, tx);
  }

  private async write<T>(run: (tx: Tx) => Promise<T>): Promise<T> {
    try {
      return await this.prisma.$transaction(run);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw apiError(HttpStatus.CONFLICT, "ALREADY_EXISTS", "Ce slug est déjà utilisé.");
      }
      throw error;
    }
  }
}
