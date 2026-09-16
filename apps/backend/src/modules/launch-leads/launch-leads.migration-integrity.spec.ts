import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const baseline = {
  name: "0_init",
  sha256: "97a3f2b6fd542e7de4375aa2122b9cb31f6963b8a7f3e0d389425750101e8dcd",
};

const launchLeadIdentifiers = [
  "ProviderLead",
  "ClientWaitlistLead",
  "LeadSubmissionEvent",
  "CampaignFunnelEvent",
  "LeadTaxonomySnapshotOrphan",
  "ProviderLeadAdditionalSubcategory",
  "ClientWaitlistLeadSubcategory",
  "ProviderLeadStatus",
  "ClientLeadStatus",
  "ProviderLeadExperienceBand",
  "ClientLeadTiming",
  "LeadPreferredContact",
  "LeadType",
  "LeadSubmissionOutcome",
  "LeadFormDurationBucket",
  "LeadTaxonomySnapshotRelation",
  "LaunchFunnelEventName",
  "LaunchFunnelDeviceClass",
];

const expectedLaunchLeadStatements = [
  `CREATE TYPE "ProviderLeadStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'NEEDS_INFO', 'QUALIFIED', 'REJECTED', 'WITHDRAWN', 'INVITED', 'ACTIVATED')`,
  `CREATE TYPE "ClientLeadStatus" AS ENUM ('SUBMITTED', 'ELIGIBLE', 'PAUSED', 'DECLINED', 'WITHDRAWN', 'INVITED', 'ACTIVATED')`,
  `CREATE TYPE "ProviderLeadExperienceBand" AS ENUM ('STARTING', 'ONE_TO_THREE_YEARS', 'FOUR_PLUS_YEARS')`,
  `CREATE TYPE "ClientLeadTiming" AS ENUM ('WITHIN_7_DAYS', 'WITHIN_30_DAYS', 'LATER', 'EXPLORING')`,
  `CREATE TYPE "LeadPreferredContact" AS ENUM ('PHONE', 'WHATSAPP')`,
  `CREATE TYPE "LeadType" AS ENUM ('PROVIDER', 'CLIENT')`,
  `CREATE TYPE "LeadSubmissionOutcome" AS ENUM ('CREATED', 'DUPLICATE_REVIEW_REQUIRED')`,
  `CREATE TYPE "LeadFormDurationBucket" AS ENUM ('UNDER_3_SECONDS', 'FROM_3_TO_30_SECONDS', 'FROM_31_TO_90_SECONDS', 'FROM_91_TO_180_SECONDS', 'OVER_180_SECONDS', 'UNKNOWN')`,
  `CREATE TYPE "LeadTaxonomySnapshotRelation" AS ENUM ('PROVIDER_PRIMARY', 'PROVIDER_ADDITIONAL', 'CLIENT_NEEDED')`,
  `CREATE TYPE "LaunchFunnelEventName" AS ENUM ('LANDING_VIEWED', 'ROLE_SELECTED', 'FORM_STARTED', 'FORM_VALIDATION_FAILED', 'LEAD_SUBMITTED')`,
  `CREATE TYPE "LaunchFunnelDeviceClass" AS ENUM ('MOBILE', 'TABLET', 'DESKTOP', 'UNKNOWN')`,
  `CREATE TABLE "ProviderLead" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSubmittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstName" TEXT NOT NULL,
    "phoneE164" TEXT NOT NULL,
    "emailNormalized" TEXT,
    "primarySubcategoryId" TEXT,
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
)`,
  `CREATE TABLE "ClientWaitlistLead" (
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
)`,
  `CREATE TABLE "LeadSubmissionEvent" (
    "id" TEXT NOT NULL,
    "leadType" "LeadType" NOT NULL,
    "providerLeadId" TEXT,
    "clientLeadId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRefresh" BOOLEAN NOT NULL DEFAULT false,
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
    "outcome" "LeadSubmissionOutcome" NOT NULL,

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
)`,
  `CREATE TABLE "CampaignFunnelEvent" (
    "id" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "eventName" "LaunchFunnelEventName" NOT NULL,
    "route" TEXT NOT NULL,
    "deviceClass" "LaunchFunnelDeviceClass" NOT NULL,
    "leadType" "LeadType",
    "validationField" TEXT,
    "validationErrorCode" TEXT,
    "attributionSource" TEXT NOT NULL,
    "attributionMedium" TEXT,
    "attributionCampaign" TEXT,
    "attributionContent" TEXT,
    "attributionReferrerHost" TEXT,
    "campaignKey" TEXT NOT NULL,

    CONSTRAINT "CampaignFunnelEvent_pkey" PRIMARY KEY ("id")
)`,
  `CREATE TABLE "LeadTaxonomySnapshotOrphan" (
    "id" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadType" "LeadType" NOT NULL,
    "leadId" TEXT NOT NULL,
    "relationKind" "LeadTaxonomySnapshotRelation" NOT NULL,
    "subcategoryId" TEXT NOT NULL,

    CONSTRAINT "LeadTaxonomySnapshotOrphan_pkey" PRIMARY KEY ("id")
)`,
  `CREATE TABLE "ProviderLeadAdditionalSubcategory" (
    "providerLeadId" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,

    CONSTRAINT "ProviderLeadAdditionalSubcategory_pkey" PRIMARY KEY ("providerLeadId","subcategoryId")
)`,
  `CREATE TABLE "ClientWaitlistLeadSubcategory" (
    "clientLeadId" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,

    CONSTRAINT "ClientWaitlistLeadSubcategory_pkey" PRIMARY KEY ("clientLeadId","subcategoryId")
)`,
  `CREATE UNIQUE INDEX "ProviderLead_phoneE164_key" ON "ProviderLead"("phoneE164")`,
  `CREATE INDEX "ProviderLead_status_submittedAt_idx" ON "ProviderLead"("status", "submittedAt")`,
  `CREATE INDEX "ProviderLead_primarySubcategoryId_status_idx" ON "ProviderLead"("primarySubcategoryId", "status")`,
  `CREATE INDEX "ProviderLead_homeCommune_status_idx" ON "ProviderLead"("homeCommune", "status")`,
  `CREATE INDEX "ProviderLead_attributionSource_campaignKey_idx" ON "ProviderLead"("attributionSource", "campaignKey")`,
  `CREATE INDEX "ProviderLead_isTest_status_idx" ON "ProviderLead"("isTest", "status")`,
  `CREATE UNIQUE INDEX "ClientWaitlistLead_phoneE164_key" ON "ClientWaitlistLead"("phoneE164")`,
  `CREATE INDEX "ClientWaitlistLead_status_submittedAt_idx" ON "ClientWaitlistLead"("status", "submittedAt")`,
  `CREATE INDEX "ClientWaitlistLead_commune_status_idx" ON "ClientWaitlistLead"("commune", "status")`,
  `CREATE INDEX "ClientWaitlistLead_attributionSource_campaignKey_idx" ON "ClientWaitlistLead"("attributionSource", "campaignKey")`,
  `CREATE INDEX "ClientWaitlistLead_isTest_status_idx" ON "ClientWaitlistLead"("isTest", "status")`,
  `CREATE INDEX "LeadSubmissionEvent_providerLeadId_submittedAt_idx" ON "LeadSubmissionEvent"("providerLeadId", "submittedAt")`,
  `CREATE INDEX "LeadSubmissionEvent_clientLeadId_submittedAt_idx" ON "LeadSubmissionEvent"("clientLeadId", "submittedAt")`,
  `CREATE INDEX "LeadSubmissionEvent_contactHash_submittedAt_idx" ON "LeadSubmissionEvent"("contactHash", "submittedAt")`,
  `CREATE INDEX "LeadSubmissionEvent_ipHash_submittedAt_idx" ON "LeadSubmissionEvent"("ipHash", "submittedAt")`,
  `CREATE INDEX "LeadSubmissionEvent_attribution_idx" ON "LeadSubmissionEvent"("leadType", "attributionSource", "campaignKey", "submittedAt")`,
  `CREATE INDEX "CampaignFunnelEvent_eventName_receivedAt_idx" ON "CampaignFunnelEvent"("eventName", "receivedAt")`,
  `CREATE INDEX "CampaignFunnelEvent_leadType_eventName_receivedAt_idx" ON "CampaignFunnelEvent"("leadType", "eventName", "receivedAt")`,
  `CREATE INDEX "CampaignFunnelEvent_attribution_idx" ON "CampaignFunnelEvent"("attributionSource", "campaignKey", "receivedAt")`,
  `CREATE INDEX "LeadTaxonomySnapshotOrphan_relationKind_detectedAt_idx" ON "LeadTaxonomySnapshotOrphan"("relationKind", "detectedAt")`,
  `CREATE INDEX "LeadTaxonomySnapshotOrphan_subcategoryId_idx" ON "LeadTaxonomySnapshotOrphan"("subcategoryId")`,
  `CREATE UNIQUE INDEX "LeadTaxonomySnapshotOrphan_leadType_leadId_relationKind_sub_key" ON "LeadTaxonomySnapshotOrphan"("leadType", "leadId", "relationKind", "subcategoryId")`,
  `CREATE INDEX "ProviderLeadAdditionalSubcategory_subcategoryId_idx" ON "ProviderLeadAdditionalSubcategory"("subcategoryId")`,
  `CREATE INDEX "ClientWaitlistLeadSubcategory_subcategoryId_idx" ON "ClientWaitlistLeadSubcategory"("subcategoryId")`,
  `ALTER TABLE "ProviderLead" ADD CONSTRAINT "ProviderLead_primarySubcategoryId_required" CHECK ("primarySubcategoryId" IS NOT NULL) NOT VALID`,
  `ALTER TABLE "ProviderLead" ADD CONSTRAINT "ProviderLead_primarySubcategoryId_fkey" FOREIGN KEY ("primarySubcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID`,
  `ALTER TABLE "LeadSubmissionEvent" ADD CONSTRAINT "LeadSubmissionEvent_providerLeadId_fkey" FOREIGN KEY ("providerLeadId") REFERENCES "ProviderLead"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "LeadSubmissionEvent" ADD CONSTRAINT "LeadSubmissionEvent_clientLeadId_fkey" FOREIGN KEY ("clientLeadId") REFERENCES "ClientWaitlistLead"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "ProviderLeadAdditionalSubcategory" ADD CONSTRAINT "ProviderLeadAdditionalSubcategory_providerLeadId_fkey" FOREIGN KEY ("providerLeadId") REFERENCES "ProviderLead"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "ProviderLeadAdditionalSubcategory" ADD CONSTRAINT "ProviderLeadAdditionalSubcategory_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "ClientWaitlistLeadSubcategory" ADD CONSTRAINT "ClientWaitlistLeadSubcategory_clientLeadId_fkey" FOREIGN KEY ("clientLeadId") REFERENCES "ClientWaitlistLead"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "ClientWaitlistLeadSubcategory" ADD CONSTRAINT "ClientWaitlistLeadSubcategory_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
];

function readBaseline(): Buffer {
  return readFileSync(
    resolve(__dirname, `../../../prisma/migrations/${baseline.name}/migration.sql`),
  );
}

function sqlStatements(sql: string): string[] {
  return sql
    .split(/;\s*\n/)
    .map((chunk) =>
      chunk
        .split("\n")
        .filter((line) => !line.startsWith("--"))
        .join("\n")
        .trim()
        .replace(/;$/, ""),
    )
    .filter(Boolean);
}

test("protected baseline migration retains its committed byte checksum", () => {
  const digest = createHash("sha256").update(readBaseline()).digest("hex");

  assert.equal(digest, baseline.sha256, baseline.name);
});

test("baseline creates exactly the protected launch-lead enums, tables, indexes and constraints", () => {
  const quoted = launchLeadIdentifiers.map((identifier) => `"${identifier}"`);
  const launchLeadStatements = sqlStatements(readBaseline().toString("utf8")).filter(
    (statement) => quoted.some((identifier) => statement.includes(identifier)),
  );

  assert.deepEqual(
    [...launchLeadStatements].sort(),
    [...expectedLaunchLeadStatements].sort(),
  );
});
