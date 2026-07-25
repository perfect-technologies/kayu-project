import assert from "node:assert/strict";
import test from "node:test";

import { createEmptyCampaignFormValues } from "./campaign-form-state.ts";

test("a role change receives fresh role fields and fresh consent choices", () => {
  const providerValues = createEmptyCampaignFormValues();
  Object.assign(providerValues, {
    firstName: "Amina",
    phone: "+243999000000",
    commune: "Gombe",
    subcategoryId: "provider-subcategory",
    experienceBand: "FOUR_PLUS_YEARS",
    email: "amina@example.com",
    hasWhatsApp: true,
    summary: "Travaux",
    operationalConsent: true,
    marketingConsent: true,
  });

  const clientValues = createEmptyCampaignFormValues();
  assert.notEqual(clientValues, providerValues);
  assert.deepEqual(clientValues, {
    firstName: "",
    phone: "",
    commune: "",
    subcategoryId: "",
    experienceBand: "",
    timing: "",
    email: "",
    hasWhatsApp: false,
    preferredContact: "PHONE",
    summary: "",
    operationalConsent: false,
    marketingConsent: false,
    website: "",
  });
});
