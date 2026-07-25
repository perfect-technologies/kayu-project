import assert from "node:assert/strict";
import test from "node:test";

const validProvider = {
  firstName: "Jean",
  phone: "0998765432",
  primarySubcategoryId: "sub_primary",
  experienceBand: "STARTING",
  homeCommune: "Lemba",
  operationalConsent: true,
  privacyNoticeVersion: "privacy-v1",
};

const validClient = {
  firstName: "Amina",
  phone: "+243998765432",
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
