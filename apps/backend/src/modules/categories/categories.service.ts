import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

type CategorySearchQuery = {
  withSubcategories?: boolean;
  categoryId?: string;
  categorySlug?: string;
};

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: CategorySearchQuery) {
    if (query.categoryId || query.categorySlug) {
      return {
        success: true as const,
        subcategories: await this.findSubcategories(query),
      };
    }

    const categories = query.withSubcategories
      ? await this.prisma.category.findMany({
          where: {
            isActive: true,
          },
          orderBy: [{ order: "asc" }, { name: "asc" }],
          include: {
            subcategories: {
              where: { isActive: true },
              orderBy: [{ order: "asc" }, { name: "asc" }],
            },
          },
        })
      : await this.prisma.category.findMany({
          where: {
            isActive: true,
          },
          orderBy: [{ order: "asc" }, { name: "asc" }],
        });

    const providerCountByCategoryId = await this.countVisibleProvidersByCategory(
      categories.map((category) => category.id),
    );

    if (query.withSubcategories) {
      const categoriesWithSubcategories = categories as Array<
        Prisma.CategoryGetPayload<{
          include: {
            subcategories: true;
          };
        }>
      >;

      return {
        success: true as const,
        categories: categoriesWithSubcategories.map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          icon: category.icon,
          image: category.image,
          color: category.color,
          order: category.order,
          isActive: category.isActive,
          createdAt: category.createdAt,
          providerCount: providerCountByCategoryId.get(category.id) ?? 0,
          providersCount: providerCountByCategoryId.get(category.id) ?? 0,
          subcategories: category.subcategories.map((subcategory) => ({
            id: subcategory.id,
            categoryId: subcategory.categoryId,
            name: subcategory.name,
            slug: subcategory.slug,
            description: subcategory.description,
            icon: subcategory.icon,
            order: subcategory.order,
            isActive: subcategory.isActive,
            createdAt: subcategory.createdAt,
          })),
        })),
      };
    }

    return {
      success: true as const,
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        image: category.image,
        color: category.color,
        order: category.order,
        isActive: category.isActive,
        createdAt: category.createdAt,
        providerCount: providerCountByCategoryId.get(category.id) ?? 0,
        providersCount: providerCountByCategoryId.get(category.id) ?? 0,
      })),
    };
  }

  async findHierarchy() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        subcategories: {
          where: { isActive: true },
          orderBy: [{ order: "asc" }, { name: "asc" }],
          include: {
            trades: {
              where: { isActive: true },
              orderBy: [{ order: "asc" }, { name: "asc" }],
            },
          },
        },
      },
    });

    const providerCountByCategoryId = await this.countVisibleProvidersByCategory(
      categories.map((category) => category.id),
    );

    return {
      success: true as const,
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        image: category.image,
        color: category.color,
        order: category.order,
        isActive: category.isActive,
        createdAt: category.createdAt,
        providerCount: providerCountByCategoryId.get(category.id) ?? 0,
        providersCount: providerCountByCategoryId.get(category.id) ?? 0,
        subcategories: category.subcategories.map((subcategory) => ({
          id: subcategory.id,
          categoryId: subcategory.categoryId,
          name: subcategory.name,
          slug: subcategory.slug,
          description: subcategory.description,
          icon: subcategory.icon,
          order: subcategory.order,
          isActive: subcategory.isActive,
          createdAt: subcategory.createdAt,
          trades: subcategory.trades.map((trade) => ({
            id: trade.id,
            subcategoryId: trade.subcategoryId,
            name: trade.name,
            slug: trade.slug,
            description: trade.description,
            icon: trade.icon,
            basePrice: trade.basePrice,
            duration: trade.duration,
            isActive: trade.isActive,
            order: trade.order,
            createdAt: trade.createdAt,
          })),
        })),
      })),
    };
  }

  private async findSubcategories(query: CategorySearchQuery) {
    const subcategories = await this.prisma.subcategory.findMany({
      where: query.categoryId
        ? {
            categoryId: query.categoryId,
            isActive: true,
          }
        : {
            category: {
              slug: query.categorySlug,
              isActive: true,
            },
            isActive: true,
          },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    return subcategories.map((subcategory) => ({
      id: subcategory.id,
      categoryId: subcategory.categoryId,
      name: subcategory.name,
      slug: subcategory.slug,
      description: subcategory.description,
      icon: subcategory.icon,
      order: subcategory.order,
      isActive: subcategory.isActive,
      createdAt: subcategory.createdAt,
    }));
  }

  private async countVisibleProvidersByCategory(categoryIds: string[]) {
    if (categoryIds.length === 0) {
      return new Map<string, number>();
    }

    const counts = await this.prisma.providerCategory.groupBy({
      by: ["categoryId"],
      where: {
        categoryId: { in: categoryIds },
        provider: this.searchableProviderWhere(),
      },
      _count: {
        categoryId: true,
      },
    });

    return new Map(
      counts.map((item) => [item.categoryId, item._count.categoryId]),
    );
  }

  private searchableProviderWhere(): Prisma.ProviderWhereInput {
    return {
      user: {
        isActive: true,
      },
      OR: [
        { user: { visibilitySettings: null } },
        { user: { visibilitySettings: { appearInSearch: true } } },
      ],
    };
  }
}
