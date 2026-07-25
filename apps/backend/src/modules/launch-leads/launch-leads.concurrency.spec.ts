import assert from "node:assert/strict";
import test from "node:test";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma.service";
import { LaunchIntakeProtectionService } from "./launch-intake-protection.service";
import { LaunchLeadsService } from "./launch-leads.service";

const databaseUrl = process.env.LAUNCH_LEADS_TEST_DATABASE_URL;

test(
  "concurrent first submissions produce one immutable lead and atomic outcomes",
  { skip: !databaseUrl },
  async () => {
    process.env.DATABASE_URL = databaseUrl;
    const prisma = new PrismaService();
    await prisma.onModuleInit();

    const configValues: Record<string, unknown> = {
      LAUNCH_PUBLIC_INTAKE_ENABLED: "true",
      LAUNCH_PRIVACY_NOTICE_VERSION: "privacy-v1",
      LAUNCH_RATE_LIMIT_HASH_KEY: "a-32-character-minimum-concurrency-key",
      LAUNCH_INTAKE_IP_LIMIT: 100,
      LAUNCH_INTAKE_CONTACT_LIMIT: 100,
      LAUNCH_INTAKE_RATE_WINDOW_SECONDS: 900,
      LAUNCH_INTAKE_MAX_BODY_BYTES: 16_384,
      LAUNCH_INTAKE_RATE_BUCKET_CAPACITY: 10_000,
    };
    const config = {
      get: (key: string) => configValues[key],
    } as ConfigService;
    const service = new LaunchLeadsService(
      prisma,
      config,
      new LaunchIntakeProtectionService(config),
    );

    try {
      await prisma.leadSubmissionEvent.deleteMany();
      await prisma.providerLead.deleteMany();
      await prisma.clientWaitlistLead.deleteMany();
      await prisma.subcategory.deleteMany({
        where: { categoryId: "lead_concurrency_category" },
      });
      await prisma.category.deleteMany({
        where: { id: "lead_concurrency_category" },
      });

      await prisma.category.create({
        data: {
          id: "lead_concurrency_category",
          name: "Concurrency category",
          slug: "lead-concurrency-category",
          isActive: true,
          subcategories: {
            create: [
              {
                id: "lead_concurrency_primary",
                name: "Primary",
                slug: "lead-concurrency-primary",
                isActive: true,
              },
              {
                id: "lead_concurrency_additional",
                name: "Additional",
                slug: "lead-concurrency-additional",
                isActive: true,
              },
            ],
          },
        },
      });

      const common = {
        phone: "+243850607080",
        primarySubcategoryId: "lead_concurrency_primary",
        additionalSubcategoryIds: ["lead_concurrency_additional"],
        experienceBand: "STARTING" as const,
        homeCommune: "Lemba",
        serviceCommunes: [],
        operationalConsent: true as const,
        marketingConsent: false,
        privacyNoticeVersion: "privacy-v1",
      };

      await Promise.all([
        service.createProviderLead(
          {
            ...common,
            firstName: "First",
            attribution: { source: "facebook" },
          },
          { ip: "203.0.113.10" },
        ),
        service.createProviderLead(
          {
            ...common,
            firstName: "Second",
            attribution: { source: "instagram" },
          },
          { ip: "203.0.113.11" },
        ),
      ]);

      const lead = await prisma.providerLead.findUniqueOrThrow({
        where: { phoneE164: "+243850607080" },
      });
      const firstEvents = await prisma.leadSubmissionEvent.findMany({
        where: { providerLeadId: lead.id },
        orderBy: { submittedAt: "asc" },
      });

      assert.equal(await prisma.providerLead.count(), 1);
      assert.equal(firstEvents.length, 2);
      assert.equal(
        firstEvents.filter((event) => event.outcome === "CREATED").length,
        1,
      );
      assert.equal(
        firstEvents.filter(
          (event) => event.outcome === "DUPLICATE_REVIEW_REQUIRED",
        ).length,
        1,
      );
      const createdEvent = firstEvents.find(
        (event) => event.outcome === "CREATED",
      );
      assert.ok(createdEvent);
      assert.equal(createdEvent.attributionSource, lead.attributionSource);
      assert.equal(
        await prisma.providerLeadAdditionalSubcategory.count({
          where: { providerLeadId: lead.id },
        }),
        1,
      );
      await assert.rejects(
        () =>
          prisma.subcategory.delete({
            where: { id: "lead_concurrency_primary" },
          }),
        (error: Error & { code?: string }) => error.code === "P2003",
      );

      await service.createProviderLead(
        {
          ...common,
          firstName: "Attacker",
          email: "attacker@example.com",
          homeCommune: "Gombe",
          marketingConsent: true,
          attribution: { source: "other" },
        },
        { ip: "203.0.113.12" },
      );

      const unchanged = await prisma.providerLead.findUniqueOrThrow({
        where: { id: lead.id },
      });
      const allEvents = await prisma.leadSubmissionEvent.findMany({
        where: { providerLeadId: lead.id },
      });
      assert.equal(unchanged.firstName, lead.firstName);
      assert.equal(unchanged.emailNormalized, null);
      assert.equal(unchanged.homeCommune, "Lemba");
      assert.equal(unchanged.marketingConsent, false);
      assert.equal(allEvents.length, 3);
      assert.equal(
        allEvents
          .filter((event) => event.outcome === "DUPLICATE_REVIEW_REQUIRED")
          .every((event) => event.marketingConsent === false),
        true,
      );
      assert.equal(await prisma.user.count(), 0);
      assert.equal(await prisma.provider.count(), 0);
    } finally {
      await prisma.leadSubmissionEvent.deleteMany();
      await prisma.providerLead.deleteMany();
      await prisma.clientWaitlistLead.deleteMany();
      await prisma.subcategory.deleteMany({
        where: { categoryId: "lead_concurrency_category" },
      });
      await prisma.category.deleteMany({
        where: { id: "lead_concurrency_category" },
      });
      await prisma.onModuleDestroy();
    }
  },
);
