import { HttpStatus, Injectable } from "@nestjs/common";
import type { MediaKind, Prisma, ReferenceType } from "@prisma/client";
import type { Actor } from "../../common/auth/types";
import {
  MEDIA_LIMITS,
  type MediaInput,
  type PublishProviderInput,
  type ScheduleInput,
  type UpdateProviderInput,
} from "../../common/contract";
import { apiError, notFound } from "../../common/http/errors";
import { isUniqueViolation, lockRow } from "../../common/util/db";
import { PrismaService } from "../../database/prisma.service";
import { PlaceTreeService } from "../places/place-tree.service";
import { StorageService, type StoredObject } from "../storage/storage.service";
import { mediaSelect, scheduleSelect, toMedia, toSchedule } from "./provider-mapper";
import { ProvidersService } from "./providers.service";
import { normalizeRules } from "./schedule";
import { parseYouTubeUrl } from "./youtube";

type Tx = Prisma.TransactionClient;

type ResolvedMedia = {
  id?: string;
  kind: MediaKind;
  url: string;
  storagePath: string | null;
  youtubeId: string | null;
  title: string | null;
  order: number;
};

type ExistingMedia = { id: string; kind: MediaKind; url: string; storagePath: string | null; youtubeId: string | null; title: string | null };

const SOCIAL_HOSTS = {
  youtubeUrl: ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"],
  instagramUrl: ["instagram.com", "www.instagram.com"],
  tiktokUrl: ["tiktok.com", "www.tiktok.com", "vm.tiktok.com"],
  facebookUrl: ["facebook.com", "www.facebook.com", "m.facebook.com", "fb.com"],
} as const;

type SocialKey = keyof typeof SOCIAL_HOSTS;

const invalidReference = (message: string) =>
  apiError(HttpStatus.BAD_REQUEST, "INVALID_REFERENCE", message);
const invalidMedia = (message: string) => apiError(HttpStatus.BAD_REQUEST, "INVALID_MEDIA", message);

@Injectable()
export class ProviderEditorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly places: PlaceTreeService,
    private readonly storage: StorageService,
    private readonly providers: ProvidersService,
  ) {}

  async publish(actor: Actor, input: PublishProviderInput) {
    const existing = await this.prisma.provider.findUnique({
      where: { userId: actor.id },
      select: { id: true },
    });
    if (existing) throw this.alreadyExists();

    const subcategory = await this.assertDeepestSubcategory(input.subcategoryId);
    await this.places.assertSelectable(input.placeId);
    await this.assertReferences(input.skillIds, "SKILL", subcategory.categoryId);
    await this.assertReferences(input.languageIds, "LANGUAGE");
    await this.assertReferences(input.modeIds, "INTERVENTION_MODE");
    if (input.pricing) await this.assertPricing(input.pricing);
    const social = this.resolveSocial(input.social);
    const profilePhoto = this.resolveProfilePhoto(input.profilePhoto, actor, null);
    const media = this.resolveMedia(input.media, actor.id, []);

    const now = new Date();
    let providerId: string;
    try {
      providerId = await this.prisma.$transaction(async (tx) => {
        const provider = await tx.provider.create({
          data: {
            userId: actor.id,
            displayName: input.displayName,
            description: input.description ?? null,
            yearsExperience: input.yearsExperience ?? null,
            phone: input.phone,
            whatsapp: input.whatsapp ?? null,
            email: input.email ?? null,
            profilePhoto: profilePhoto ?? null,
            subcategoryId: input.subcategoryId,
            placeId: input.placeId,
            addressLine: input.addressLine ?? null,
            latitude: input.latitude ?? null,
            longitude: input.longitude ?? null,
            freeSkills: this.normalizeFreeSkills(input.freeSkills),
            pricingAmount: input.pricing?.amount ?? null,
            pricingCurrencyId: input.pricing?.currencyId ?? null,
            pricingUnitId: input.pricing?.unitId ?? null,
            timezone: input.schedule.timezone,
            slotDurationMin: input.schedule.slotDurationMin,
            slotBufferMin: input.schedule.slotBufferMin,
            ...social,
            publishedAt: now,
            skills: { create: input.skillIds.map((itemId) => ({ itemId })) },
            references: {
              create: [
                ...input.languageIds.map((itemId) => ({ itemId, kind: "LANGUAGE" as const })),
                ...input.modeIds.map((itemId) => ({ itemId, kind: "INTERVENTION_MODE" as const })),
              ],
            },
            media: {
              create: media.map(({ id: _id, ...item }) => item),
            },
            availabilityRules: { create: normalizeRules(input.schedule.rules) },
            availabilityExceptions: { create: this.exceptionRows(input.schedule) },
          },
          select: { id: true },
        });

        await tx.user.update({
          where: { id: actor.id },
          data: {
            role: "PROVIDER",
            roleSelectedAt: now,
            ...(actor.termsAcceptedAt ? {} : { termsAcceptedAt: now }),
          },
        });

        return provider.id;
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw this.alreadyExists();
      throw error;
    }

    return this.providers.getPublicProfile(providerId, { ...actor, role: "PROVIDER" });
  }

  async update(actor: Actor, input: UpdateProviderInput) {
    const current = await this.loadOwnProvider(actor);

    let categoryId = current.subcategory.categoryId;
    if (input.subcategoryId !== undefined && input.subcategoryId !== current.subcategoryId) {
      categoryId = (await this.assertDeepestSubcategory(input.subcategoryId)).categoryId;
    }
    if (input.placeId !== undefined && input.placeId !== current.placeId) {
      await this.places.assertSelectable(input.placeId);
    }
    if (input.skillIds) await this.assertReferences(input.skillIds, "SKILL", categoryId);
    if (input.languageIds) await this.assertReferences(input.languageIds, "LANGUAGE");
    if (input.modeIds) await this.assertReferences(input.modeIds, "INTERVENTION_MODE");
    if (input.pricing) await this.assertPricing(input.pricing);
    const social = this.resolveSocial(input.social);
    const profilePhoto = this.resolveProfilePhoto(input.profilePhoto, actor, current.profilePhoto);

    const data: Prisma.ProviderUncheckedUpdateInput = { ...social };
    const scalarKeys = [
      "displayName",
      "phone",
      "whatsapp",
      "email",
      "yearsExperience",
      "description",
      "subcategoryId",
      "placeId",
      "addressLine",
      "latitude",
      "longitude",
    ] as const;
    for (const key of scalarKeys) {
      if (input[key] !== undefined) (data as Record<string, unknown>)[key] = input[key];
    }
    if (input.freeSkills !== undefined) data.freeSkills = this.normalizeFreeSkills(input.freeSkills);
    if (profilePhoto !== undefined) data.profilePhoto = profilePhoto;
    if (input.pricing !== undefined) {
      data.pricingAmount = input.pricing?.amount ?? null;
      data.pricingCurrencyId = input.pricing?.currencyId ?? null;
      data.pricingUnitId = input.pricing?.unitId ?? null;
    }

    const removed = await this.prisma.$transaction(async (tx) => {
      await lockRow(tx, "Provider", current.id);
      if (Object.keys(data).length > 0) {
        await tx.provider.update({ where: { id: current.id }, data });
      }

      if (input.skillIds) {
        await tx.providerSkill.deleteMany({ where: { providerId: current.id } });
        await tx.providerSkill.createMany({
          data: input.skillIds.map((itemId) => ({ providerId: current.id, itemId })),
        });
      } else if (categoryId !== current.subcategory.categoryId) {
        await tx.providerSkill.deleteMany({
          where: {
            providerId: current.id,
            item: { AND: [{ categoryId: { not: null } }, { categoryId: { not: categoryId } }] },
          },
        });
      }
      await this.replaceReferences(tx, current.id, "LANGUAGE", input.languageIds);
      await this.replaceReferences(tx, current.id, "INTERVENTION_MODE", input.modeIds);

      if (input.schedule) await this.writeSchedule(tx, current.id, input.schedule);
      const removedMedia = input.media ? await this.writeMedia(tx, current.id, actor.id, input.media) : [];
      return removedMedia;
    });

    const replacedPhoto =
      profilePhoto !== undefined && profilePhoto !== current.profilePhoto
        ? this.ownedObject(current.profilePhoto, actor.id)
        : null;
    await this.removeAfterCommit([...removed, ...(replacedPhoto ? [replacedPhoto] : [])], actor.id);

    return this.providers.getPublicProfile(current.id, actor);
  }

  async replaceSchedule(actor: Actor, input: ScheduleInput) {
    const current = await this.loadOwnProvider(actor);
    const row = await this.prisma.$transaction(async (tx) => {
      await lockRow(tx, "Provider", current.id);
      await this.writeSchedule(tx, current.id, input);
      return tx.provider.findUniqueOrThrow({ where: { id: current.id }, select: scheduleSelect });
    });
    return toSchedule(row);
  }

  async replaceMedia(actor: Actor, items: MediaInput[]) {
    const current = await this.loadOwnProvider(actor);
    const { removed, rows } = await this.prisma.$transaction(async (tx) => {
      await lockRow(tx, "Provider", current.id);
      const removedMedia = await this.writeMedia(tx, current.id, actor.id, items);
      const saved = await tx.providerMedia.findMany({
        where: { providerId: current.id },
        select: mediaSelect,
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      });
      return { removed: removedMedia, rows: saved };
    });
    await this.removeAfterCommit(removed, actor.id);
    return { items: rows.map(toMedia) };
  }

  async setAvailability(actor: Actor, isAvailable: boolean) {
    const current = await this.loadOwnProvider(actor);
    const updated = await this.prisma.provider.update({
      where: { id: current.id },
      data: { isAvailable },
      select: { isAvailable: true },
    });
    return { isAvailable: updated.isAvailable };
  }

  private async loadOwnProvider(actor: Actor) {
    const provider = await this.prisma.provider.findUnique({
      where: { userId: actor.id },
      select: {
        id: true,
        subcategoryId: true,
        placeId: true,
        profilePhoto: true,
        subcategory: { select: { categoryId: true } },
      },
    });
    if (!provider) throw notFound("Profil prestataire introuvable");
    return provider;
  }

  private async assertDeepestSubcategory(subcategoryId: string) {
    const node = await this.prisma.subcategory.findUnique({
      where: { id: subcategoryId },
      select: {
        id: true,
        isActive: true,
        categoryId: true,
        category: { select: { isActive: true } },
        parent: { select: { isActive: true } },
        children: { where: { isActive: true }, select: { id: true }, take: 1 },
      },
    });
    if (!node || !node.isActive || !node.category.isActive || (node.parent && !node.parent.isActive)) {
      throw invalidReference("Choisissez un service valide.");
    }
    if (node.children.length > 0) {
      throw invalidReference("Choisissez la spécialité la plus précise.");
    }
    return node;
  }

  private async assertReferences(ids: string[], type: ReferenceType, categoryId?: string) {
    if (ids.length === 0) return;
    const items = await this.prisma.referenceItem.findMany({
      where: { id: { in: ids }, type, active: true, mergedIntoId: null },
      select: { id: true, categoryId: true },
    });
    const valid =
      items.length === new Set(ids).size &&
      (type !== "SKILL" || items.every((item) => !item.categoryId || item.categoryId === categoryId));
    if (!valid) throw invalidReference("Choix non reconnu.");
  }

  private async assertPricing(pricing: { currencyId: string; unitId: string }) {
    const items = await this.prisma.referenceItem.findMany({
      where: {
        OR: [
          { id: pricing.currencyId, type: "CURRENCY" },
          { id: pricing.unitId, type: "PRICE_UNIT" },
        ],
        active: true,
        mergedIntoId: null,
      },
      select: { id: true },
    });
    if (items.length !== 2) throw invalidReference("Unité ou devise invalide.");
  }

  private resolveSocial(social: UpdateProviderInput["social"]): Partial<Record<SocialKey, string | null>> {
    if (!social) return {};
    const result: Partial<Record<SocialKey, string | null>> = {};
    for (const key of Object.keys(SOCIAL_HOSTS) as SocialKey[]) {
      const value = social[key];
      if (value === undefined) continue;
      if (value === null) {
        result[key] = null;
        continue;
      }
      const host = new URL(value).hostname.toLowerCase();
      if (!(SOCIAL_HOSTS[key] as readonly string[]).includes(host)) {
        throw invalidMedia("Lien de réseau social invalide.");
      }
      result[key] = value;
    }
    return result;
  }

  private resolveProfilePhoto(
    value: string | null | undefined,
    actor: Actor,
    currentPhoto: string | null,
  ): string | null | undefined {
    if (value === undefined || value === null) return value;
    if (value.startsWith("https://")) {
      if (value === actor.avatar || value === currentPhoto) return value;
      throw invalidMedia("Photo de profil invalide.");
    }
    const parsed = this.storage.parsePath(value);
    if (!parsed || parsed.ownerId !== actor.id || (parsed.purpose !== "avatar" && parsed.purpose !== "media")) {
      throw invalidMedia("Ce fichier ne vous appartient pas.");
    }
    return this.storage.resolveStoredUrl(parsed.purpose, value);
  }

  private resolveMedia(items: MediaInput[], ownerUserId: string, existing: ExistingMedia[]): ResolvedMedia[] {
    const existingById = new Map(existing.map((row) => [row.id, row]));
    const images = items.filter((item) => item.kind === "IMAGE").length;
    if (images > MEDIA_LIMITS.maxImages || items.length - images > MEDIA_LIMITS.maxVideos) {
      throw invalidMedia("Trop de médias.");
    }

    const seenUrls = new Set<string>();
    const seenIds = new Set<string>();
    return items.map((item, order) => {
      let resolved: ResolvedMedia;
      if (item.id) {
        const row = existingById.get(item.id);
        if (!row || row.kind !== item.kind || seenIds.has(item.id)) {
          throw invalidMedia("Média introuvable.");
        }
        seenIds.add(item.id);
        resolved = {
          id: row.id,
          kind: row.kind,
          url: row.url,
          storagePath: row.storagePath,
          youtubeId: row.youtubeId,
          title: item.title !== undefined ? item.title : row.title,
          order,
        };
      } else if (item.kind === "VIDEO_YOUTUBE") {
        const parsed = parseYouTubeUrl(item.url);
        if (!parsed) throw invalidMedia("Collez un lien HTTPS vers une vidéo YouTube valide.");
        resolved = {
          kind: item.kind,
          url: parsed.watchUrl,
          storagePath: null,
          youtubeId: parsed.id,
          title: item.title ?? null,
          order,
        };
      } else {
        try {
          this.storage.assertOwnedPath("media", ownerUserId, item.path ?? "");
        } catch {
          throw invalidMedia("Ce fichier ne vous appartient pas.");
        }
        resolved = {
          kind: item.kind,
          url: this.storage.resolveStoredUrl("media", item.path!),
          storagePath: item.path!,
          youtubeId: null,
          title: item.title ?? null,
          order,
        };
      }
      if (seenUrls.has(resolved.url)) throw invalidMedia("Ce média est déjà ajouté.");
      seenUrls.add(resolved.url);
      return resolved;
    });
  }

  private async writeMedia(
    tx: Tx,
    providerId: string,
    ownerUserId: string,
    items: MediaInput[],
  ): Promise<StoredObject[]> {
    const existing = await tx.providerMedia.findMany({
      where: { providerId },
      select: { id: true, kind: true, url: true, storagePath: true, youtubeId: true, title: true },
    });
    const resolved = this.resolveMedia(items, ownerUserId, existing);
    const keptIds = resolved.map((item) => item.id).filter((id): id is string => Boolean(id));

    await tx.providerMedia.deleteMany({ where: { providerId, id: { notIn: keptIds } } });
    for (const item of resolved) {
      if (item.id) {
        await tx.providerMedia.update({
          where: { id: item.id },
          data: { order: item.order, title: item.title },
        });
      } else {
        const { id: _id, ...data } = item;
        await tx.providerMedia.create({ data: { ...data, providerId } });
      }
    }

    const stillUsed = new Set(resolved.map((item) => item.storagePath).filter(Boolean));
    return existing
      .filter((row) => !keptIds.includes(row.id) && row.storagePath && !stillUsed.has(row.storagePath))
      .map((row) => ({ purpose: "media" as const, path: row.storagePath! }));
  }

  private async writeSchedule(tx: Tx, providerId: string, schedule: ScheduleInput) {
    await tx.provider.update({
      where: { id: providerId },
      data: {
        timezone: schedule.timezone,
        slotDurationMin: schedule.slotDurationMin,
        slotBufferMin: schedule.slotBufferMin,
      },
    });
    await tx.availabilityRule.deleteMany({ where: { providerId } });
    await tx.availabilityRule.createMany({
      data: normalizeRules(schedule.rules).map((rule) => ({ ...rule, providerId })),
    });
    await tx.availabilityException.deleteMany({ where: { providerId } });
    await tx.availabilityException.createMany({
      data: this.exceptionRows(schedule).map((exception) => ({ ...exception, providerId })),
    });
  }

  private async replaceReferences(
    tx: Tx,
    providerId: string,
    kind: "LANGUAGE" | "INTERVENTION_MODE",
    ids: string[] | undefined,
  ) {
    if (!ids) return;
    await tx.providerReference.deleteMany({ where: { providerId, kind } });
    await tx.providerReference.createMany({
      data: ids.map((itemId) => ({ providerId, itemId, kind })),
    });
  }

  private exceptionRows(schedule: ScheduleInput) {
    return schedule.exceptions.map((exception) => ({
      date: new Date(`${exception.date}T00:00:00.000Z`),
      isOpen: exception.isOpen,
      startTime: exception.isOpen ? (exception.startTime ?? null) : null,
      endTime: exception.isOpen ? (exception.endTime ?? null) : null,
      reason: exception.reason ?? null,
    }));
  }

  private normalizeFreeSkills(skills: string[]): string[] {
    const seen = new Set<string>();
    return skills
      .map((skill) => skill.trim())
      .filter((skill) => {
        const key = skill.toLowerCase();
        if (!skill || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  private ownedObject(url: string | null, ownerUserId: string): StoredObject | null {
    const object = this.storage.objectFromUrl(url);
    if (!object || this.storage.parsePath(object.path)?.ownerId !== ownerUserId) return null;
    return object;
  }

  private async removeAfterCommit(objects: StoredObject[], actorId: string) {
    if (objects.length > 0) await this.storage.removeObjects(objects, actorId);
  }

  private alreadyExists() {
    return apiError(HttpStatus.CONFLICT, "ALREADY_EXISTS", "Vous avez déjà un profil prestataire.");
  }
}
