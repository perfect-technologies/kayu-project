import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { LeadFormDurationBucket, Prisma } from "@prisma/client";
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
const SERIALIZABLE_RETRY_LIMIT = 5;

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

    await this.withSerializableRetry(async (tx) => {
      const existing = await tx.providerLead.findUnique({
        where: { phoneE164 },
        select: { id: true },
      });

      if (existing) {
        await tx.leadSubmissionEvent.create({
          data: {
            leadType: "PROVIDER",
            providerLeadId: existing.id,
            submittedAt: now,
            isRefresh: true,
            outcome: "DUPLICATE_REVIEW_REQUIRED",
            consentVersion: input.privacyNoticeVersion,
            operationalConsent: true,
            marketingConsent: false,
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
        return;
      }

      const lead = await tx.providerLead.create({
        data: {
          firstName: input.firstName,
          phoneE164,
          emailNormalized: input.email ?? null,
          primarySubcategoryId: input.primarySubcategoryId,
          additionalSubcategoryIds: input.additionalSubcategoryIds,
          additionalSubcategories: {
            create: input.additionalSubcategoryIds.map((subcategoryId) => ({
              subcategoryId,
            })),
          },
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
        select: { id: true },
      });

      await tx.leadSubmissionEvent.create({
        data: {
          leadType: "PROVIDER",
          providerLeadId: lead.id,
          submittedAt: now,
          isRefresh: false,
          outcome: "CREATED",
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

    await this.withSerializableRetry(async (tx) => {
      const existing = await tx.clientWaitlistLead.findUnique({
        where: { phoneE164 },
        select: { id: true },
      });

      if (existing) {
        await tx.leadSubmissionEvent.create({
          data: {
            leadType: "CLIENT",
            clientLeadId: existing.id,
            submittedAt: now,
            isRefresh: true,
            outcome: "DUPLICATE_REVIEW_REQUIRED",
            consentVersion: input.privacyNoticeVersion,
            operationalConsent: true,
            marketingConsent: false,
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
        return;
      }

      const lead = await tx.clientWaitlistLead.create({
        data: {
          firstName: input.firstName,
          phoneE164,
          emailNormalized: input.email ?? null,
          commune: input.commune,
          neededSubcategoryIds: input.neededSubcategoryIds,
          neededSubcategories: {
            create: input.neededSubcategoryIds.map((subcategoryId) => ({
              subcategoryId,
            })),
          },
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
        select: { id: true },
      });

      await tx.leadSubmissionEvent.create({
        data: {
          leadType: "CLIENT",
          clientLeadId: lead.id,
          submittedAt: now,
          isRefresh: false,
          outcome: "CREATED",
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

  private async withSerializableRetry<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 1; attempt <= SERIALIZABLE_RETRY_LIMIT; attempt += 1) {
      try {
        return await this.prisma.$transaction(operation, {
          isolationLevel: "Serializable",
        });
      } catch (error) {
        const code = (error as { code?: string }).code;
        const retryable = code === "P2002" || code === "P2034";
        if (!retryable || attempt === SERIALIZABLE_RETRY_LIMIT) {
          throw error;
        }
      }
    }

    throw new ServiceUnavailableException(
      "La collecte des demandes est temporairement indisponible.",
    );
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

  if (!/^[89]/.test(local) || isImplausiblePhoneLocalPart(local)) {
    throw new BadRequestException(
      "Le numéro de téléphone doit être un numéro mobile plausible de RDC.",
    );
  }

  return `+243${local}`;
}

function isImplausiblePhoneLocalPart(local: string): boolean {
  if (new Set(local).size < 4) {
    return true;
  }
  if (/^(\d)\1{8}$/.test(local) || /\d{3}0{6}$/.test(local)) {
    return true;
  }
  return ["012345678", "123456789", "987654321"].includes(local);
}

export function normalizeAttribution(
  attribution?: CreateProviderLeadInput["attribution"],
): NormalizedAttribution {
  const source = attribution?.source ?? "direct";
  const medium = attribution?.medium ?? null;
  const campaign = attribution?.campaign ?? null;
  const content = attribution?.content ?? null;
  const referrerHost = attribution?.referrerHost ?? null;
  const campaignKey = JSON.stringify([source, medium, campaign, content]);

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
