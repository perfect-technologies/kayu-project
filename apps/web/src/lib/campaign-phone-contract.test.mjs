import assert from "node:assert/strict";
import test from "node:test";

import {
  isPlausibleDRCMobilePhone,
  normalizePlausibleDRCMobilePhone,
} from "../../../../packages/utils/src/phone.ts";
import { normalizeCampaignPhone } from "./campaign-leads.ts";

const CANONICAL_ACCEPTED = [
  ["0810 203 040", "+243810203040"],
  ["810203040", "+243810203040"],
  ["243810203040", "+243810203040"],
  ["+243 810 203 040", "+243810203040"],
  ["0998 765 432", "+243998765432"],
];

const CANONICAL_REJECTED = [
  "+242061234567",
  "81020304",
  "8102030400",
  "+243710203040",
  "+243900000000",
  "+243999999999",
  "+243123456789",
  "+243012345678",
];

test("web and shared code accept the backend canonical DRC mobile fixtures", () => {
  for (const [input, expected] of CANONICAL_ACCEPTED) {
    assert.equal(normalizePlausibleDRCMobilePhone(input), expected, input);
    assert.equal(isPlausibleDRCMobilePhone(input), true, input);
    assert.equal(normalizeCampaignPhone(input), expected, input);
  }
});

test("web and shared code reject backend non-mobile and placeholder fixtures", () => {
  for (const input of CANONICAL_REJECTED) {
    assert.equal(isPlausibleDRCMobilePhone(input), false, input);
    assert.throws(() => normalizePlausibleDRCMobilePhone(input), undefined, input);
    assert.equal(normalizeCampaignPhone(input), null, input);
  }
});
