import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { searchableProviderWhere } from "../providers/provider-visibility";
import { buildTree, countMap, rollUp, subcategorySelect, treeOrder } from "./category-tree";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async tree() {
    const [categories, subcategories, providerGroups] = await Promise.all([
      this.prisma.category.findMany({ where: { isActive: true }, orderBy: treeOrder }),
      this.prisma.subcategory.findMany({ select: subcategorySelect, orderBy: treeOrder }),
      this.prisma.provider.groupBy({
        by: ["subcategoryId"],
        where: searchableProviderWhere(),
        _count: { _all: true },
      }),
    ]);

    const counts = rollUp(
      subcategories,
      countMap(providerGroups.map((group) => ({ key: group.subcategoryId, count: group._count._all }))),
    );

    return {
      items: buildTree(categories, subcategories, {
        activeOnly: true,
        category: (category) => ({
          icon: category.icon,
          color: category.color,
          image: category.image,
          providerCount: counts.byCategory.get(category.id) ?? 0,
        }),
        subcategory: (sub) => ({
          icon: sub.icon,
          color: null,
          image: null,
          providerCount: counts.bySubcategory.get(sub.id) ?? 0,
        }),
      }),
    };
  }
}
