import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { User } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import { PrismaService } from "../../database/prisma.service";
import { ProvidersService } from "../providers/providers.service";

export type ProviderDraftSkillInput = {
  name: string;
  level?: number;
};

export type ProviderDraftInput = {
  onboardingStep?: number;

  firstName?: string;
  lastName?: string;
  phone?: string;
  idFrontUploaded?: boolean;
  idBackUploaded?: boolean;

  primaryCategoryId?: string;
  subcategoryIds?: string[];
  profession?: string;
  skills?: ProviderDraftSkillInput[];
  yearsOfExperience?: number;
  description?: string;

  serviceZones?: Array<{ city: string; commune?: string | null }>;
  zoneRadiusKm?: number;

  hourlyRate?: number;
  visitFee?: number;

  avatar?: string;
  bio?: string;
  languages?: string[];
};

type OverflowDraft = {
  idFrontUploaded?: boolean;
  idBackUploaded?: boolean;
  primaryCategoryId?: string;
  subcategoryIds?: string[];
  zoneRadiusKm?: number;
  visitFee?: number;
  bio?: string;
  languages?: string[];
};

const OVERFLOW_KEYS: (keyof OverflowDraft)[] = [
  "idFrontUploaded",
  "idBackUploaded",
  "primaryCategoryId",
  "subcategoryIds",
  "zoneRadiusKm",
  "visitFee",
  "bio",
  "languages",
];

type ProviderDraftRecord = Prisma.ProviderGetPayload<{
  include: {
    categories: true;
    skills: true;
    serviceZones: true;
    trades: {
      include: {
        trade: {
          select: {
            subcategoryId: true;
          };
        };
      };
    };
  };
}>;

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providers: ProvidersService,
  ) {}

  async getDraft(actor: Actor) {
    const state = await this.loadState(actor.id);
    return this.buildDraftResponse(state);
  }

  async patchDraft(actor: Actor, body: ProviderDraftInput) {
    const existing = await this.loadState(actor.id);
    const overflow = this.extractOverflow(existing.user.onboardingDraft);
    const nextOverflow = this.mergeOverflow(overflow, body);

    const userData: Prisma.UserUpdateInput = {};
    if (body.firstName !== undefined) userData.firstName = body.firstName || null;
    if (body.lastName !== undefined) userData.lastName = body.lastName || null;
    if (body.phone !== undefined) userData.phone = body.phone || null;
    if (body.avatar !== undefined) {
      userData.avatar =
        body.avatar && !this.isPlaceholderAvatar(body.avatar) ? body.avatar : null;
    }
    if (body.onboardingStep !== undefined) {
      userData.onboardingStep = body.onboardingStep;
    }
    if (!this.shallowEqual(overflow, nextOverflow)) {
      userData.onboardingDraft =
        Object.keys(nextOverflow).length > 0
          ? (nextOverflow as Prisma.InputJsonValue)
          : Prisma.JsonNull;
    }

    const needsProviderTouch =
      body.primaryCategoryId !== undefined ||
      body.subcategoryIds !== undefined ||
      body.profession !== undefined ||
      body.skills !== undefined ||
      body.yearsOfExperience !== undefined ||
      body.description !== undefined ||
      body.serviceZones !== undefined ||
      body.hourlyRate !== undefined;

    await this.prisma.$transaction(async (tx) => {
      if (Object.keys(userData).length > 0) {
        await tx.user.update({ where: { id: actor.id }, data: userData });
      }

      if (!needsProviderTouch) return;

      const provider =
        existing.provider ??
        (await tx.provider.create({
          data: {
            userId: actor.id,
            profession: body.profession?.trim() ?? "",
          },
          include: draftProviderInclude,
        }));

      const providerData: Prisma.ProviderUpdateInput = {};
      if (body.profession !== undefined) {
        providerData.profession = body.profession.trim();
      }
      if (body.description !== undefined) {
        providerData.description = body.description || null;
      }
      if (body.yearsOfExperience !== undefined) {
        providerData.experience = body.yearsOfExperience;
      }
      if (body.hourlyRate !== undefined) {
        providerData.hourlyRate = body.hourlyRate;
      }
      if (Object.keys(providerData).length > 0) {
        await tx.provider.update({
          where: { id: provider.id },
          data: providerData,
        });
      }

      if (body.primaryCategoryId !== undefined) {
        await tx.providerCategory.deleteMany({
          where: { providerId: provider.id },
        });
        if (body.primaryCategoryId) {
          await tx.providerCategory.create({
            data: {
              providerId: provider.id,
              categoryId: body.primaryCategoryId,
            },
          });
        }
      }

      if (body.skills !== undefined) {
        const normalizedSkills = this.uniqueSkills(body.skills);
        await tx.skill.deleteMany({ where: { providerId: provider.id } });
        if (normalizedSkills.length > 0) {
          await tx.skill.createMany({
            data: normalizedSkills.map((skill) => ({
              providerId: provider.id,
              name: skill.name,
              level: skill.level ?? 3,
            })),
          });
        }
      }

      if (body.subcategoryIds !== undefined) {
        const tradeIds = await this.resolveDraftTradeIds(tx, body.subcategoryIds);
        await this.replaceProviderTrades(tx, provider.id, tradeIds, {
          experience: body.yearsOfExperience ?? provider.experience,
        });
      }

      if (body.serviceZones !== undefined) {
        const normalizedZones = this.uniqueZones(body.serviceZones);
        await tx.serviceZone.deleteMany({ where: { providerId: provider.id } });
        if (normalizedZones.length > 0) {
          await tx.serviceZone.createMany({
            data: normalizedZones.map((zone) => ({
              providerId: provider.id,
              city: zone.city,
              commune: zone.commune ?? null,
            })),
          });
        }
      }
    });

    const next = await this.loadState(actor.id);
    return this.buildDraftResponse(next);
  }

  async publish(actor: Actor) {
    const state = await this.loadState(actor.id);
    const draft = this.buildDraftDto(state);
    const missing = this.validateForPublish(state, draft);

    if (missing.length > 0) {
      throw new BadRequestException({
        message: "Incomplete provider profile",
        missing,
      });
    }

    const overflow = this.extractOverflow(state.user.onboardingDraft);
    const primaryCategoryId = draft.primaryCategoryId ?? overflow.primaryCategoryId;
    const primaryCategory = primaryCategoryId
      ? await this.prisma.category.findFirst({
          where: { id: primaryCategoryId, isActive: true },
          select: { id: true, name: true },
        })
      : null;
    const normalizedPhone = this.normalizePhone(state.user.phone);
    const normalizedZones = this.uniqueZones(draft.serviceZones ?? []);
    const profession =
      draft.profession?.trim() || state.provider?.profession?.trim() || "";

    if (!profession || !primaryCategory || !normalizedPhone || normalizedZones.length === 0) {
      throw new BadRequestException({
        message: "Incomplete provider profile",
        missing: [
          ...(!normalizedPhone ? ["phone"] : []),
          ...(!profession ? ["profession"] : []),
          ...(!primaryCategory ? ["primaryCategoryId"] : []),
          ...(normalizedZones.length === 0 ? ["serviceZones"] : []),
        ],
      });
    }

    const publishedAt = new Date();
    await this.prisma.$transaction(async (tx) => {
      const provider = state.provider
        ? await tx.provider.update({
            where: { id: state.provider.id },
            data: {
              profession,
              description: draft.description || null,
              experience: draft.yearsOfExperience,
              hourlyRate: draft.hourlyRate,
              verificationStatus: state.provider.verificationStatus ?? "PENDING",
              onboardingCompleteAt: publishedAt,
            },
            select: { id: true },
          })
        : await tx.provider.create({
            data: {
              userId: actor.id,
              profession,
              description: draft.description,
              experience: draft.yearsOfExperience,
              hourlyRate: draft.hourlyRate,
              verificationStatus: "PENDING",
              onboardingCompleteAt: publishedAt,
            },
            select: { id: true },
          });

      await this.syncProviderLaunchFields(tx, provider.id, draft, {
        categoryId: primaryCategory.id,
      });

      await tx.user.update({
        where: { id: actor.id },
        data: {
          role: "PROVIDER",
          roleSelectedAt: state.user.roleSelectedAt ?? publishedAt,
          onboardingStep: null,
          onboardingDraft: Prisma.JsonNull,
          avatar: this.isPlaceholderAvatar(state.user.avatar)
            ? null
            : state.user.avatar,
          phone: normalizedPhone,
        },
      });
    });

    const provider = await this.prisma.provider.findUniqueOrThrow({
      where: { userId: actor.id },
      select: { id: true },
    });

    const detail = await this.providers.findById(provider.id, state.user);
    const { success: _success, ...rest } = detail;

    return {
      success: true as const,
      provider: rest,
    };
  }

  private async loadState(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { provider: { include: draftProviderInclude } },
    });
    if (!user) throw new NotFoundException("User not found");
    return {
      user,
      provider: user.provider,
    };
  }

  private buildDraftResponse(state: {
    user: User & { onboardingDraft: Prisma.JsonValue };
    provider: ProviderDraftRecord | null;
  }) {
    const draft = this.buildDraftDto(state);
    const missingForPublish = this.validateForPublish(state, draft);
    const isComplete = Boolean(state.provider?.onboardingCompleteAt);
    const step = isComplete ? null : (state.user.onboardingStep ?? 0);
    return {
      draft,
      step,
      isComplete,
      missingForPublish,
    };
  }

  private buildDraftDto(state: {
    user: User;
    provider: ProviderDraftRecord | null;
  }): ProviderDraftInput {
    const overflow = this.extractOverflow(
      (state.user as User & { onboardingDraft: Prisma.JsonValue }).onboardingDraft,
    );
    const draft: ProviderDraftInput = {
      onboardingStep: state.user.onboardingStep ?? undefined,
      firstName: state.user.firstName ?? undefined,
      lastName: state.user.lastName ?? undefined,
      phone: state.user.phone ?? undefined,
      avatar: state.user.avatar ?? undefined,
      idFrontUploaded: overflow.idFrontUploaded,
      idBackUploaded: overflow.idBackUploaded,
      primaryCategoryId: overflow.primaryCategoryId,
      subcategoryIds: overflow.subcategoryIds,
      zoneRadiusKm: overflow.zoneRadiusKm,
      visitFee: overflow.visitFee,
      bio: overflow.bio,
      languages: overflow.languages,
    };

    if (state.provider) {
      draft.profession = state.provider.profession?.trim() || undefined;
      draft.description = state.provider.description ?? undefined;
      draft.yearsOfExperience = state.provider.experience ?? undefined;
      draft.hourlyRate = state.provider.hourlyRate ?? undefined;
      draft.skills = state.provider.skills.map((skill) => ({
        name: skill.name,
        level: skill.level,
      }));
      draft.serviceZones = state.provider.serviceZones.map((zone) => ({
        city: zone.city,
        commune: zone.commune,
      }));
      if (!draft.primaryCategoryId && state.provider.categories.length > 0) {
        draft.primaryCategoryId = state.provider.categories[0]?.categoryId;
      }
      if (!draft.subcategoryIds && state.provider.trades.length > 0) {
        draft.subcategoryIds = [
          ...new Set(
            state.provider.trades
              .map((item) => item.trade.subcategoryId)
              .filter((id): id is string => Boolean(id)),
          ),
        ];
      }
      if (!draft.profession && overflow.bio && state.provider.description) {
        draft.profession = state.provider.description;
        draft.description = overflow.bio;
      }
    }

    return draft;
  }

  private validateForPublish(
    state: { user: User; provider: ProviderDraftRecord | null },
    draft: ProviderDraftInput,
  ): string[] {
    const missing: string[] = [];
    if (!draft.firstName || draft.firstName.trim().length < 2) missing.push("firstName");
    if (!draft.lastName || draft.lastName.trim().length < 2) missing.push("lastName");
    if (!this.normalizePhone(draft.phone)) missing.push("phone");
    if (!draft.profession || draft.profession.trim().length < 2) missing.push("profession");
    if (!draft.primaryCategoryId) missing.push("primaryCategoryId");
    if (!draft.serviceZones || draft.serviceZones.length === 0) missing.push("serviceZones");
    if (!draft.hourlyRate || draft.hourlyRate <= 0) missing.push("hourlyRate");
    return missing;
  }

  private extractOverflow(value: Prisma.JsonValue | undefined | null): OverflowDraft {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const record = value as Record<string, unknown>;
    const out: OverflowDraft = {};
    for (const key of OVERFLOW_KEYS) {
      if (record[key] !== undefined) {
        (out as Record<string, unknown>)[key] = record[key];
      }
    }
    return out;
  }

  private mergeOverflow(
    previous: OverflowDraft,
    patch: ProviderDraftInput,
  ): OverflowDraft {
    const next: OverflowDraft = { ...previous };
    for (const key of OVERFLOW_KEYS) {
      if (key in patch) {
        const value = (patch as Record<string, unknown>)[key];
        if (value === undefined || value === null || value === "") {
          delete (next as Record<string, unknown>)[key];
        } else {
          (next as Record<string, unknown>)[key] = value;
        }
      }
    }
    return next;
  }

  private shallowEqual(a: OverflowDraft, b: OverflowDraft) {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (const key of ka) {
      if (JSON.stringify((a as Record<string, unknown>)[key]) !==
        JSON.stringify((b as Record<string, unknown>)[key])) {
        return false;
      }
    }
    return true;
  }

  private uniqueSkills(skills: ProviderDraftSkillInput[]): ProviderDraftSkillInput[] {
    const seen = new Set<string>();
    return skills
      .map((skill) => ({ name: skill.name.trim(), level: skill.level }))
      .filter((skill) => {
        if (!skill.name) return false;
        const key = skill.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  private uniqueZones(
    zones: NonNullable<ProviderDraftInput["serviceZones"]>,
  ): NonNullable<ProviderDraftInput["serviceZones"]> {
    const seen = new Set<string>();
    return zones
      .map((zone) => ({
        city: zone.city.trim(),
        commune: zone.commune?.trim() || null,
      }))
      .filter((zone) => {
        const key = `${zone.city.toLowerCase()}:${zone.commune?.toLowerCase() ?? ""}`;
        if (!zone.city) return false;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  private uniqueIds(ids: string[] | undefined): string[] {
    if (!ids) return [];
    return [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  }

  private normalizePhone(value: string | null | undefined): string | null {
    if (!value) return null;

    const trimmed = value.trim();
    if (!trimmed) return null;

    if (/^\+243\d{9}$/.test(trimmed)) {
      return trimmed;
    }

    const digits = trimmed.replace(/\D/g, "");
    if (digits.length === 9) {
      return `+243${digits}`;
    }

    if (digits.length === 12 && digits.startsWith("243")) {
      return `+${digits}`;
    }

    return null;
  }

  private async syncProviderLaunchFields(
    tx: Prisma.TransactionClient,
    providerId: string,
    draft: ProviderDraftInput,
    options: { categoryId: string },
  ) {
    await tx.providerCategory.deleteMany({ where: { providerId } });
    await tx.providerCategory.create({
      data: {
        providerId,
        categoryId: options.categoryId,
      },
    });

    const skills = this.uniqueSkills(draft.skills ?? []);
    await tx.skill.deleteMany({ where: { providerId } });
    if (skills.length > 0) {
      await tx.skill.createMany({
        data: skills.map((skill) => ({
          providerId,
          name: skill.name,
          level: skill.level ?? 3,
        })),
      });
    }

    const zones = this.uniqueZones(draft.serviceZones ?? []);
    await tx.serviceZone.deleteMany({ where: { providerId } });
    if (zones.length > 0) {
      await tx.serviceZone.createMany({
        data: zones.map((zone) => ({
          providerId,
          city: zone.city,
          commune: zone.commune,
        })),
      });
    }

    const tradeIds = await this.resolveDraftTradeIds(tx, draft.subcategoryIds);
    await this.replaceProviderTrades(tx, providerId, tradeIds, {
      experience: draft.yearsOfExperience,
    });

    await tx.trustScore.upsert({
      where: { providerId },
      create: { providerId },
      update: {},
    });
  }

  private async resolveDraftTradeIds(
    tx: Prisma.TransactionClient,
    subcategoryOrTradeIds: string[] | undefined,
  ): Promise<string[]> {
    const ids = this.uniqueIds(subcategoryOrTradeIds);
    if (ids.length === 0) return [];

    const trades = await tx.trade.findMany({
      where: {
        isActive: true,
        OR: [
          { id: { in: ids } },
          {
            subcategoryId: { in: ids },
            subcategory: { isActive: true },
          },
        ],
      },
      select: {
        id: true,
        subcategoryId: true,
        order: true,
      },
      orderBy: [{ order: "asc" }, { id: "asc" }],
    });

    const inputOrder = new Map(ids.map((id, index) => [id, index]));
    return trades
      .sort((left, right) => {
        const leftRank =
          inputOrder.get(left.id) ??
          inputOrder.get(left.subcategoryId) ??
          Number.MAX_SAFE_INTEGER;
        const rightRank =
          inputOrder.get(right.id) ??
          inputOrder.get(right.subcategoryId) ??
          Number.MAX_SAFE_INTEGER;
        if (leftRank !== rightRank) return leftRank - rightRank;
        return (left.order ?? 0) - (right.order ?? 0);
      })
      .map((trade) => trade.id)
      .filter((id, index, all) => all.indexOf(id) === index)
      .slice(0, 3);
  }

  private async replaceProviderTrades(
    tx: Prisma.TransactionClient,
    providerId: string,
    tradeIds: string[],
    options: { experience?: number | null },
  ) {
    await tx.providerTrade.deleteMany({ where: { providerId } });
    if (tradeIds.length === 0) return;

    await tx.providerTrade.createMany({
      data: tradeIds.map((tradeId, index) => ({
        providerId,
        tradeId,
        isPrimary: index === 0,
        experience: options.experience ?? null,
      })),
    });
  }

  private isPlaceholderAvatar(value: string | null | undefined): boolean {
    return typeof value === "string" && value.startsWith("placeholder://");
  }
}

const draftProviderInclude = {
  categories: true,
  skills: true,
  serviceZones: true,
  trades: {
    include: {
      trade: {
        select: {
          subcategoryId: true,
        },
      },
    },
  },
} satisfies Prisma.ProviderInclude;
