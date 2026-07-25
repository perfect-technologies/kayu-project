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

-- The earlier hardening migration may already be recorded as applied. Replace
-- only its primary taxonomy FK with a staged equivalent: PostgreSQL enforces
-- new writes, while pre-existing historical snapshots can be reported below.
ALTER TABLE "ProviderLead" DROP CONSTRAINT "ProviderLead_primarySubcategoryId_fkey";
ALTER TABLE "ProviderLead" ALTER COLUMN "primarySubcategoryId" DROP NOT NULL;
ALTER TABLE "ProviderLead" ADD CONSTRAINT "ProviderLead_primarySubcategoryId_required" CHECK ("primarySubcategoryId" IS NOT NULL) NOT VALID;
ALTER TABLE "ProviderLead" ADD CONSTRAINT "ProviderLead_primarySubcategoryId_fkey" FOREIGN KEY ("primarySubcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- Preserve missing historical IDs from immutable campaign snapshots instead of
-- recreating or silently remapping taxonomy. Valid IDs remain queryable via
-- their existing normalized relations; these rows are explicit audit evidence.
INSERT INTO "LeadTaxonomySnapshotOrphan" ("id", "leadType", "leadId", "relationKind", "subcategoryId")
SELECT CONCAT('lead_taxonomy_orphan_provider_', lead."id", '_primary'), 'PROVIDER'::"LeadType", lead."id", 'PROVIDER_PRIMARY'::"LeadTaxonomySnapshotRelation", lead."primarySubcategoryId"
FROM "ProviderLead" AS lead
LEFT JOIN "Subcategory" AS taxonomy ON taxonomy."id" = lead."primarySubcategoryId"
WHERE lead."primarySubcategoryId" IS NOT NULL AND taxonomy."id" IS NULL;

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

-- Restore any valid normalized links missing from historical snapshot arrays.
-- The joins deliberately exclude missing IDs, which remain represented above.
INSERT INTO "ProviderLeadAdditionalSubcategory" ("providerLeadId", "subcategoryId")
SELECT DISTINCT lead."id", selected."subcategoryId"
FROM "ProviderLead" AS lead
CROSS JOIN LATERAL unnest(lead."additionalSubcategoryIds") AS selected("subcategoryId")
INNER JOIN "Subcategory" AS taxonomy ON taxonomy."id" = selected."subcategoryId"
ON CONFLICT DO NOTHING;

INSERT INTO "ClientWaitlistLeadSubcategory" ("clientLeadId", "subcategoryId")
SELECT DISTINCT lead."id", selected."subcategoryId"
FROM "ClientWaitlistLead" AS lead
CROSS JOIN LATERAL unnest(lead."neededSubcategoryIds") AS selected("subcategoryId")
INNER JOIN "Subcategory" AS taxonomy ON taxonomy."id" = selected."subcategoryId"
ON CONFLICT DO NOTHING;

-- CreateIndex
CREATE UNIQUE INDEX "LeadTaxonomySnapshotOrphan_leadType_leadId_relationKind_subcategoryId_key" ON "LeadTaxonomySnapshotOrphan"("leadType", "leadId", "relationKind", "subcategoryId");

-- CreateIndex
CREATE INDEX "LeadTaxonomySnapshotOrphan_relationKind_detectedAt_idx" ON "LeadTaxonomySnapshotOrphan"("relationKind", "detectedAt");

-- CreateIndex
CREATE INDEX "LeadTaxonomySnapshotOrphan_subcategoryId_idx" ON "LeadTaxonomySnapshotOrphan"("subcategoryId");
