import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCampaignEvent,
  completionTimeBucket,
  deviceClassForWidth,
  mergeCampaignAttribution,
  parseCampaignAttribution,
  submitCampaignLead,
} from "./campaign-leads.ts";

test("campaign attribution is bounded, normalized, and stores only the referrer host", () => {
  const attribution = parseCampaignAttribution(
    "?utm_source=FaceBook&utm_medium=Paid%20Social&utm_campaign=Beta%20Kinshasa&utm_content=plomberie&phone=%2B243999",
    "https://example.org/a/private/path?token=secret",
  );

  assert.deepEqual(attribution, {
    source: "facebook",
    medium: "paid social",
    campaign: "Beta Kinshasa",
    content: "plomberie",
    referrerHost: "example.org",
  });
  assert.equal(JSON.stringify(attribution).includes("243999"), false);
  assert.equal(JSON.stringify(attribution).includes("token"), false);
});

test("current campaign values override stored values without dropping prior fields", () => {
  assert.deepEqual(
    mergeCampaignAttribution(
      { source: "referral", medium: "whatsapp", campaign: "cycle-1" },
      { source: "facebook", content: "electricite" },
    ),
    {
      source: "facebook",
      medium: "whatsapp",
      campaign: "cycle-1",
      content: "electricite",
    },
  );
});

test("campaign events contain only privacy-safe funnel dimensions", () => {
  const event = buildCampaignEvent("launch_form_validation_failed", {
    leadType: "provider",
    field: "phone",
    errorCode: "required",
    deviceWidth: 360,
    attribution: {
      source: "whatsapp",
      referrerHost: "private.example",
    },
  });

  assert.deepEqual(event, {
    event: "launch_form_validation_failed",
    deviceClass: "mobile",
    leadType: "provider",
    field: "phone",
    errorCode: "required",
    source: "whatsapp",
  });
  assert.equal("referrerHost" in event, false);
});

test("device and completion buckets use the documented boundaries", () => {
  assert.equal(deviceClassForWidth(320), "mobile");
  assert.equal(deviceClassForWidth(768), "tablet");
  assert.equal(deviceClassForWidth(1_024), "desktop");
  assert.equal(completionTimeBucket(30_000), "<=30s");
  assert.equal(completionTimeBucket(90_000), "61-90s");
  assert.equal(completionTimeBucket(90_001), ">90s");
});

test("lead submission uses the explicit public endpoint without auth credentials", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, init) => {
    requests.push({ url, init });
    return new Response(
      JSON.stringify({
        accepted: true,
        message: "Merci. Votre intérêt a bien été reçu.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  try {
    await submitCampaignLead("client", {
      firstName: "Essai",
      phone: "+243999000000",
      commune: "Gombe",
      neededSubcategoryIds: ["subcategory-id"],
      timing: "EXPLORING",
      operationalConsent: true,
      privacyNoticeVersion: "campaign-2026-07-25",
      attribution: { source: "whatsapp" },
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "/api/launch/client-leads");
  assert.equal(requests[0].init.method, "POST");
  assert.equal(requests[0].init.credentials, "omit");
  assert.equal(requests[0].init.cache, "no-store");
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    firstName: "Essai",
    phone: "+243999000000",
    commune: "Gombe",
    neededSubcategoryIds: ["subcategory-id"],
    timing: "EXPLORING",
    operationalConsent: true,
    privacyNoticeVersion: "campaign-2026-07-25",
    attribution: { source: "whatsapp" },
  });
});
