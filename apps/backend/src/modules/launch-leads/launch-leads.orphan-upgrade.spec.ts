import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { resolve } from "node:path";
import test from "node:test";

const databaseUrl = process.env.LAUNCH_LEADS_ORPHAN_UPGRADE_TEST_DATABASE_URL;
const requireDatabase =
  process.env.LAUNCH_LEADS_REQUIRE_ORPHAN_UPGRADE_DATABASE === "true";
const backendDir = resolve(__dirname, "../../..");
const migrationsDir = resolve(backendDir, "prisma/migrations");

function runPrisma(
  databaseUrlForCommand: string,
  args: string[],
  input?: string,
): void {
  execFileSync("pnpm", ["exec", "prisma", ...args], {
    cwd: backendDir,
    env: { ...process.env, DATABASE_URL: databaseUrlForCommand },
    input,
    stdio: "pipe",
  });
}

function disposableDatabaseName(url: string): string {
  const name = new URL(url).pathname.replace(/^\//, "");
  if (!/^kayu_(ci|test)_launch_leads_orphan_upgrade$/.test(name)) {
    throw new Error(
      "LAUNCH_LEADS_ORPHAN_UPGRADE_TEST_DATABASE_URL must name a dedicated kayu_ci/test_launch_leads_orphan_upgrade database",
    );
  }
  return name;
}

function adminDatabaseUrl(url: string): string {
  const parsed = new URL(url);
  parsed.pathname = "/postgres";
  parsed.search = "";
  return parsed.toString();
}

function recreateDisposableDatabase(url: string, databaseName: string): void {
  runPostgresAdminCommand(
    url,
    `DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE);`,
  );
  runPostgresAdminCommand(url, `CREATE DATABASE "${databaseName}";`);
}

function dropDisposableDatabase(url: string, databaseName: string): void {
  runPostgresAdminCommand(
    url,
    `DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE);`,
  );
}

// Prisma's db execute wraps statements in a transaction, while PostgreSQL
// intentionally forbids CREATE/DROP DATABASE in one. GitHub's Postgres
// service and supported developer environments provide the standard psql
// client; the test stays isolated to the explicitly allowlisted database.
function runPostgresAdminCommand(url: string, command: string): void {
  execFileSync("psql", ["--dbname", adminDatabaseUrl(url), "--command", command], {
    stdio: "pipe",
  });
}

test(
  "upgrade preserves orphaned lead taxonomy snapshots while enforcing future references",
  { skip: !databaseUrl && !requireDatabase },
  async () => {
    assert.ok(
      databaseUrl,
      "LAUNCH_LEADS_ORPHAN_UPGRADE_TEST_DATABASE_URL is required for the CI upgrade test",
    );
    const databaseName = disposableDatabaseName(databaseUrl);
    recreateDisposableDatabase(databaseUrl, databaseName);
    let prisma: PrismaClient | undefined;

    try {
      runPrisma(databaseUrl, [
        "db",
        "execute",
        "--url",
        databaseUrl,
        "--file",
        resolve(migrationsDir, "0_init/migration.sql"),
      ]);
      runPrisma(databaseUrl, [
        "db",
        "execute",
        "--url",
        databaseUrl,
        "--file",
        resolve(
          migrationsDir,
          "20260725120000_add_launch_leads/migration.sql",
        ),
      ]);
      runPrisma(databaseUrl, ["migrate", "resolve", "--applied", "0_init"]);
      runPrisma(databaseUrl, [
        "migrate",
        "resolve",
        "--applied",
        "20260725120000_add_launch_leads",
      ]);
      runPrisma(databaseUrl, [
        "db",
        "execute",
        "--url",
        databaseUrl,
        "--file",
        resolve(
          migrationsDir,
          "20260725130000_harden_launch_leads/migration.sql",
        ),
      ]);
      runPrisma(databaseUrl, [
        "migrate",
        "resolve",
        "--applied",
        "20260725130000_harden_launch_leads",
      ]);
      // Simulate a legacy database whose immutable snapshot outlived its
      // taxonomy row. The next migration must repair this state even though
      // 1300 is already recorded as applied.
      runPrisma(
        databaseUrl,
        ["db", "execute", "--url", databaseUrl, "--stdin"],
        `
ALTER TABLE "ProviderLead" DROP CONSTRAINT "ProviderLead_primarySubcategoryId_fkey";
INSERT INTO "Category" ("id", "name", "slug") VALUES ('orphan_upgrade_category', 'Upgrade', 'orphan-upgrade-category');
INSERT INTO "Subcategory" ("id", "categoryId", "name", "slug") VALUES ('orphan_upgrade_valid', 'orphan_upgrade_category', 'Valid', 'orphan-upgrade-valid');
INSERT INTO "ProviderLead" ("id", "updatedAt", "firstName", "phoneE164", "primarySubcategoryId", "additionalSubcategoryIds", "experienceBand", "homeCommune", "serviceCommunes", "consentAt", "consentVersion", "attributionSource", "campaignKey") VALUES ('orphan_upgrade_provider', CURRENT_TIMESTAMP, 'Jean', '+243810203040', 'orphan_primary_snapshot', ARRAY['orphan_upgrade_valid', 'orphan_additional_snapshot'], 'STARTING', 'Lemba', ARRAY[]::TEXT[], CURRENT_TIMESTAMP, 'privacy-v1', 'direct', '["direct",null,null,null]');
INSERT INTO "ClientWaitlistLead" ("id", "updatedAt", "firstName", "phoneE164", "commune", "neededSubcategoryIds", "timing", "consentAt", "consentVersion", "attributionSource", "campaignKey") VALUES ('orphan_upgrade_client', CURRENT_TIMESTAMP, 'Amina', '+243820304050', 'Lemba', ARRAY['orphan_upgrade_valid', 'orphan_needed_snapshot'], 'EXPLORING', CURRENT_TIMESTAMP, 'privacy-v1', 'direct', '["direct",null,null,null]');
ALTER TABLE "ProviderLead" ADD CONSTRAINT "ProviderLead_primarySubcategoryId_fkey" FOREIGN KEY ("primarySubcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
`,
      );
      runPrisma(databaseUrl, ["migrate", "deploy"]);

      prisma = new PrismaClient({
        datasources: { db: { url: databaseUrl } },
      });
      const orphans = await prisma.leadTaxonomySnapshotOrphan.findMany({
        orderBy: [{ leadType: "asc" }, { relationKind: "asc" }],
      });
      assert.deepEqual(
        orphans
          .map(
            (orphan) =>
              `${orphan.leadType}:${orphan.relationKind}:${orphan.subcategoryId}`,
          )
          .sort(),
        [
          "CLIENT:CLIENT_NEEDED:orphan_needed_snapshot",
          "PROVIDER:PROVIDER_ADDITIONAL:orphan_additional_snapshot",
          "PROVIDER:PROVIDER_PRIMARY:orphan_primary_snapshot",
        ],
      );
      assert.equal(
        await prisma.providerLeadAdditionalSubcategory.count({
          where: { providerLeadId: "orphan_upgrade_provider" },
        }),
        1,
      );
      assert.equal(
        await prisma.clientWaitlistLeadSubcategory.count({
          where: { clientLeadId: "orphan_upgrade_client" },
        }),
        1,
      );
      assert.equal(
        (
          await prisma.providerLead.findUniqueOrThrow({
            where: { id: "orphan_upgrade_provider" },
            include: { primarySubcategory: true },
          })
        ).primarySubcategory,
        null,
      );
      assert.equal(
        (
          await prisma.providerLead.findUniqueOrThrow({
            where: { id: "orphan_upgrade_provider" },
          })
        ).primarySubcategoryId,
        "orphan_primary_snapshot",
      );
      await assert.rejects(
        () =>
          prisma!.providerLead.create({
            data: {
              firstName: "Future",
              phoneE164: "+243830405060",
              primarySubcategoryId: "future_missing_snapshot",
              additionalSubcategoryIds: [],
              experienceBand: "STARTING",
              homeCommune: "Lemba",
              serviceCommunes: [],
              consentAt: new Date(),
              consentVersion: "privacy-v1",
              attributionSource: "direct",
              campaignKey: '["direct",null,null,null]',
            },
          }),
        (error: Error & { code?: string }) => error.code === "P2003",
      );
      await assert.rejects(
        () =>
          prisma!.providerLead.create({
            data: {
              firstName: "Missing primary",
              phoneE164: "+243840506070",
              primarySubcategoryId: null,
              additionalSubcategoryIds: [],
              experienceBand: "STARTING",
              homeCommune: "Lemba",
              serviceCommunes: [],
              consentAt: new Date(),
              consentVersion: "privacy-v1",
              attributionSource: "direct",
              campaignKey: '["direct",null,null,null]',
            },
          }),
      );
    } finally {
      await prisma?.$disconnect();
      dropDisposableDatabase(databaseUrl, databaseName);
    }
  },
);
