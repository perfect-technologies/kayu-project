-- CreateEnum
CREATE TYPE "LeadSubmissionOutcome" AS ENUM ('CREATED', 'DUPLICATE_REVIEW_REQUIRED');

-- AlterTable
ALTER TABLE "LeadSubmissionEvent" ADD COLUMN "outcome" "LeadSubmissionOutcome";

-- Backfill existing submission events from the original idempotency marker.
UPDATE "LeadSubmissionEvent"
SET "outcome" = CASE
    WHEN "isRefresh" THEN 'DUPLICATE_REVIEW_REQUIRED'::"LeadSubmissionOutcome"
    ELSE 'CREATED'::"LeadSubmissionOutcome"
END;

-- AlterTable
ALTER TABLE "LeadSubmissionEvent" ALTER COLUMN "outcome" SET NOT NULL;

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

-- CreateEnum
CREATE TYPE "LeadTaxonomySnapshotRelation" AS ENUM ('PROVIDER_PRIMARY', 'PROVIDER_ADDITIONAL', 'CLIENT_NEEDED');

-- CreateTable
CREATE TABLE "LeadTaxonomySnapshotOrphan" (
    "id" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadType" "LeadType" NOT NULL,
    "leadId" TEXT NOT NULL,
    "relationKind" "LeadTaxonomySnapshotRelation" NOT NULL,
    "subcategoryId" TEXT NOT NULL,

    CONSTRAINT "LeadTaxonomySnapshotOrphan_pkey" PRIMARY KEY ("id")
);

-- Historical snapshots may reference taxonomy records that were deleted before
-- this migration. Preserve and report those IDs rather than dropping or
-- rewriting campaign history. Operators reconcile these rows after deploy.
INSERT INTO "LeadTaxonomySnapshotOrphan" ("id", "leadType", "leadId", "relationKind", "subcategoryId")
SELECT CONCAT('lead_taxonomy_orphan_provider_', lead."id", '_primary'), 'PROVIDER'::"LeadType", lead."id", 'PROVIDER_PRIMARY'::"LeadTaxonomySnapshotRelation", lead."primarySubcategoryId"
FROM "ProviderLead" AS lead
LEFT JOIN "Subcategory" AS taxonomy ON taxonomy."id" = lead."primarySubcategoryId"
WHERE taxonomy."id" IS NULL;

INSERT INTO "LeadTaxonomySnapshotOrphan" ("id", "leadType", "leadId", "relationKind", "subcategoryId")
SELECT DISTINCT CONCAT('lead_taxonomy_orphan_provider_', lead."id", '_additional_', selected."subcategoryId"), 'PROVIDER'::"LeadType", lead."id", 'PROVIDER_ADDITIONAL'::"LeadTaxonomySnapshotRelation", selected."subcategoryId"
FROM "ProviderLead" AS lead
CROSS JOIN LATERAL unnest(lead."additionalSubcategoryIds") AS selected("subcategoryId")
LEFT JOIN "Subcategory" AS taxonomy ON taxonomy."id" = selected."subcategoryId"
WHERE taxonomy."id" IS NULL;

INSERT INTO "LeadTaxonomySnapshotOrphan" ("id", "leadType", "leadId", "relationKind", "subcategoryId")
SELECT DISTINCT CONCAT('lead_taxonomy_orphan_client_', lead."id", '_needed_', selected."subcategoryId"), 'CLIENT'::"LeadType", lead."id", 'CLIENT_NEEDED'::"LeadTaxonomySnapshotRelation", selected."subcategoryId"
FROM "ClientWaitlistLead" AS lead
CROSS JOIN LATERAL unnest(lead."neededSubcategoryIds") AS selected("subcategoryId")
LEFT JOIN "Subcategory" AS taxonomy ON taxonomy."id" = selected."subcategoryId"
WHERE taxonomy."id" IS NULL;

-- Backfill normalized taxonomy relations from the original immutable ID snapshots.
INSERT INTO "ProviderLeadAdditionalSubcategory" ("providerLeadId", "subcategoryId")
SELECT DISTINCT lead."id", selected."subcategoryId"
FROM "ProviderLead" AS lead
CROSS JOIN LATERAL unnest(lead."additionalSubcategoryIds") AS selected("subcategoryId")
INNER JOIN "Subcategory" AS taxonomy ON taxonomy."id" = selected."subcategoryId";

INSERT INTO "ClientWaitlistLeadSubcategory" ("clientLeadId", "subcategoryId")
SELECT DISTINCT lead."id", selected."subcategoryId"
FROM "ClientWaitlistLead" AS lead
CROSS JOIN LATERAL unnest(lead."neededSubcategoryIds") AS selected("subcategoryId")
INNER JOIN "Subcategory" AS taxonomy ON taxonomy."id" = selected."subcategoryId";

-- CreateIndex
CREATE INDEX "ProviderLeadAdditionalSubcategory_subcategoryId_idx" ON "ProviderLeadAdditionalSubcategory"("subcategoryId");

-- CreateIndex
CREATE INDEX "ClientWaitlistLeadSubcategory_subcategoryId_idx" ON "ClientWaitlistLeadSubcategory"("subcategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadTaxonomySnapshotOrphan_leadType_leadId_relationKind_subcategoryId_key" ON "LeadTaxonomySnapshotOrphan"("leadType", "leadId", "relationKind", "subcategoryId");

-- CreateIndex
CREATE INDEX "LeadTaxonomySnapshotOrphan_relationKind_detectedAt_idx" ON "LeadTaxonomySnapshotOrphan"("relationKind", "detectedAt");

-- CreateIndex
CREATE INDEX "LeadTaxonomySnapshotOrphan_subcategoryId_idx" ON "LeadTaxonomySnapshotOrphan"("subcategoryId");

-- AddForeignKey
ALTER TABLE "ProviderLead" ADD CONSTRAINT "ProviderLead_primarySubcategoryId_fkey" FOREIGN KEY ("primarySubcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "ProviderLeadAdditionalSubcategory" ADD CONSTRAINT "ProviderLeadAdditionalSubcategory_providerLeadId_fkey" FOREIGN KEY ("providerLeadId") REFERENCES "ProviderLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderLeadAdditionalSubcategory" ADD CONSTRAINT "ProviderLeadAdditionalSubcategory_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientWaitlistLeadSubcategory" ADD CONSTRAINT "ClientWaitlistLeadSubcategory_clientLeadId_fkey" FOREIGN KEY ("clientLeadId") REFERENCES "ClientWaitlistLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientWaitlistLeadSubcategory" ADD CONSTRAINT "ClientWaitlistLeadSubcategory_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
