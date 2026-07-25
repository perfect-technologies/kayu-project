-- CreateEnum
CREATE TYPE "ProviderLeadStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'NEEDS_INFO', 'QUALIFIED', 'REJECTED', 'WITHDRAWN', 'INVITED', 'ACTIVATED');

-- CreateEnum
CREATE TYPE "ClientLeadStatus" AS ENUM ('SUBMITTED', 'ELIGIBLE', 'PAUSED', 'DECLINED', 'WITHDRAWN', 'INVITED', 'ACTIVATED');

-- CreateEnum
CREATE TYPE "ProviderLeadExperienceBand" AS ENUM ('STARTING', 'ONE_TO_THREE_YEARS', 'FOUR_PLUS_YEARS');

-- CreateEnum
CREATE TYPE "ClientLeadTiming" AS ENUM ('WITHIN_7_DAYS', 'WITHIN_30_DAYS', 'LATER', 'EXPLORING');

-- CreateEnum
CREATE TYPE "LeadPreferredContact" AS ENUM ('PHONE', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "LeadType" AS ENUM ('PROVIDER', 'CLIENT');

-- CreateEnum
CREATE TYPE "LeadSubmissionOutcome" AS ENUM ('CREATED', 'DUPLICATE_REVIEW_REQUIRED');

-- CreateEnum
CREATE TYPE "LeadFormDurationBucket" AS ENUM ('UNDER_3_SECONDS', 'FROM_3_TO_30_SECONDS', 'FROM_31_TO_90_SECONDS', 'FROM_91_TO_180_SECONDS', 'OVER_180_SECONDS', 'UNKNOWN');

-- CreateTable
CREATE TABLE "ProviderLead" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSubmittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstName" TEXT NOT NULL,
    "phoneE164" TEXT NOT NULL,
    "emailNormalized" TEXT,
    "primarySubcategoryId" TEXT NOT NULL,
    "additionalSubcategoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experienceBand" "ProviderLeadExperienceBand" NOT NULL,
    "homeCommune" TEXT NOT NULL,
    "serviceCommunes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hasWhatsApp" BOOLEAN,
    "summary" TEXT,
    "status" "ProviderLeadStatus" NOT NULL DEFAULT 'SUBMITTED',
    "consentAt" TIMESTAMP(3) NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "operationalConsent" BOOLEAN NOT NULL DEFAULT true,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "marketingConsentAt" TIMESTAMP(3),
    "marketingConsentVersion" TEXT,
    "attributionSource" TEXT NOT NULL,
    "attributionMedium" TEXT,
    "attributionCampaign" TEXT,
    "attributionContent" TEXT,
    "attributionReferrerHost" TEXT,
    "campaignKey" TEXT NOT NULL,
    "lastFormDurationBucket" "LeadFormDurationBucket" NOT NULL DEFAULT 'UNKNOWN',
    "isTest" BOOLEAN NOT NULL DEFAULT false,
    "firstReviewedAt" TIMESTAMP(3),
    "lastContactedAt" TIMESTAMP(3),
    "qualifiedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "assignedAdminUserId" TEXT,
    "decisionReasonCode" TEXT,
    "privateNotes" TEXT,
    "activatedUserId" TEXT,
    "activatedProviderId" TEXT,
    "activatedAt" TIMESTAMP(3),

    CONSTRAINT "ProviderLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientWaitlistLead" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSubmittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstName" TEXT NOT NULL,
    "phoneE164" TEXT NOT NULL,
    "emailNormalized" TEXT,
    "commune" TEXT NOT NULL,
    "neededSubcategoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "timing" "ClientLeadTiming" NOT NULL,
    "needSummary" TEXT,
    "preferredContact" "LeadPreferredContact",
    "status" "ClientLeadStatus" NOT NULL DEFAULT 'SUBMITTED',
    "consentAt" TIMESTAMP(3) NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "operationalConsent" BOOLEAN NOT NULL DEFAULT true,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "marketingConsentAt" TIMESTAMP(3),
    "marketingConsentVersion" TEXT,
    "attributionSource" TEXT NOT NULL,
    "attributionMedium" TEXT,
    "attributionCampaign" TEXT,
    "attributionContent" TEXT,
    "attributionReferrerHost" TEXT,
    "campaignKey" TEXT NOT NULL,
    "lastFormDurationBucket" "LeadFormDurationBucket" NOT NULL DEFAULT 'UNKNOWN',
    "isTest" BOOLEAN NOT NULL DEFAULT false,
    "firstReviewedAt" TIMESTAMP(3),
    "lastContactedAt" TIMESTAMP(3),
    "eligibleAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "assignedAdminUserId" TEXT,
    "decisionReasonCode" TEXT,
    "privateNotes" TEXT,
    "activatedUserId" TEXT,
    "activatedAt" TIMESTAMP(3),

    CONSTRAINT "ClientWaitlistLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadSubmissionEvent" (
    "id" TEXT NOT NULL,
    "leadType" "LeadType" NOT NULL,
    "providerLeadId" TEXT,
    "clientLeadId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRefresh" BOOLEAN NOT NULL DEFAULT false,
    "outcome" "LeadSubmissionOutcome" NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "operationalConsent" BOOLEAN NOT NULL,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "attributionSource" TEXT NOT NULL,
    "attributionMedium" TEXT,
    "campaign" TEXT,
    "content" TEXT,
    "referrerHost" TEXT,
    "campaignKey" TEXT NOT NULL,
    "formDurationBucket" "LeadFormDurationBucket" NOT NULL DEFAULT 'UNKNOWN',
    "ipHash" TEXT,
    "contactHash" TEXT NOT NULL,

    CONSTRAINT "LeadSubmissionEvent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LeadSubmissionEvent_exactly_one_lead_check" CHECK (
      (
        "leadType" = 'PROVIDER'
        AND "providerLeadId" IS NOT NULL
        AND "clientLeadId" IS NULL
      )
      OR
      (
        "leadType" = 'CLIENT'
        AND "providerLeadId" IS NULL
        AND "clientLeadId" IS NOT NULL
      )
    )
);

-- CreateTable
CREATE TABLE "ProviderLeadAdditionalSubcategory" (
    "providerLeadId" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,

    CONSTRAINT "ProviderLeadAdditionalSubcategory_pkey" PRIMARY KEY ("providerLeadId","subcategoryId")
);

-- CreateTable
CREATE TABLE "ClientWaitlistLeadSubcategory" (
    "clientLeadId" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,

    CONSTRAINT "ClientWaitlistLeadSubcategory_pkey" PRIMARY KEY ("clientLeadId","subcategoryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderLead_phoneE164_key" ON "ProviderLead"("phoneE164");

-- CreateIndex
CREATE INDEX "ProviderLead_status_submittedAt_idx" ON "ProviderLead"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "ProviderLead_primarySubcategoryId_status_idx" ON "ProviderLead"("primarySubcategoryId", "status");

-- CreateIndex
CREATE INDEX "ProviderLead_homeCommune_status_idx" ON "ProviderLead"("homeCommune", "status");

-- CreateIndex
CREATE INDEX "ProviderLead_attributionSource_campaignKey_idx" ON "ProviderLead"("attributionSource", "campaignKey");

-- CreateIndex
CREATE INDEX "ProviderLead_isTest_status_idx" ON "ProviderLead"("isTest", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ClientWaitlistLead_phoneE164_key" ON "ClientWaitlistLead"("phoneE164");

-- CreateIndex
CREATE INDEX "ClientWaitlistLead_status_submittedAt_idx" ON "ClientWaitlistLead"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "ClientWaitlistLead_commune_status_idx" ON "ClientWaitlistLead"("commune", "status");

-- CreateIndex
CREATE INDEX "ClientWaitlistLead_attributionSource_campaignKey_idx" ON "ClientWaitlistLead"("attributionSource", "campaignKey");

-- CreateIndex
CREATE INDEX "ClientWaitlistLead_isTest_status_idx" ON "ClientWaitlistLead"("isTest", "status");

-- CreateIndex
CREATE INDEX "LeadSubmissionEvent_providerLeadId_submittedAt_idx" ON "LeadSubmissionEvent"("providerLeadId", "submittedAt");

-- CreateIndex
CREATE INDEX "LeadSubmissionEvent_clientLeadId_submittedAt_idx" ON "LeadSubmissionEvent"("clientLeadId", "submittedAt");

-- CreateIndex
CREATE INDEX "LeadSubmissionEvent_contactHash_submittedAt_idx" ON "LeadSubmissionEvent"("contactHash", "submittedAt");

-- CreateIndex
CREATE INDEX "LeadSubmissionEvent_ipHash_submittedAt_idx" ON "LeadSubmissionEvent"("ipHash", "submittedAt");

-- CreateIndex
CREATE INDEX "LeadSubmissionEvent_attribution_idx" ON "LeadSubmissionEvent"("leadType", "attributionSource", "campaignKey", "submittedAt");

-- CreateIndex
CREATE INDEX "ProviderLeadAdditionalSubcategory_subcategoryId_idx" ON "ProviderLeadAdditionalSubcategory"("subcategoryId");

-- CreateIndex
CREATE INDEX "ClientWaitlistLeadSubcategory_subcategoryId_idx" ON "ClientWaitlistLeadSubcategory"("subcategoryId");

-- AddForeignKey
ALTER TABLE "ProviderLead" ADD CONSTRAINT "ProviderLead_primarySubcategoryId_fkey" FOREIGN KEY ("primarySubcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadSubmissionEvent" ADD CONSTRAINT "LeadSubmissionEvent_providerLeadId_fkey" FOREIGN KEY ("providerLeadId") REFERENCES "ProviderLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadSubmissionEvent" ADD CONSTRAINT "LeadSubmissionEvent_clientLeadId_fkey" FOREIGN KEY ("clientLeadId") REFERENCES "ClientWaitlistLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderLeadAdditionalSubcategory" ADD CONSTRAINT "ProviderLeadAdditionalSubcategory_providerLeadId_fkey" FOREIGN KEY ("providerLeadId") REFERENCES "ProviderLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderLeadAdditionalSubcategory" ADD CONSTRAINT "ProviderLeadAdditionalSubcategory_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientWaitlistLeadSubcategory" ADD CONSTRAINT "ClientWaitlistLeadSubcategory_clientLeadId_fkey" FOREIGN KEY ("clientLeadId") REFERENCES "ClientWaitlistLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientWaitlistLeadSubcategory" ADD CONSTRAINT "ClientWaitlistLeadSubcategory_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
