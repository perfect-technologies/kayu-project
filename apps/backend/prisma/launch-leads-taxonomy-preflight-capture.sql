-- Run only before 20260725130000_harden_launch_leads on a database where the
-- preflight report finds missing taxonomy IDs. This preserves audit meaning;
-- it does not mutate lead snapshots or fabricate taxonomy records.
CREATE TABLE IF NOT EXISTS "LeadTaxonomyPreflightSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadType" "LeadType" NOT NULL,
    "leadId" TEXT NOT NULL,
    "relationKind" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    CONSTRAINT "LeadTaxonomyPreflightSnapshot_unique" UNIQUE ("leadType", "leadId", "relationKind", "subcategoryId")
);

CREATE TABLE IF NOT EXISTS "LeadTaxonomyPreflightPrimaryResolution" (
    "providerLeadId" TEXT NOT NULL PRIMARY KEY,
    "replacementSubcategoryId" TEXT NOT NULL,
    "resolutionNote" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "LeadTaxonomyPreflightSnapshot" ("id", "leadType", "leadId", "relationKind", "subcategoryId")
SELECT CONCAT('lead_taxonomy_orphan_provider_', lead."id", '_primary'), 'PROVIDER'::"LeadType", lead."id", 'PROVIDER_PRIMARY', lead."primarySubcategoryId"
FROM "ProviderLead" lead LEFT JOIN "Subcategory" taxonomy ON taxonomy."id" = lead."primarySubcategoryId"
WHERE taxonomy."id" IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO "LeadTaxonomyPreflightSnapshot" ("id", "leadType", "leadId", "relationKind", "subcategoryId")
SELECT DISTINCT CONCAT('lead_taxonomy_orphan_provider_', lead."id", '_additional_', selected."subcategoryId"), 'PROVIDER'::"LeadType", lead."id", 'PROVIDER_ADDITIONAL', selected."subcategoryId"
FROM "ProviderLead" lead CROSS JOIN LATERAL unnest(lead."additionalSubcategoryIds") selected("subcategoryId") LEFT JOIN "Subcategory" taxonomy ON taxonomy."id" = selected."subcategoryId"
WHERE taxonomy."id" IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO "LeadTaxonomyPreflightSnapshot" ("id", "leadType", "leadId", "relationKind", "subcategoryId")
SELECT DISTINCT CONCAT('lead_taxonomy_orphan_client_', lead."id", '_needed_', selected."subcategoryId"), 'CLIENT'::"LeadType", lead."id", 'CLIENT_NEEDED', selected."subcategoryId"
FROM "ClientWaitlistLead" lead CROSS JOIN LATERAL unnest(lead."neededSubcategoryIds") selected("subcategoryId") LEFT JOIN "Subcategory" taxonomy ON taxonomy."id" = selected."subcategoryId"
WHERE taxonomy."id" IS NULL
ON CONFLICT DO NOTHING;
