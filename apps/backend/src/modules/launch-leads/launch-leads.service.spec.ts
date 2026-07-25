import assert from "node:assert/strict";
import test from "node:test";
import { ConfigService } from "@nestjs/config";
import { LaunchIntakeProtectionService } from "./launch-intake-protection.service";
import {
  LaunchLeadsService,
  formDurationBucket,
  normalizeAttribution,
  normalizeKinshasaPhone,
} from "./launch-leads.service";

const configValues = {
  LAUNCH_PUBLIC_INTAKE_ENABLED: "true",
  LAUNCH_PRIVACY_NOTICE_VERSION: "privacy-v1",
  LAUNCH_RATE_LIMIT_HASH_KEY: "a-32-character-minimum-test-key-value",
  LAUNCH_INTAKE_IP_LIMIT: 100,
  LAUNCH_INTAKE_CONTACT_LIMIT: 100,
  LAUNCH_INTAKE_RATE_WINDOW_SECONDS: 900,
  LAUNCH_INTAKE_MAX_BODY_BYTES: 16_384,
  LAUNCH_INTAKE_RATE_BUCKET_CAPACITY: 10_000,
};

function makeConfig(overrides: Record<string, unknown> = {}) {
  const values = { ...configValues, ...overrides };
  return {
    get: (key: keyof typeof values) => values[key],
  } as unknown as ConfigService;
}

function makePrisma() {
  const providerLeads = new Map<string, Record<string, unknown>>();
  const clientLeads = new Map<string, Record<string, unknown>>();
  const events: Array<Record<string, unknown>> = [];
  const activeSubcategories = new Set([
    "sub_primary",
    "sub_extra",
    "sub_non_priority",
  ]);
  let providerLeadSequence = 0;
  let clientLeadSequence = 0;
  let marketplaceWriteCount = 0;

  const providerLead = {
    findUnique: async (args: { where: { phoneE164: string } }) => {
      const row = providerLeads.get(args.where.phoneE164);
      return row ? { id: row.id } : null;
    },
    create: async (args: {
      data: Record<string, unknown>;
    }) => {
      providerLeadSequence += 1;
      const row = {
        id: `provider_lead_${providerLeadSequence}`,
        status: "SUBMITTED",
        isTest: false,
        ...args.data,
      };
      providerLeads.set(args.data.phoneE164 as string, row);
      return { id: row.id };
    },
  };

  const clientWaitlistLead = {
    findUnique: async (args: { where: { phoneE164: string } }) => {
      const row = clientLeads.get(args.where.phoneE164);
      return row ? { id: row.id } : null;
    },
    create: async (args: {
      data: Record<string, unknown>;
    }) => {
      clientLeadSequence += 1;
      const row = {
        id: `client_lead_${clientLeadSequence}`,
        status: "SUBMITTED",
        isTest: false,
        ...args.data,
      };
      clientLeads.set(args.data.phoneE164 as string, row);
      return { id: row.id };
    },
  };

  const tx = {
    providerLead,
    clientWaitlistLead,
    leadSubmissionEvent: {
      create: async (args: { data: Record<string, unknown> }) => {
        events.push(args.data);
        return args.data;
      },
    },
    user: {
      create: async () => {
        marketplaceWriteCount += 1;
        throw new Error("User creation must never be called");
      },
    },
    provider: {
      create: async () => {
        marketplaceWriteCount += 1;
        throw new Error("Provider creation must never be called");
      },
    },
  };

  return {
    prisma: {
      subcategory: {
        findMany: async (args: { where: { id: { in: string[] } } }) =>
          args.where.id.in
            .filter((id) => activeSubcategories.has(id))
            .map((id) => ({ id })),
      },
      $transaction: async <T>(callback: (client: typeof tx) => Promise<T>) =>
        callback(tx),
    },
    providerLeads,
    clientLeads,
    events,
    getMarketplaceWriteCount: () => marketplaceWriteCount,
  };
}

function makeService() {
  const state = makePrisma();
  const config = makeConfig();
  const protection = new LaunchIntakeProtectionService(config);
  const service = new LaunchLeadsService(
    state.prisma as never,
    config,
    protection,
  );
  return { ...state, service };
}

const providerInput = {
  firstName: "  Jean  ",
  phone: "0810 203 040",
  email: "jean@example.com",
  primarySubcategoryId: "sub_non_priority",
  additionalSubcategoryIds: ["sub_extra"],
  experienceBand: "ONE_TO_THREE_YEARS" as const,
  homeCommune: "Lemba",
  serviceCommunes: ["Limete"],
  hasWhatsApp: true,
  summary: "Disponible en semaine",
  operationalConsent: true as const,
  marketingConsent: true,
  privacyNoticeVersion: "privacy-v1",
  attribution: {
    source: "whatsapp",
    medium: "referral",
    campaign: "kin-launch",
    content: "group-a",
    referrerHost: "example.org",
  },
  formStartedAt: "2026-07-25T09:00:00.000Z",
};

const clientInput = {
  firstName: "Amina",
  phone: "+243810203040",
  commune: "Lemba",
  neededSubcategoryIds: ["sub_non_priority"],
  timing: "WITHIN_7_DAYS" as const,
  preferredContact: "WHATSAPP" as const,
  operationalConsent: true as const,
  marketingConsent: false,
  privacyNoticeVersion: "privacy-v1",
  attribution: { source: "direct" },
};

test("provider submission writes a dedicated lead and audit event only", async () => {
  const state = makeService();

  const result = await state.service.createProviderLead(providerInput, {
    ip: "203.0.113.10",
  });

  assert.deepEqual(result, {
    accepted: true,
    message: "Merci. Votre intérêt a bien été reçu.",
  });
  assert.equal(state.providerLeads.size, 1);
  assert.equal(state.clientLeads.size, 0);
  assert.equal(state.getMarketplaceWriteCount(), 0);

  const lead = state.providerLeads.get("+243810203040");
  assert.ok(lead);
  assert.equal(lead.primarySubcategoryId, "sub_non_priority");
  assert.equal(lead.status, "SUBMITTED");
  assert.equal(lead.consentVersion, "privacy-v1");
  assert.equal(lead.operationalConsent, true);
  assert.equal(lead.marketingConsent, true);
  assert.equal(lead.isTest, false);
  assert.equal(state.events.length, 1);
  assert.equal(state.events[0]?.leadType, "PROVIDER");
  assert.equal(state.events[0]?.isRefresh, false);
  assert.equal(state.events[0]?.outcome, "CREATED");
  assert.notEqual(state.events[0]?.contactHash, "+243810203040");
  assert.notEqual(state.events[0]?.ipHash, "203.0.113.10");
});

test("anonymous duplicate is review-only and cannot overwrite fields or grant marketing consent", async () => {
  const state = makeService();
  await state.service.createProviderLead({
    ...providerInput,
    marketingConsent: false,
  });

  const lead = state.providerLeads.get("+243810203040");
  assert.ok(lead);
  lead.status = "QUALIFIED";
  lead.privateNotes = "admin-only note";
  const originalConsentAt = lead.consentAt;
  const originalLastSubmittedAt = lead.lastSubmittedAt;

  const response = await state.service.createProviderLead({
    ...providerInput,
    firstName: "Attacker",
    email: "attacker@example.com",
    marketingConsent: true,
    homeCommune: "Gombe",
  });

  assert.deepEqual(response, {
    accepted: true,
    message: "Merci. Votre intérêt a bien été reçu.",
  });
  assert.equal(state.providerLeads.size, 1);
  assert.equal(lead.firstName, providerInput.firstName);
  assert.equal(lead.emailNormalized, providerInput.email);
  assert.equal(lead.homeCommune, providerInput.homeCommune);
  assert.equal(lead.status, "QUALIFIED");
  assert.equal(lead.privateNotes, "admin-only note");
  assert.equal(lead.marketingConsent, false);
  assert.equal(lead.marketingConsentAt, null);
  assert.equal(lead.consentAt, originalConsentAt);
  assert.equal(lead.lastSubmittedAt, originalLastSubmittedAt);
  assert.equal(state.events.length, 2);
  assert.equal(state.events[1]?.isRefresh, true);
  assert.equal(state.events[1]?.outcome, "DUPLICATE_REVIEW_REQUIRED");
  assert.equal(state.events[1]?.marketingConsent, false);
});

test("the same normalized phone may exist independently in provider and client leads", async () => {
  const state = makeService();
  await state.service.createProviderLead(providerInput);
  await state.service.createClientLead(clientInput);

  assert.equal(state.providerLeads.size, 1);
  assert.equal(state.clientLeads.size, 1);
  assert.equal(state.events.length, 2);
  assert.equal(state.getMarketplaceWriteCount(), 0);
});

test("inactive or unknown subcategories are rejected without creating a lead", async () => {
  const state = makeService();

  await assert.rejects(
    state.service.createClientLead({
      ...clientInput,
      neededSubcategoryIds: ["inactive_subcategory"],
    }),
    /catégories de service/,
  );
  assert.equal(state.clientLeads.size, 0);
});

test("honeypot submissions receive the generic response without persistence", async () => {
  const state = makeService();

  const result = await state.service.createClientLead({
    ...clientInput,
    website: "https://spam.invalid",
  });

  assert.equal(result.accepted, true);
  assert.equal(state.clientLeads.size, 0);
  assert.equal(state.events.length, 0);
});

test("normalizes supported RDC phone representations and rejects foreign numbers", async () => {
  assert.equal(await normalizeKinshasaPhone("0810 203 040"), "+243810203040");
  assert.equal(await normalizeKinshasaPhone("810203040"), "+243810203040");
  assert.equal(await normalizeKinshasaPhone("243810203040"), "+243810203040");
  assert.equal(await normalizeKinshasaPhone("+243 810 203 040"), "+243810203040");
  await assert.rejects(normalizeKinshasaPhone("+242061234567"), /RDC/);
});

test("rejects phone length boundaries, non-mobile prefixes, and placeholders", async () => {
  await assert.rejects(normalizeKinshasaPhone("81020304"), /plausible/);
  await assert.rejects(normalizeKinshasaPhone("8102030400"), /plausible/);
  await assert.rejects(normalizeKinshasaPhone("+243710203040"), /plausible/);
  await assert.rejects(normalizeKinshasaPhone("+243900000000"), /plausible/);
  await assert.rejects(normalizeKinshasaPhone("+243999999999"), /plausible/);
  await assert.rejects(normalizeKinshasaPhone("+243123456789"), /plausible/);
});

test("campaign keys preserve empty attribution positions without collisions", () => {
  const mediumOnly = normalizeAttribution({
    source: "facebook",
    medium: "referral",
  }).campaignKey;
  const campaignOnly = normalizeAttribution({
    source: "facebook",
    campaign: "referral",
  }).campaignKey;

  assert.notEqual(mediumOnly, campaignOnly);
  assert.equal(
    mediumOnly,
    '["facebook","referral",null,null]',
  );
  assert.equal(
    campaignOnly,
    '["facebook",null,"referral",null]',
  );
});

test("buckets form duration without persisting raw timing intervals", () => {
  const submittedAt = new Date("2026-07-25T09:01:00.000Z");
  assert.equal(
    formDurationBucket("2026-07-25T09:00:00.000Z", submittedAt),
    "FROM_31_TO_90_SECONDS",
  );
  assert.equal(formDurationBucket(undefined, submittedAt), "UNKNOWN");
  assert.equal(
    formDurationBucket("2026-07-25T09:02:00.000Z", submittedAt),
    "UNKNOWN",
  );
});
