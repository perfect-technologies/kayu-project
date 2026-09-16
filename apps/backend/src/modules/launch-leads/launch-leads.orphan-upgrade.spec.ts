import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { resolve } from "node:path";
import test from "node:test";

const databaseUrl = process.env.LAUNCH_LEADS_ORPHAN_UPGRADE_TEST_DATABASE_URL;
const requireDatabase =
  process.env.LAUNCH_LEADS_REQUIRE_ORPHAN_UPGRADE_DATABASE === "true";
const backendDir = resolve(__dirname, "../../..");

function runPrisma(databaseUrlForCommand: string, args: string[]): void {
  execFileSync("pnpm", ["exec", "prisma", ...args], {
    cwd: backendDir,
    env: { ...process.env, DATABASE_URL: databaseUrlForCommand },
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

const leadConsent = {
  consentAt: new Date(),
  consentVersion: "privacy-v1",
  attributionSource: "direct",
  campaignKey: '["direct",null,null,null]',
};

test(
  "baseline preserves orphaned lead taxonomy snapshots while enforcing future references",
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
      runPrisma(databaseUrl, ["migrate", "deploy"]);

      prisma = new PrismaClient({
        datasources: { db: { url: databaseUrl } },
      });
      const applied = await prisma.$queryRaw<Array<{ migration_name: string }>>`
        SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL
      `;
      assert.deepEqual(
        applied.map((row) => row.migration_name),
        ["0_init"],
      );

      await prisma.category.create({
        data: {
          id: "orphan_upgrade_category",
          name: "Upgrade",
          slug: "orphan-upgrade-category",
          subcategories: {
            create: {
              id: "orphan_upgrade_valid",
              name: "Valid",
              slug: "orphan-upgrade-valid",
            },
          },
        },
      });

      // A restored pre-baseline lead keeps its immutable snapshot arrays,
      // including taxonomy IDs that no longer resolve; only valid IDs get
      // normalized links, and the missing ones are recorded as orphans.
      await prisma.providerLead.create({
        data: {
          ...leadConsent,
          id: "orphan_upgrade_provider",
          firstName: "Jean",
          phoneE164: "+243810203040",
          primarySubcategoryId: "orphan_upgrade_valid",
          additionalSubcategoryIds: [
            "orphan_upgrade_valid",
            "orphan_additional_snapshot",
          ],
          additionalSubcategories: {
            create: { subcategoryId: "orphan_upgrade_valid" },
          },
          experienceBand: "STARTING",
          homeCommune: "Lemba",
          serviceCommunes: [],
        },
      });
      await prisma.clientWaitlistLead.create({
        data: {
          ...leadConsent,
          id: "orphan_upgrade_client",
          firstName: "Amina",
          phoneE164: "+243820304050",
          commune: "Lemba",
          neededSubcategoryIds: [
            "orphan_upgrade_valid",
            "orphan_needed_snapshot",
          ],
          neededSubcategories: {
            create: { subcategoryId: "orphan_upgrade_valid" },
          },
          timing: "EXPLORING",
        },
      });
      const orphanRows = [
        {
          id: "lead_taxonomy_orphan_provider_orphan_upgrade_provider_primary",
          leadType: "PROVIDER" as const,
          leadId: "orphan_upgrade_provider",
          relationKind: "PROVIDER_PRIMARY" as const,
          subcategoryId: "orphan_primary_snapshot",
        },
        {
          id: "lead_taxonomy_orphan_provider_orphan_upgrade_provider_additional_orphan_additional_snapshot",
          leadType: "PROVIDER" as const,
          leadId: "orphan_upgrade_provider",
          relationKind: "PROVIDER_ADDITIONAL" as const,
          subcategoryId: "orphan_additional_snapshot",
        },
        {
          id: "lead_taxonomy_orphan_client_orphan_upgrade_client_needed_orphan_needed_snapshot",
          leadType: "CLIENT" as const,
          leadId: "orphan_upgrade_client",
          relationKind: "CLIENT_NEEDED" as const,
          subcategoryId: "orphan_needed_snapshot",
        },
      ];
      await prisma.leadTaxonomySnapshotOrphan.createMany({ data: orphanRows });

      const orphans = await prisma.leadTaxonomySnapshotOrphan.findMany();
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
      await assert.rejects(
        () =>
          prisma!.leadTaxonomySnapshotOrphan.create({
            data: { ...orphanRows[0], id: "duplicate_orphan_snapshot" },
          }),
        (error: Error & { code?: string }) => error.code === "P2002",
      );
      assert.deepEqual(
        (
          await prisma.providerLead.findUniqueOrThrow({
            where: { id: "orphan_upgrade_provider" },
          })
        ).additionalSubcategoryIds,
        ["orphan_upgrade_valid", "orphan_additional_snapshot"],
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

      await assert.rejects(
        () =>
          prisma!.providerLead.create({
            data: {
              ...leadConsent,
              firstName: "Future",
              phoneE164: "+243830405060",
              primarySubcategoryId: "future_missing_snapshot",
              additionalSubcategoryIds: [],
              experienceBand: "STARTING",
              homeCommune: "Lemba",
              serviceCommunes: [],
            },
          }),
        (error: Error & { code?: string }) => error.code === "P2003",
      );
      await assert.rejects(
        () =>
          prisma!.providerLead.create({
            data: {
              ...leadConsent,
              firstName: "Missing primary",
              phoneE164: "+243840506070",
              primarySubcategoryId: null,
              additionalSubcategoryIds: [],
              experienceBand: "STARTING",
              homeCommune: "Lemba",
              serviceCommunes: [],
            },
          }),
        /ProviderLead_primarySubcategoryId_required/,
      );
      await assert.rejects(
        () =>
          prisma!.clientWaitlistLeadSubcategory.create({
            data: {
              clientLeadId: "orphan_upgrade_client",
              subcategoryId: "orphan_needed_snapshot",
            },
          }),
        (error: Error & { code?: string }) => error.code === "P2003",
      );
      await assert.rejects(
        () =>
          prisma!.subcategory.delete({
            where: { id: "orphan_upgrade_valid" },
          }),
        (error: Error & { code?: string }) => error.code === "P2003",
      );
      await assert.rejects(
        () =>
          prisma!.leadSubmissionEvent.create({
            data: {
              leadType: "PROVIDER",
              providerLeadId: "orphan_upgrade_provider",
              clientLeadId: "orphan_upgrade_client",
              outcome: "CREATED",
              consentVersion: leadConsent.consentVersion,
              operationalConsent: true,
              attributionSource: leadConsent.attributionSource,
              campaignKey: leadConsent.campaignKey,
              contactHash: "orphan-upgrade-contact",
            },
          }),
        /LeadSubmissionEvent_exactly_one_lead_check/,
      );
    } finally {
      await prisma?.$disconnect();
      dropDisposableDatabase(databaseUrl, databaseName);
    }
  },
);
