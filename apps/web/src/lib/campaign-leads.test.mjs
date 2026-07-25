import assert from "node:assert/strict";
import test from "node:test";

import {
  CampaignLeadSubmissionError,
  buildCampaignEvent,
  buildLaunchFunnelEventRequest,
  campaignSubmissionErrorCopy,
  completionTimeBucket,
  deviceClassForWidth,
  emitCampaignEventOnce,
  mergeCampaignAttribution,
  normalizeCampaignPhone,
  parseCampaignAttribution,
  persistCampaignEvent,
  submitCampaignLead,
} from "./campaign-leads.ts";

test("campaign attribution is bounded, normalized, and stores only the referrer host", () => {
  const attribution = parseCampaignAttribution(
    "?utm_source=FaceBook&utm_medium=Paid%20Social&utm_campaign=Beta%20Kinshasa&utm_content=plomberie&phone=%2B243999",
    "https://example.org/a/private/path?token=secret",
  );

  assert.deepEqual(attribution, {
    source: "facebook",
    medium: "paid_social",
    campaign: "beta-kinshasa",
    content: "plomberie",
    referrerHost: "example.org",
  });
  assert.equal(JSON.stringify(attribution).includes("243999"), false);
  assert.equal(JSON.stringify(attribution).includes("token"), false);
});

test("ordinary UTM values map to the strict shared attribution contract", () => {
  assert.deepEqual(
    parseCampaignAttribution(
      "?utm_source=LinkedIn&utm_medium=email&utm_campaign=Lancement%20Kinshasa%20%232&utm_content=Hero%20CTA",
    ),
    {
      source: "other",
      campaign: "lancement-kinshasa-2",
      content: "hero-cta",
    },
  );
  assert.deepEqual(
    parseCampaignAttribution("?utm_source=ig&utm_medium=cpc"),
    {
      source: "instagram",
      medium: "paid_social",
    },
  );
});

test("campaign attribution drops contact-shaped keys before any client boundary", () => {
  assert.deepEqual(
    parseCampaignAttribution(
      "?utm_source=whatsapp&utm_campaign=person%40example.com&utm_content=243998765432",
    ),
    { source: "whatsapp" },
  );
});

test("a new source starts a clean last-touch attribution record", () => {
  assert.deepEqual(
    mergeCampaignAttribution(
      { source: "referral", medium: "whatsapp", campaign: "cycle-1" },
      { source: "facebook", content: "electricite" },
    ),
    {
      source: "facebook",
      content: "electricite",
    },
  );
});

test("source-only visits cannot inherit fabricated channel dimensions", () => {
  assert.deepEqual(
    mergeCampaignAttribution(
      {
        source: "instagram",
        medium: "paid_social",
        campaign: "spring-campaign",
        content: "hero-a",
      },
      { source: "whatsapp" },
    ),
    { source: "whatsapp" },
  );

  assert.deepEqual(
    mergeCampaignAttribution(
      {
        source: "instagram",
        medium: "paid_social",
        campaign: "spring-campaign",
      },
      { campaign: "orphan-campaign" },
    ),
    {
      source: "instagram",
      medium: "paid_social",
      campaign: "spring-campaign",
    },
  );
});

test("campaign phone handling matches the shared DRC normalization", () => {
  for (const input of [
    "0998 765 432",
    "998765432",
    "243998765432",
    "+243 998 765 432",
  ]) {
    assert.equal(normalizeCampaignPhone(input), "+243998765432", input);
  }
  assert.equal(normalizeCampaignPhone("+242 066 000 000"), null);
  assert.equal(normalizeCampaignPhone("+243 999 999 999"), null);
  assert.equal(normalizeCampaignPhone("123"), null);
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

test("the durable funnel request matches the strict shared backend contract", () => {
  assert.deepEqual(
    buildLaunchFunnelEventRequest(
      "launch_form_validation_failed",
      {
        leadType: "provider",
        field: "subcategoryId",
        errorCode: "required",
        attribution: {
          source: "instagram",
          medium: "paid_social",
          campaign: "kinshasa-1",
          referrerHost: "private.example",
        },
      },
      {
        deviceWidth: 390,
        pathname: "/launch/providers",
        occurredAt: "2026-07-25T12:00:00.000Z",
      },
    ),
    {
      schemaVersion: 1,
      eventName: "launch_form_validation_failed",
      occurredAt: "2026-07-25T12:00:00.000Z",
      route: "/launch/providers",
      deviceClass: "mobile",
      leadType: "PROVIDER",
      validationField: "primarySubcategoryId",
      validationErrorCode: "required",
      attribution: {
        source: "instagram",
        medium: "paid_social",
        campaign: "kinshasa-1",
      },
    },
  );
});

test("the owned collector receives each keyed event once and returns a receipt without PII", async () => {
  const originalWindow = globalThis.window;
  const originalCustomEvent = globalThis.CustomEvent;
  const originalFetch = globalThis.fetch;
  const received = [];
  const collectorRequests = [];
  class TestCustomEvent {
    constructor(type, init) {
      this.type = type;
      this.detail = init.detail;
    }
  }
  globalThis.CustomEvent = TestCustomEvent;
  globalThis.window = {
    innerWidth: 390,
    location: { pathname: "/launch/clients" },
    dataLayer: [],
    dispatchEvent(event) {
      received.push(event.detail);
      return true;
    },
  };
  globalThis.fetch = async (url, init) => {
    collectorRequests.push({ url, init });
    return new Response(JSON.stringify({ accepted: true }), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const deliveredKeys = new Set();
    for (let attempt = 0; attempt < 2; attempt += 1) {
      emitCampaignEventOnce(
        deliveredKeys,
        "client:form-started",
        "launch_form_started",
        {
          leadType: "client",
          attribution: { source: "whatsapp", campaign: "cycle-1" },
          phone: "+243998765432",
          email: "person@example.com",
        },
      );
    }

    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(received.length, 1);
    assert.equal(globalThis.window.dataLayer.length, 1);
    assert.deepEqual(received[0], globalThis.window.dataLayer[0]);
    assert.equal(collectorRequests.length, 1);
    assert.equal(collectorRequests[0].url, "/api/launch/funnel-events");
    assert.equal(collectorRequests[0].init.credentials, "omit");
    assert.equal(collectorRequests[0].init.keepalive, true);
    assert.deepEqual(JSON.parse(collectorRequests[0].init.body), {
      schemaVersion: 1,
      eventName: "launch_form_started",
      occurredAt: JSON.parse(collectorRequests[0].init.body).occurredAt,
      route: "/launch/clients",
      deviceClass: "mobile",
      leadType: "CLIENT",
      attribution: { source: "whatsapp", campaign: "cycle-1" },
    });
    const serialized = JSON.stringify(received[0]);
    const durableSerialized = collectorRequests[0].init.body;
    assert.equal(serialized.includes("243999"), false);
    assert.equal(serialized.includes("person@example.com"), false);
    assert.equal(durableSerialized.includes("243999"), false);
    assert.equal(durableSerialized.includes("person@example.com"), false);
  } finally {
    globalThis.window = originalWindow;
    globalThis.CustomEvent = originalCustomEvent;
    globalThis.fetch = originalFetch;
  }
});

test("the optional diagnostics bridge remains isolated from collector failures", async () => {
  const originalWindow = globalThis.window;
  const originalCustomEvent = globalThis.CustomEvent;
  const originalFetch = globalThis.fetch;
  globalThis.CustomEvent = undefined;
  globalThis.window = {
    innerWidth: 390,
    location: { pathname: "/" },
    dataLayer: [],
    dispatchEvent() {
      throw new Error("DOM bridge unavailable");
    },
  };
  globalThis.fetch = async () => {
    throw new Error("collector unavailable");
  };

  try {
    emitCampaignEventOnce(
      new Set(),
      "provider:selected",
      "launch_role_selected",
      { leadType: "provider" },
    );
    assert.equal(globalThis.window.dataLayer.length, 1);
    assert.equal(
      globalThis.window.dataLayer[0].event,
      "launch_role_selected",
    );
    assert.equal(
      await persistCampaignEvent(
        "launch_role_selected",
        { leadType: "provider" },
        { pathname: "/", deviceWidth: 390 },
      ),
      false,
    );
  } finally {
    globalThis.window = originalWindow;
    globalThis.CustomEvent = originalCustomEvent;
    globalThis.fetch = originalFetch;
  }
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
      phone: "+243998765432",
      commune: "Gombe",
      neededSubcategoryIds: ["subcategory-id"],
      timing: "EXPLORING",
      operationalConsent: true,
      privacyNoticeVersion: "campaign-2026-07-25",
      formStartedAt: "2026-07-25T12:00:00.000Z",
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
    phone: "+243998765432",
    commune: "Gombe",
    neededSubcategoryIds: ["subcategory-id"],
    timing: "EXPLORING",
    operationalConsent: true,
    privacyNoticeVersion: "campaign-2026-07-25",
    formStartedAt: "2026-07-25T12:00:00.000Z",
    attribution: { source: "whatsapp" },
  });
});

test("submission preserves safe status, code, and retry-after semantics", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        statusCode: 429,
        code: "LAUNCH_RATE_LIMITED",
        message: "Trop de demandes.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "120",
        },
      },
    );

  try {
    await assert.rejects(
      submitCampaignLead("client", {
        firstName: "Essai",
        phone: "+243998765432",
        commune: "Gombe",
        neededSubcategoryIds: ["subcategory-id"],
        timing: "EXPLORING",
        operationalConsent: true,
        privacyNoticeVersion: "campaign-2026-07-25",
      }),
      (error) => {
        assert.ok(error instanceof CampaignLeadSubmissionError);
        assert.equal(error.kind, "rate_limited");
        assert.equal(error.status, 429);
        assert.equal(error.code, "LAUNCH_RATE_LIMITED");
        assert.equal(error.retryAfterSeconds, 120);
        return true;
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("submission errors produce distinct, actionable French states", () => {
  assert.match(
    campaignSubmissionErrorCopy(
      new CampaignLeadSubmissionError("validation", 422),
    ),
    /Vérifiez le formulaire/,
  );
  assert.match(
    campaignSubmissionErrorCopy(
      new CampaignLeadSubmissionError("stale_privacy", 400),
    ),
    /notice de confidentialité a changé/,
  );
  assert.match(
    campaignSubmissionErrorCopy(
      new CampaignLeadSubmissionError(
        "rate_limited",
        429,
        "LAUNCH_RATE_LIMITED",
        120,
      ),
    ),
    /2 min/,
  );
  assert.match(
    campaignSubmissionErrorCopy(
      new CampaignLeadSubmissionError("intake_disabled", 503),
    ),
    /momentanément fermées/,
  );
  assert.match(
    campaignSubmissionErrorCopy(new CampaignLeadSubmissionError("network")),
    /Connexion interrompue/,
  );
});

test("submission distinguishes stale privacy, disabled intake, and network errors", async () => {
  const originalFetch = globalThis.fetch;
  const cases = [
    {
      response: new Response(
        JSON.stringify({
          message:
            "Veuillez accepter la version actuelle de l'avis de confidentialité.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      ),
      kind: "stale_privacy",
    },
    {
      response: new Response(JSON.stringify({ message: "Indisponible" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }),
      kind: "intake_disabled",
    },
  ];

  try {
    for (const item of cases) {
      globalThis.fetch = async () => item.response.clone();
      await assert.rejects(
        submitCampaignLead("provider", {
          firstName: "Essai",
          phone: "+243998765432",
          primarySubcategoryId: "subcategory-id",
          experienceBand: "STARTING",
          homeCommune: "Gombe",
          operationalConsent: true,
          privacyNoticeVersion: "campaign-2026-07-25",
        }),
        (error) =>
          error instanceof CampaignLeadSubmissionError &&
          error.kind === item.kind,
      );
    }

    globalThis.fetch = async () => {
      throw new TypeError("fetch failed with private network details");
    };
    await assert.rejects(
      submitCampaignLead("client", {
        firstName: "Essai",
        phone: "+243998765432",
        commune: "Gombe",
        neededSubcategoryIds: ["subcategory-id"],
        timing: "EXPLORING",
        operationalConsent: true,
        privacyNoticeVersion: "campaign-2026-07-25",
      }),
      (error) =>
        error instanceof CampaignLeadSubmissionError &&
        error.kind === "network" &&
        !error.message.includes("private"),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
