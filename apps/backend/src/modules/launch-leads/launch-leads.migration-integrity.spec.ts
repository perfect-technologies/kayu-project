import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const originalLeadMigrationPath = resolve(
  __dirname,
  "../../../prisma/migrations/20260725120000_add_launch_leads/migration.sql",
);
const ORIGINAL_LEAD_MIGRATION_SHA256 =
  "d1f4746a201ee0bd565becca44346547084a2c71307bff0f8347893f31d3d030";

test("original launch-leads migration retains its committed byte checksum", () => {
  const digest = createHash("sha256")
    .update(readFileSync(originalLeadMigrationPath))
    .digest("hex");

  assert.equal(digest, ORIGINAL_LEAD_MIGRATION_SHA256);
});
