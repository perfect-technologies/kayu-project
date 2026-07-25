import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const protectedMigrations = [
  {
    name: "20260725120000_add_launch_leads",
    sha256: "d1f4746a201ee0bd565becca44346547084a2c71307bff0f8347893f31d3d030",
  },
  {
    name: "20260725130000_harden_launch_leads",
    sha256: "acd6e6b8ef5089759eb0ef5f47845d23e3b13a13a21b26cb69d8a3788a6552ce",
  },
  {
    name: "20260725150000_preserve_orphaned_lead_taxonomy_snapshots",
    sha256: "0696d9a09ba6f71e004f1eb1147a6350dbd8f1918cea74152b8b521f99fb517a",
  },
];

test("protected launch-lead migrations retain their committed byte checksums", () => {
  for (const migration of protectedMigrations) {
    const migrationPath = resolve(
      __dirname,
      `../../../prisma/migrations/${migration.name}/migration.sql`,
    );
    const digest = createHash("sha256")
      .update(readFileSync(migrationPath))
      .digest("hex");

    assert.equal(digest, migration.sha256, migration.name);
  }
});
