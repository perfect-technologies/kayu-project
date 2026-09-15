import assert from "node:assert/strict";
import test from "node:test";

const validProvider = {
  firstName: "Jean",
  phone: "0810203040",
  primarySubcategoryId: "sub_primary",
  experienceBand: "STARTING",
  homeCommune: "Lemba",
  operationalConsent: true,
  privacyNoticeVersion: "privacy-v1",
};

const validClient = {
  firstName: "Amina",
  phone: "+243810203040",
  commune: "Limete",
  neededSubcategoryIds: ["sub_primary"],
  timing: "EXPLORING",
  operationalConsent: true,
  privacyNoticeVersion: "privacy-v1",
};

test("provider contract applies defaults and rejects public lifecycle fields", async () => {
  const { CreateProviderLeadDto } = await import("@kayu/schemas");
  const parsed = CreateProviderLeadDto.parse(validProvider);
  assert.deepEqual(parsed.additionalSubcategoryIds, []);
  assert.deepEqual(parsed.serviceCommunes, []);
  assert.equal(parsed.marketingConsent, false);

  assert.equal(
    CreateProviderLeadDto.safeParse({
      ...validProvider,
      status: "QUALIFIED",
    }).success,
    false,
  );
});

test("client contract rejects duplicate IDs, unsafe attribution, and unknown fields", async () => {
  const { CreateClientLeadDto } = await import("@kayu/schemas");

  assert.equal(
    CreateClientLeadDto.safeParse({
      ...validClient,
      neededSubcategoryIds: ["sub_primary", "sub_primary"],
    }).success,
    false,
  );
  assert.equal(
    CreateClientLeadDto.safeParse({
      ...validClient,
      attribution: {
        source: "unknown-ad-network",
      },
    }).success,
    false,
  );
  assert.equal(
    CreateClientLeadDto.safeParse({
      ...validClient,
      attribution: {
        source: "facebook",
        referrerHost: "https://example.com/path?phone=123",
      },
    }).success,
    false,
  );
  assert.equal(
    CreateClientLeadDto.safeParse({
      ...validClient,
      privateNotes: "must not be accepted",
    }).success,
    false,
  );
});

test("lead summaries, category counts, and communes are bounded", async () => {
  const { CreateClientLeadDto, CreateProviderLeadDto } =
    await import("@kayu/schemas");

  assert.equal(
    CreateClientLeadDto.safeParse({
      ...validClient,
      needSummary: "x".repeat(301),
    }).success,
    false,
  );
  assert.equal(
    CreateClientLeadDto.safeParse({
      ...validClient,
      neededSubcategoryIds: ["one", "two", "three", "four"],
    }).success,
    false,
  );
  assert.equal(
    CreateProviderLeadDto.safeParse({
      ...validProvider,
      homeCommune: "Paris",
    }).success,
    false,
  );
});

test("funnel contract accepts only allowlisted non-PII dimensions", async () => {
  const { CreateLaunchFunnelEventDto } = await import("@kayu/schemas");
  const valid = {
    schemaVersion: 1,
    eventName: "launch_form_validation_failed",
    occurredAt: new Date().toISOString(),
    route: "/launch/providers",
    deviceClass: "mobile",
    leadType: "PROVIDER",
    validationField: "phone",
    validationErrorCode: "invalid_format",
    attribution: {
      source: "facebook",
      medium: "paid_social",
      campaign: "kin-launch",
    },
  };

  assert.equal(CreateLaunchFunnelEventDto.safeParse(valid).success, true);
  for (const forbidden of [
    { phone: "+243810203040" },
    { email: "person@example.com" },
    { firstName: "Amina" },
    { freeText: "typed form value" },
    { cookie: "secret" },
    { sessionId: "session" },
    { userId: "user" },
  ]) {
    assert.equal(
      CreateLaunchFunnelEventDto.safeParse({
        ...valid,
        ...forbidden,
      }).success,
      false,
    );
  }
  assert.equal(
    CreateLaunchFunnelEventDto.safeParse({
      ...valid,
      attribution: {
        source: "facebook",
        campaign: "person@example.com",
      },
    }).success,
    false,
  );
  assert.equal(
    CreateLaunchFunnelEventDto.safeParse({
      ...valid,
      attribution: {
        source: "referral",
        referrerHost: "243810203040.example.org",
      },
    }).success,
    false,
  );
});

test("funnel contract enforces event-specific fields and canonical routes", async () => {
  const { CreateLaunchFunnelEventDto } = await import("@kayu/schemas");
  const baseEvent = {
    schemaVersion: 1,
    occurredAt: new Date().toISOString(),
    route: "/launch",
    deviceClass: "desktop",
  };

  assert.equal(
    CreateLaunchFunnelEventDto.safeParse({
      ...baseEvent,
      eventName: "launch_landing_viewed",
    }).success,
    true,
  );
  assert.equal(
    CreateLaunchFunnelEventDto.safeParse({
      ...baseEvent,
      eventName: "launch_form_started",
    }).success,
    false,
  );
  assert.equal(
    CreateLaunchFunnelEventDto.safeParse({
      ...baseEvent,
      eventName: "launch_landing_viewed",
      route: "/?phone=secret",
    }).success,
    false,
  );
});
