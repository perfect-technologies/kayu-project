import { Injectable } from "@nestjs/common";
import type { Prisma, ReferenceItem } from "@prisma/client";
import type { ReferencesQuery } from "../../common/contract";
import { pageArgs, toPage } from "../../common/http/pagination";
import { PrismaService } from "../../database/prisma.service";

export type ReferenceSummary = Pick<ReferenceItem, "id" | "type" | "label" | "categoryId">;

export const referenceSummarySelect = {
  id: true,
  type: true,
  label: true,
  categoryId: true,
} satisfies Prisma.ReferenceItemSelect;

export function referenceLabelWhere(q: string): Prisma.ReferenceItemWhereInput {
  return { OR: [{ label: { contains: q, mode: "insensitive" } }, { aliases: { has: q } }] };
}

@Injectable()
export class ReferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ReferencesQuery) {
    const and: Prisma.ReferenceItemWhereInput[] = [
      { type: query.type, active: true, suggested: true, mergedIntoId: null },
    ];
    if (query.categoryId) and.push({ OR: [{ categoryId: query.categoryId }, { categoryId: null }] });
    if (query.q) and.push(referenceLabelWhere(query.q));
    const where: Prisma.ReferenceItemWhereInput = { AND: and };

    const [total, items] = await Promise.all([
      this.prisma.referenceItem.count({ where }),
      this.prisma.referenceItem.findMany({
        where,
        select: referenceSummarySelect,
        orderBy: [{ order: "asc" }, { label: "asc" }, { id: "asc" }],
        ...pageArgs(query),
      }),
    ]);
    return toPage<ReferenceSummary>(items, total, query);
  }
}
