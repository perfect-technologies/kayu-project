import { HttpStatus, Injectable } from "@nestjs/common";
import type { Actor } from "../../common/auth/types";
import type { CreateReportInput } from "../../common/contract";
import { apiError, notFound } from "../../common/http/errors";
import { RateLimiterService } from "../../common/rate-limit/rate-limiter.service";
import { PrismaService } from "../../database/prisma.service";

const REPORTS_PER_HOUR = 10;
const HOUR_MS = 60 * 60 * 1000;

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly limiter: RateLimiterService,
  ) {}

  async create(actor: Actor, input: CreateReportInput) {
    this.limiter.consume("reports", actor.id, REPORTS_PER_HOUR, HOUR_MS);
    await this.assertReportable(actor, input);

    const report = await this.prisma.report.create({
      data: {
        reporterId: actor.id,
        targetKind: input.targetKind,
        targetId: input.targetId,
        reason: input.reason,
      },
    });
    return {
      id: report.id,
      targetKind: report.targetKind,
      targetId: report.targetId,
      reason: report.reason,
      status: report.status,
      createdAt: report.createdAt,
    };
  }

  private async assertReportable(actor: Actor, input: CreateReportInput): Promise<void> {
    const missing = () => notFound("Élément signalé introuvable");
    const self = () =>
      apiError(HttpStatus.BAD_REQUEST, "SELF_ACTION", "Vous ne pouvez pas vous signaler vous-même.");
    const participantOf = { OR: [{ clientId: actor.id }, { provider: { userId: actor.id } }] };

    switch (input.targetKind) {
      case "USER": {
        if (input.targetId === actor.id) throw self();
        const user = await this.prisma.user.findUnique({ where: { id: input.targetId }, select: { id: true } });
        if (!user) throw missing();
        return;
      }
      case "PROVIDER": {
        const provider = await this.prisma.provider.findUnique({
          where: { id: input.targetId },
          select: { userId: true },
        });
        if (!provider) throw missing();
        if (provider.userId === actor.id) throw self();
        return;
      }
      case "REVIEW": {
        const review = await this.prisma.review.findUnique({ where: { id: input.targetId }, select: { id: true } });
        if (!review) throw missing();
        return;
      }
      case "MESSAGE": {
        const message = await this.prisma.message.findFirst({
          where: { id: input.targetId, conversation: participantOf },
          select: { id: true },
        });
        if (!message) throw missing();
        return;
      }
      case "CONVERSATION": {
        const conversation = await this.prisma.conversation.findFirst({
          where: { id: input.targetId, ...participantOf },
          select: { id: true },
        });
        if (!conversation) throw missing();
        return;
      }
    }
  }
}
