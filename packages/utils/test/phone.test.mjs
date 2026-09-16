import assert from "node:assert/strict";
import test from "node:test";
import {
  isPlausibleDRCMobilePhone,
  normalizePlausibleDRCMobilePhone,
  toE164,
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

test("toE164 normalizes RDC and Congo-Brazzaville numbers", () => {
  for (const input of ["0812 345 678", "812345678", "243812345678", "+243 81 234 5678", "00243812345678", "+243 0812345678"]) {
    assert.equal(toE164(input, "CD"), "+243812345678", input);
  }
  for (const input of ["06 612 3456", "066123456", "242066123456", "+242 06 612 34 56"]) {
    assert.equal(toE164(input, "CG"), "+242066123456", input);
  }
  assert.equal(toE164("+242 06 612 3456", "CD"), "+242066123456");
  assert.equal(toE164("+33 6 12 34 56 78", "CD"), "+33612345678");
});

test("toE164 returns null for numbers that cannot be E.164", () => {
  for (const [input, country] of [
    ["", "CD"],
    ["abc", "CD"],
    ["0812 34", "CD"],
    ["08123456789", "CD"],
    ["+243 81234", "CD"],
    ["6612345", "CG"],
    ["+0123456789", "CD"],
  ]) {
    assert.equal(toE164(input, country), null, input);
  }
});
