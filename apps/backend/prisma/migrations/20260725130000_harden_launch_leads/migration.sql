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

-- Backfill normalized taxonomy relations from the original immutable ID snapshots.
INSERT INTO "ProviderLeadAdditionalSubcategory" ("providerLeadId", "subcategoryId")
SELECT DISTINCT lead."id", selected."subcategoryId"
FROM "ProviderLead" AS lead
CROSS JOIN LATERAL unnest(lead."additionalSubcategoryIds") AS selected("subcategoryId");

INSERT INTO "ClientWaitlistLeadSubcategory" ("clientLeadId", "subcategoryId")
SELECT DISTINCT lead."id", selected."subcategoryId"
FROM "ClientWaitlistLead" AS lead
CROSS JOIN LATERAL unnest(lead."neededSubcategoryIds") AS selected("subcategoryId");

-- CreateIndex
CREATE INDEX "ProviderLeadAdditionalSubcategory_subcategoryId_idx" ON "ProviderLeadAdditionalSubcategory"("subcategoryId");

-- CreateIndex
CREATE INDEX "ClientWaitlistLeadSubcategory_subcategoryId_idx" ON "ClientWaitlistLeadSubcategory"("subcategoryId");

-- AddForeignKey
ALTER TABLE "ProviderLead" ADD CONSTRAINT "ProviderLead_primarySubcategoryId_fkey" FOREIGN KEY ("primarySubcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderLeadAdditionalSubcategory" ADD CONSTRAINT "ProviderLeadAdditionalSubcategory_providerLeadId_fkey" FOREIGN KEY ("providerLeadId") REFERENCES "ProviderLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderLeadAdditionalSubcategory" ADD CONSTRAINT "ProviderLeadAdditionalSubcategory_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientWaitlistLeadSubcategory" ADD CONSTRAINT "ClientWaitlistLeadSubcategory_clientLeadId_fkey" FOREIGN KEY ("clientLeadId") REFERENCES "ClientWaitlistLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientWaitlistLeadSubcategory" ADD CONSTRAINT "ClientWaitlistLeadSubcategory_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
