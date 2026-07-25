-- Run after capture and after operations inserts one approved valid replacement
-- for every PROVIDER_PRIMARY exception. The immutable removed IDs stay in the
-- audit table; arrays are reduced only after that durable preservation.
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM "LeadTaxonomyPreflightSnapshot" orphan
        LEFT JOIN "LeadTaxonomyPreflightPrimaryResolution" resolution ON resolution."providerLeadId" = orphan."leadId"
        LEFT JOIN "Subcategory" replacement ON replacement."id" = resolution."replacementSubcategoryId"
        LEFT JOIN "Category" parent ON parent."id" = replacement."categoryId"
        WHERE orphan."relationKind" = 'PROVIDER_PRIMARY'
          AND (resolution."providerLeadId" IS NULL OR replacement."id" IS NULL OR NOT replacement."isActive" OR NOT parent."isActive")
    ) OR EXISTS (
        SELECT 1 FROM "LeadTaxonomyPreflightPrimaryResolution" resolution
        LEFT JOIN "LeadTaxonomyPreflightSnapshot" orphan ON orphan."leadId" = resolution."providerLeadId" AND orphan."relationKind" = 'PROVIDER_PRIMARY'
        WHERE orphan."leadId" IS NULL
    ) THEN RAISE EXCEPTION 'Resolutions must map captured orphan primaries to active subcategories under active categories';
    END IF;
END $$;

UPDATE "ProviderLead" lead SET "primarySubcategoryId" = resolution."replacementSubcategoryId"
FROM "LeadTaxonomyPreflightPrimaryResolution" resolution
WHERE resolution."providerLeadId" = lead."id"
  AND EXISTS (SELECT 1 FROM "LeadTaxonomyPreflightSnapshot" orphan WHERE orphan."leadId" = lead."id" AND orphan."relationKind" = 'PROVIDER_PRIMARY');

UPDATE "ProviderLead" lead
SET "additionalSubcategoryIds" = ARRAY(SELECT selected.id FROM unnest(lead."additionalSubcategoryIds") selected(id) INNER JOIN "Subcategory" taxonomy ON taxonomy."id" = selected.id);

UPDATE "ClientWaitlistLead" lead
SET "neededSubcategoryIds" = ARRAY(SELECT selected.id FROM unnest(lead."neededSubcategoryIds") selected(id) INNER JOIN "Subcategory" taxonomy ON taxonomy."id" = selected.id);
