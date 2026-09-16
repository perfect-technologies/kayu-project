import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

type BlockClient = Pick<Prisma.TransactionClient, "block">;

@Injectable()
export class SafetyService {
  constructor(private readonly prisma: PrismaService) {}

  async isBlocked(a: string, b: string, client: BlockClient = this.prisma): Promise<boolean> {
    if (a === b) return false;
    const block = await client.block.findFirst({
      where: {
        OR: [
          { blockerId: a, blockedId: b },
          { blockerId: b, blockedId: a },
        ],
      },
      select: { blockerId: true },
    });
    return Boolean(block);
  }

  async blockedUserIds(userId: string, client: BlockClient = this.prisma): Promise<string[]> {
    const rows = await client.block.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockerId: true, blockedId: true },
    });
    return [
      ...new Set(rows.map((row) => (row.blockerId === userId ? row.blockedId : row.blockerId))),
    ];
  }
}
