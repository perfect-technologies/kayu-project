import { HttpStatus, Injectable } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import type { BlocksQuery } from "../../common/contract";
import { apiError, notFound } from "../../common/http/errors";
import { pageArgs, toPage } from "../../common/http/pagination";
import { fullName } from "../../common/util/people";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class BlocksService {
  constructor(private readonly prisma: PrismaService) {}

  async block(actor: Actor, userId: string) {
    if (userId === actor.id) {
      throw apiError(HttpStatus.BAD_REQUEST, "SELF_ACTION", "Vous ne pouvez pas vous bloquer vous-même.");
    }
    const target = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!target) throw notFound("Utilisateur introuvable");

    const block = await this.prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: actor.id, blockedId: userId } },
      create: { blockerId: actor.id, blockedId: userId },
      update: {},
    });
    return { userId: block.blockedId, createdAt: block.createdAt };
  }

  async unblock(actor: Actor, userId: string) {
    await this.prisma.block.deleteMany({ where: { blockerId: actor.id, blockedId: userId } });
    return { ok: true as const };
  }

  async list(actor: Actor, query: BlocksQuery) {
    const where = { blockerId: actor.id };
    const [total, rows] = await Promise.all([
      this.prisma.block.count({ where }),
      this.prisma.block.findMany({
        where,
        include: { blocked: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
        orderBy: [{ createdAt: "desc" }, { blockedId: "asc" }],
        ...pageArgs(query),
      }),
    ]);
    return toPage(
      rows.map((row) => ({
        user: { id: row.blocked.id, name: fullName(row.blocked), avatar: row.blocked.avatar },
        createdAt: row.createdAt,
      })),
      total,
      query,
    );
  }
}
