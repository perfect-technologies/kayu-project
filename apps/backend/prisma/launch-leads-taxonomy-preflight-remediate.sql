-- Run after capture and after operations inserts one approved valid replacement
-- for every PROVIDER_PRIMARY exception. The immutable removed IDs stay in the
-- audit table; arrays are reduced only after that durable preservation.
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM "LeadTaxonomySnapshotOrphan" orphan
        LEFT JOIN "LeadTaxonomyPreflightPrimaryResolution" resolution ON resolution."providerLeadId" = orphan."leadId"
        LEFT JOIN "Subcategory" replacement ON replacement."id" = resolution."replacementSubcategoryId"
        WHERE orphan."relationKind" = 'PROVIDER_PRIMARY'::"LeadTaxonomySnapshotRelation"
          AND (resolution."providerLeadId" IS NULL OR replacement."id" IS NULL)
    ) THEN RAISE EXCEPTION 'Every orphaned provider primary subcategory requires an approved valid replacement before 1300';
    END IF;
END $$;

UPDATE "ProviderLead" lead SET "primarySubcategoryId" = resolution."replacementSubcategoryId"
FROM "LeadTaxonomyPreflightPrimaryResolution" resolution
WHERE resolution."providerLeadId" = lead."id";

UPDATE "ProviderLead" lead
SET "additionalSubcategoryIds" = ARRAY(SELECT selected.id FROM unnest(lead."additionalSubcategoryIds") selected(id) INNER JOIN "Subcategory" taxonomy ON taxonomy."id" = selected.id);

UPDATE "ClientWaitlistLead" lead
SET "neededSubcategoryIds" = ARRAY(SELECT selected.id FROM unnest(lead."neededSubcategoryIds") selected(id) INNER JOIN "Subcategory" taxonomy ON taxonomy."id" = selected.id);
