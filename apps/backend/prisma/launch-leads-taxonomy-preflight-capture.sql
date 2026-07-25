-- Run only before 20260725130000_harden_launch_leads on a database where the
-- preflight report finds missing taxonomy IDs. This preserves audit meaning;
-- it does not mutate lead snapshots or fabricate taxonomy records.
DO $$ BEGIN
    CREATE TYPE "LeadTaxonomySnapshotRelation" AS ENUM ('PROVIDER_PRIMARY', 'PROVIDER_ADDITIONAL', 'CLIENT_NEEDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "LeadTaxonomySnapshotOrphan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadType" "LeadType" NOT NULL,
    "leadId" TEXT NOT NULL,
    "relationKind" "LeadTaxonomySnapshotRelation" NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    CONSTRAINT "LeadTaxonomySnapshotOrphan_leadType_leadId_relationKind_subcategoryId_key" UNIQUE ("leadType", "leadId", "relationKind", "subcategoryId")
);

CREATE TABLE IF NOT EXISTS "LeadTaxonomyPreflightPrimaryResolution" (
    "providerLeadId" TEXT NOT NULL PRIMARY KEY,
    "replacementSubcategoryId" TEXT NOT NULL,
    "resolutionNote" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "LeadTaxonomySnapshotOrphan" ("id", "leadType", "leadId", "relationKind", "subcategoryId")
SELECT CONCAT('lead_taxonomy_orphan_provider_', lead."id", '_primary'), 'PROVIDER'::"LeadType", lead."id", 'PROVIDER_PRIMARY'::"LeadTaxonomySnapshotRelation", lead."primarySubcategoryId"
FROM "ProviderLead" lead LEFT JOIN "Subcategory" taxonomy ON taxonomy."id" = lead."primarySubcategoryId"
WHERE taxonomy."id" IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO "LeadTaxonomySnapshotOrphan" ("id", "leadType", "leadId", "relationKind", "subcategoryId")
SELECT DISTINCT CONCAT('lead_taxonomy_orphan_provider_', lead."id", '_additional_', selected."subcategoryId"), 'PROVIDER'::"LeadType", lead."id", 'PROVIDER_ADDITIONAL'::"LeadTaxonomySnapshotRelation", selected."subcategoryId"
FROM "ProviderLead" lead CROSS JOIN LATERAL unnest(lead."additionalSubcategoryIds") selected("subcategoryId") LEFT JOIN "Subcategory" taxonomy ON taxonomy."id" = selected."subcategoryId"
WHERE taxonomy."id" IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO "LeadTaxonomySnapshotOrphan" ("id", "leadType", "leadId", "relationKind", "subcategoryId")
SELECT DISTINCT CONCAT('lead_taxonomy_orphan_client_', lead."id", '_needed_', selected."subcategoryId"), 'CLIENT'::"LeadType", lead."id", 'CLIENT_NEEDED'::"LeadTaxonomySnapshotRelation", selected."subcategoryId"
FROM "ClientWaitlistLead" lead CROSS JOIN LATERAL unnest(lead."neededSubcategoryIds") selected("subcategoryId") LEFT JOIN "Subcategory" taxonomy ON taxonomy."id" = selected."subcategoryId"
WHERE taxonomy."id" IS NULL
ON CONFLICT DO NOTHING;
