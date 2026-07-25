import assert from "node:assert/strict";
import test from "node:test";
import {
  isPlausibleDRCMobilePhone,
  normalizePlausibleDRCMobilePhone,
} from "../dist/index.js";

test("canonical DRC mobile normalization accepts supported representations", () => {
  for (const input of [
    "0810 203 040",
    "810203040",
    "243810203040",
    "+243 810 203 040",
  ]) {
    assert.equal(
      normalizePlausibleDRCMobilePhone(input),
      "+243810203040",
    );
  }
});

test("canonical DRC mobile validation rejects boundaries and placeholders", () => {
  for (const input of [
    "81020304",
    "8102030400",
    "+242061234567",
    "+243710203040",
    "+243900000000",
    "+243999999999",
    "+243123456789",
    "not-a-phone",
  ]) {
    assert.equal(isPlausibleDRCMobilePhone(input), false);
    assert.throws(() => normalizePlausibleDRCMobilePhone(input));
  }
});
