import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { LeadFormDurationBucket } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { LaunchIntakeProtectionService } from "./launch-intake-protection.service";
import type {
  CreateClientLeadInput,
  CreateProviderLeadInput,
  LaunchRequestContext,
  NormalizedAttribution,
} from "./launch-leads.types";

const ACCEPTED_RESPONSE = {
  accepted: true as const,
  message: "Merci. Votre intérêt a bien été reçu." as const,
};

@Injectable()
export class LaunchLeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly protection: LaunchIntakeProtectionService,
  ) {}

  async createProviderLead(
    input: CreateProviderLeadInput,
    context: LaunchRequestContext = {},
  ) {
    if (input.website) {
      return ACCEPTED_RESPONSE;
    }

    const now = new Date();
    const phoneE164 = normalizeKinshasaPhone(input.phone);
    this.assertPrivacyVersion(input.privacyNoticeVersion);
    this.protection.checkContact(phoneE164);

    const subcategoryIds = [
      input.primarySubcategoryId,
      ...input.additionalSubcategoryIds,
    ];
    await this.assertActiveSubcategories(subcategoryIds);

    const attribution = normalizeAttribution(input.attribution);
    const durationBucket = formDurationBucket(input.formStartedAt, now);
    const contactHash = this.requiredHash(phoneE164);
    const ipHash = this.protection.hashIdentifier(context.ip);

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.providerLead.findUnique({
        where: { phoneE164 },
        select: { id: true },
      });

      const lead = await tx.providerLead.upsert({
        where: { phoneE164 },
        create: {
          firstName: input.firstName,
          phoneE164,
          emailNormalized: input.email ?? null,
          primarySubcategoryId: input.primarySubcategoryId,
          additionalSubcategoryIds: input.additionalSubcategoryIds,
          experienceBand: input.experienceBand,
          homeCommune: input.homeCommune,
          serviceCommunes: input.serviceCommunes,
          hasWhatsApp: input.hasWhatsApp ?? null,
          summary: input.summary ?? null,
          submittedAt: now,
          lastSubmittedAt: now,
          consentAt: now,
          consentVersion: input.privacyNoticeVersion,
          operationalConsent: true,
          marketingConsent: input.marketingConsent,
          marketingConsentAt: input.marketingConsent ? now : null,
          marketingConsentVersion: input.marketingConsent
            ? input.privacyNoticeVersion
            : null,
          attributionSource: attribution.source,
          attributionMedium: attribution.medium,
          attributionCampaign: attribution.campaign,
          attributionContent: attribution.content,
          attributionReferrerHost: attribution.referrerHost,
          campaignKey: attribution.campaignKey,
          lastFormDurationBucket: durationBucket,
        },
        update: {
          firstName: input.firstName,
          emailNormalized: input.email,
          primarySubcategoryId: input.primarySubcategoryId,
          additionalSubcategoryIds: input.additionalSubcategoryIds,
          experienceBand: input.experienceBand,
          homeCommune: input.homeCommune,
          serviceCommunes: input.serviceCommunes,
          hasWhatsApp: input.hasWhatsApp,
          summary: input.summary,
          lastSubmittedAt: now,
          consentAt: now,
          consentVersion: input.privacyNoticeVersion,
          operationalConsent: true,
          marketingConsent: input.marketingConsent ? true : undefined,
          marketingConsentAt: input.marketingConsent ? now : undefined,
          marketingConsentVersion: input.marketingConsent
            ? input.privacyNoticeVersion
            : undefined,
          attributionSource: attribution.source,
          attributionMedium: attribution.medium,
          attributionCampaign: attribution.campaign,
          attributionContent: attribution.content,
          attributionReferrerHost: attribution.referrerHost,
          campaignKey: attribution.campaignKey,
          lastFormDurationBucket: durationBucket,
        },
        select: { id: true },
      });

      await tx.leadSubmissionEvent.create({
        data: {
          leadType: "PROVIDER",
          providerLeadId: lead.id,
          submittedAt: now,
          isRefresh: existing !== null,
          consentVersion: input.privacyNoticeVersion,
          operationalConsent: true,
          marketingConsent: input.marketingConsent,
          attributionSource: attribution.source,
          attributionMedium: attribution.medium,
          campaign: attribution.campaign,
          content: attribution.content,
          referrerHost: attribution.referrerHost,
          campaignKey: attribution.campaignKey,
          formDurationBucket: durationBucket,
          ipHash,
          contactHash,
        },
      });
    });

    return ACCEPTED_RESPONSE;
  }

  async createClientLead(
    input: CreateClientLeadInput,
    context: LaunchRequestContext = {},
  ) {
    if (input.website) {
      return ACCEPTED_RESPONSE;
    }

    const now = new Date();
    const phoneE164 = normalizeKinshasaPhone(input.phone);
    this.assertPrivacyVersion(input.privacyNoticeVersion);
    this.protection.checkContact(phoneE164);
    await this.assertActiveSubcategories(input.neededSubcategoryIds);

    const attribution = normalizeAttribution(input.attribution);
    const durationBucket = formDurationBucket(input.formStartedAt, now);
    const contactHash = this.requiredHash(phoneE164);
    const ipHash = this.protection.hashIdentifier(context.ip);

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.clientWaitlistLead.findUnique({
        where: { phoneE164 },
        select: { id: true },
      });

      const lead = await tx.clientWaitlistLead.upsert({
        where: { phoneE164 },
        create: {
          firstName: input.firstName,
          phoneE164,
          emailNormalized: input.email ?? null,
          commune: input.commune,
          neededSubcategoryIds: input.neededSubcategoryIds,
          timing: input.timing,
          needSummary: input.needSummary ?? null,
          preferredContact: input.preferredContact ?? null,
          submittedAt: now,
          lastSubmittedAt: now,
          consentAt: now,
          consentVersion: input.privacyNoticeVersion,
          operationalConsent: true,
          marketingConsent: input.marketingConsent,
          marketingConsentAt: input.marketingConsent ? now : null,
          marketingConsentVersion: input.marketingConsent
            ? input.privacyNoticeVersion
            : null,
          attributionSource: attribution.source,
          attributionMedium: attribution.medium,
          attributionCampaign: attribution.campaign,
          attributionContent: attribution.content,
          attributionReferrerHost: attribution.referrerHost,
          campaignKey: attribution.campaignKey,
          lastFormDurationBucket: durationBucket,
        },
        update: {
          firstName: input.firstName,
          emailNormalized: input.email,
          commune: input.commune,
          neededSubcategoryIds: input.neededSubcategoryIds,
          timing: input.timing,
          needSummary: input.needSummary,
          preferredContact: input.preferredContact,
          lastSubmittedAt: now,
          consentAt: now,
          consentVersion: input.privacyNoticeVersion,
          operationalConsent: true,
          marketingConsent: input.marketingConsent ? true : undefined,
          marketingConsentAt: input.marketingConsent ? now : undefined,
          marketingConsentVersion: input.marketingConsent
            ? input.privacyNoticeVersion
            : undefined,
          attributionSource: attribution.source,
          attributionMedium: attribution.medium,
          attributionCampaign: attribution.campaign,
          attributionContent: attribution.content,
          attributionReferrerHost: attribution.referrerHost,
          campaignKey: attribution.campaignKey,
          lastFormDurationBucket: durationBucket,
        },
        select: { id: true },
      });

      await tx.leadSubmissionEvent.create({
        data: {
          leadType: "CLIENT",
          clientLeadId: lead.id,
          submittedAt: now,
          isRefresh: existing !== null,
          consentVersion: input.privacyNoticeVersion,
          operationalConsent: true,
          marketingConsent: input.marketingConsent,
          attributionSource: attribution.source,
          attributionMedium: attribution.medium,
          campaign: attribution.campaign,
          content: attribution.content,
          referrerHost: attribution.referrerHost,
          campaignKey: attribution.campaignKey,
          formDurationBucket: durationBucket,
          ipHash,
          contactHash,
        },
      });
    });

    return ACCEPTED_RESPONSE;
  }

  private assertPrivacyVersion(version: string): void {
    const current =
      this.config.get<string>("LAUNCH_PRIVACY_NOTICE_VERSION")?.trim() ?? "";
    if (!current) {
      throw new ServiceUnavailableException(
        "La collecte des demandes est temporairement indisponible.",
      );
    }
    if (version !== current) {
      throw new BadRequestException(
        "Veuillez relire et accepter la version actuelle de l'avis de confidentialité.",
      );
    }
  }

  private async assertActiveSubcategories(ids: string[]): Promise<void> {
    const uniqueIds = [...new Set(ids)];
    const active = await this.prisma.subcategory.findMany({
      where: {
        id: { in: uniqueIds },
        isActive: true,
        category: { isActive: true },
      },
      select: { id: true },
    });

    if (active.length !== uniqueIds.length) {
      throw new BadRequestException(
        "Une ou plusieurs catégories de service ne sont pas disponibles.",
      );
    }
  }

  private requiredHash(value: string): string {
    const hash = this.protection.hashIdentifier(value);
    if (!hash) {
      throw new ServiceUnavailableException(
        "La collecte des demandes est temporairement indisponible.",
      );
    }
    return hash;
  }
}

export function normalizeKinshasaPhone(input: string): string {
  const compact = input.trim().replace(/[\s().-]/g, "");
  let local: string;

  if (/^\+243\d{9}$/.test(compact)) {
    local = compact.slice(4);
  } else if (/^243\d{9}$/.test(compact)) {
    local = compact.slice(3);
  } else if (/^0\d{9}$/.test(compact)) {
    local = compact.slice(1);
  } else if (/^\d{9}$/.test(compact)) {
    local = compact;
  } else {
    throw new BadRequestException(
      "Le numéro de téléphone doit être un numéro valide de RDC.",
    );
  }

  return `+243${local}`;
}

export function normalizeAttribution(
  attribution?: CreateProviderLeadInput["attribution"],
): NormalizedAttribution {
  const source = attribution?.source ?? "direct";
  const medium = attribution?.medium ?? null;
  const campaign = attribution?.campaign ?? null;
  const content = attribution?.content ?? null;
  const referrerHost = attribution?.referrerHost ?? null;
  const campaignKey = [source, medium, campaign, content]
    .filter((value): value is string => Boolean(value))
    .join(":");

  return {
    source,
    medium,
    campaign,
    content,
    referrerHost,
    campaignKey,
  };
}

export function formDurationBucket(
  startedAt: string | undefined,
  submittedAt: Date,
): LeadFormDurationBucket {
  if (!startedAt) {
    return "UNKNOWN";
  }

  const durationSeconds =
    (submittedAt.getTime() - new Date(startedAt).getTime()) / 1_000;
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0) {
    return "UNKNOWN";
  }
  if (durationSeconds < 3) {
    return "UNDER_3_SECONDS";
  }
  if (durationSeconds <= 30) {
    return "FROM_3_TO_30_SECONDS";
  }
  if (durationSeconds <= 90) {
    return "FROM_31_TO_90_SECONDS";
  }
  if (durationSeconds <= 180) {
    return "FROM_91_TO_180_SECONDS";
  }
  return "OVER_180_SECONDS";
}
