import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import { PrismaService } from "../../database/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

type CreateJobRequestInput = {
  categoryId?: string;
  subcategoryId?: string;
  service: string;
  description: string;
  address: string;
  city: string;
  commune?: string;
  latitude?: number;
  longitude?: number;
  whenPref: string;
  estimatedHours?: number;
  budget?: number;
  urgent?: boolean;
  photoCount?: number;
};

const clientUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  avatar: true,
  clientScore: true,
} satisfies Prisma.UserSelect;

const categorySummarySelect = {
  id: true,
  name: true,
  slug: true,
  icon: true,
  color: true,
} satisfies Prisma.CategorySelect;

const jobRequestInclude = {
  client: { select: clientUserSelect },
  category: { select: categorySummarySelect },
} satisfies Prisma.JobRequestInclude;

type JobRequestRecord = Prisma.JobRequestGetPayload<{
  include: typeof jobRequestInclude;
}>;

type MatchRecord = Prisma.JobRequestMatchGetPayload<{
  include: {
    jobRequest: {
      include: typeof jobRequestInclude;
    };
  };
}>;

const MATCH_FANOUT_LIMIT = 10;

@Injectable()
export class JobRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(actor: Actor, input: CreateJobRequestInput) {
    if (actor.role !== "CLIENT" && actor.role !== "ADMIN") {
      throw new ForbiddenException("Only clients can create job requests");
    }

    const request = await this.prisma.$transaction(async (tx) => {
      const created = await tx.jobRequest.create({
        data: {
          clientId: actor.id,
          categoryId: input.categoryId ?? null,
          subcategoryId: input.subcategoryId ?? null,
          service: input.service,
          description: input.description,
          address: input.address,
          city: input.city,
          commune: input.commune ?? null,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          whenPref: input.whenPref,
          estimatedHours: input.estimatedHours ?? null,
          budget: input.budget ?? null,
          urgent: input.urgent ?? false,
          photoCount: input.photoCount ?? 0,
          status: "OPEN",
        },
        include: jobRequestInclude,
      });

      const candidates = await this.findMatchingProviders(tx, {
        categoryId: input.categoryId ?? null,
        city: input.city,
      });

      if (candidates.length > 0) {
        await tx.jobRequestMatch.createMany({
          data: candidates.map((candidate, index) => ({
            jobRequestId: created.id,
            providerId: candidate.providerId,
            matchScore: scoreForRank(index),
          })),
        });

        await tx.jobRequest.update({
          where: { id: created.id },
          data: { competingCount: candidates.length },
        });

        await this.notifications.createMany(
          candidates.map((candidate) => ({
            userId: candidate.userId,
            type: "JOB_REQUEST_NEW",
            title: "Nouvelle demande",
            message: `Une demande « ${input.service} » attend votre devis`,
            data: { requestId: created.id } as Prisma.InputJsonValue,
          })),
          tx,
        );
      }

      return tx.jobRequest.findUniqueOrThrow({
        where: { id: created.id },
        include: jobRequestInclude,
      });
    });

    return {
      success: true as const,
      request: await this.mapRequest(request),
    };
  }

  async mine(actor: Actor) {
    const requests = await this.prisma.jobRequest.findMany({
      where: { clientId: actor.id },
      orderBy: { createdAt: "desc" },
      include: jobRequestInclude,
    });

    const mapped = await Promise.all(requests.map((r) => this.mapRequest(r)));

    return { success: true as const, requests: mapped };
  }

  async cancel(actor: Actor, id: string) {
    const request = await this.prisma.jobRequest.findUnique({ where: { id } });

    if (!request) {
      throw new NotFoundException("Job request not found");
    }

    if (request.clientId !== actor.id && actor.role !== "ADMIN") {
      throw new ForbiddenException("You can only cancel your own requests");
    }

    if (request.status !== "OPEN") {
      throw new BadRequestException("Only open requests can be cancelled");
    }

    await this.prisma.jobRequest.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return { success: true as const };
  }

  async inbox(actor: Actor) {
    const provider = await this.getProviderForActor(actor);

    const matches = await this.prisma.jobRequestMatch.findMany({
      where: {
        providerId: provider.id,
        dismissedAt: null,
        jobRequest: {
          status: "OPEN",
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      },
      include: {
        jobRequest: { include: jobRequestInclude },
      },
      orderBy: [
        { jobRequest: { urgent: "desc" } },
        { notifiedAt: "desc" },
      ],
    });

    const mapped = await Promise.all(matches.map((m) => this.mapMatch(m)));

    return { success: true as const, requests: mapped };
  }

  async getForPro(actor: Actor, id: string) {
    const provider = await this.getProviderForActor(actor);

    const match = await this.prisma.jobRequestMatch.findUnique({
      where: {
        jobRequestId_providerId: {
          jobRequestId: id,
          providerId: provider.id,
        },
      },
      include: {
        jobRequest: { include: jobRequestInclude },
      },
    });

    if (!match) {
      throw new NotFoundException("Job request not found");
    }

    if (!match.viewedAt) {
      await this.prisma.jobRequestMatch.update({
        where: { id: match.id },
        data: { viewedAt: new Date() },
      });
    }

    return {
      success: true as const,
      request: await this.mapMatch(match),
    };
  }

  async dismiss(actor: Actor, id: string) {
    const provider = await this.getProviderForActor(actor);

    const match = await this.prisma.jobRequestMatch.findUnique({
      where: {
        jobRequestId_providerId: {
          jobRequestId: id,
          providerId: provider.id,
        },
      },
    });

    if (!match) {
      throw new NotFoundException("Job request not found");
    }

    if (!match.dismissedAt) {
      await this.prisma.jobRequestMatch.update({
        where: { id: match.id },
        data: { dismissedAt: new Date() },
      });
    }

    return { success: true as const };
  }

  async topMatchesForDashboard(providerId: string, take = 3) {
    const matches = await this.prisma.jobRequestMatch.findMany({
      where: {
        providerId,
        dismissedAt: null,
        jobRequest: {
          status: "OPEN",
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      },
      include: {
        jobRequest: { include: jobRequestInclude },
      },
      orderBy: [
        { jobRequest: { urgent: "desc" } },
        { notifiedAt: "desc" },
      ],
      take,
    });

    return Promise.all(matches.map((m) => this.mapMatch(m)));
  }

  private async findMatchingProviders(
    tx: Prisma.TransactionClient,
    filters: { categoryId: string | null; city: string },
  ) {
    const providers = await tx.provider.findMany({
      where: {
        isAvailable: true,
        verificationStatus: "VERIFIED",
        ...(filters.categoryId
          ? { categories: { some: { categoryId: filters.categoryId } } }
          : {}),
        user: { city: filters.city },
      },
      orderBy: [{ totalJobs: "desc" }, { totalReviews: "desc" }],
      take: MATCH_FANOUT_LIMIT,
      select: { id: true, userId: true },
    });

    return providers.map((p) => ({ providerId: p.id, userId: p.userId }));
  }

  private async getProviderForActor(actor: Actor) {
    if (actor.role !== "PROVIDER" && actor.role !== "ADMIN") {
      throw new ForbiddenException("Provider access required");
    }

    const provider = await this.prisma.provider.findUnique({
      where: { userId: actor.id },
      select: { id: true },
    });

    if (!provider) {
      throw new BadRequestException("Provider profile is required");
    }

    return provider;
  }

  private async mapRequest(record: JobRequestRecord) {
    const clientSummary = await this.buildClientSummary(record);
    return {
      id: record.id,
      clientId: record.clientId,
      client: clientSummary,
      category: record.category
        ? {
            id: record.category.id,
            name: record.category.name,
            slug: record.category.slug,
            icon: record.category.icon,
            color: record.category.color,
          }
        : null,
      subcategoryId: record.subcategoryId,
      service: record.service,
      description: record.description,
      address: record.address,
      city: record.city,
      commune: record.commune,
      latitude: record.latitude,
      longitude: record.longitude,
      whenPref: record.whenPref,
      estimatedHours: record.estimatedHours,
      budget: record.budget,
      photoCount: record.photoCount,
      status: record.status,
      urgent: record.urgent,
      competingCount: record.competingCount,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private async mapMatch(match: MatchRecord) {
    const base = await this.mapRequest(match.jobRequest);
    return {
      ...base,
      matchScore: match.matchScore,
      notifiedAt: match.notifiedAt,
      dismissedAt: match.dismissedAt,
      viewedAt: match.viewedAt,
    };
  }

  private async buildClientSummary(record: JobRequestRecord) {
    const completedJobs = await this.prisma.booking.count({
      where: { clientId: record.clientId, status: "COMPLETED" },
    });

    const reviewAgg = await this.prisma.clientReview.aggregate({
      where: { clientId: record.clientId },
      _avg: { communication: true, respectfulness: true },
    });

    const avgCommunication = reviewAgg._avg.communication ?? null;
    const avgRespect = reviewAgg._avg.respectfulness ?? null;
    const averaged = [avgCommunication, avgRespect].filter(
      (v): v is number => typeof v === "number",
    );
    const rating = averaged.length
      ? averaged.reduce((sum, v) => sum + v, 0) / averaged.length
      : null;

    return {
      id: record.client.id,
      firstName: record.client.firstName,
      lastName: record.client.lastName,
      avatar: record.client.avatar,
      rating: rating !== null ? Math.round(rating * 10) / 10 : null,
      jobs: completedJobs,
      newClient: completedJobs === 0,
    };
  }
}

function scoreForRank(index: number) {
  return Math.max(20, 100 - index * 8);
}
