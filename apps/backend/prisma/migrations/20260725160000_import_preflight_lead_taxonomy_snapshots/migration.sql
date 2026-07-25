-- Import durable audit rows created by the mandatory pre-1300 remediation gate.
DO $$ BEGIN
  IF to_regclass('public."LeadTaxonomyPreflightSnapshot"') IS NOT NULL THEN
    INSERT INTO "LeadTaxonomySnapshotOrphan" ("id", "leadType", "leadId", "relationKind", "subcategoryId")
    SELECT "id", "leadType", "leadId", "relationKind"::"LeadTaxonomySnapshotRelation", "subcategoryId"
    FROM "LeadTaxonomyPreflightSnapshot"
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
