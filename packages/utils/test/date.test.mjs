import assert from "node:assert/strict";
import test from "node:test";
import { formatMoney, formatRelativeFr, formatSlotLocal } from "../dist/index.js";

const now = new Date("2026-09-16T12:00:00Z");
const ago = (ms) => new Date(now.getTime() - ms);
const MIN = 60_000;

test("formatRelativeFr walks from à l'instant to a short French date", () => {
  assert.equal(formatRelativeFr(ago(20_000), now), "à l'instant");
  assert.equal(formatRelativeFr(new Date(now.getTime() + 5_000), now), "à l'instant");
  assert.equal(formatRelativeFr(ago(3 * MIN), now), "il y a 3 min");
  assert.equal(formatRelativeFr(ago(59 * MIN), now), "il y a 59 min");
  assert.equal(formatRelativeFr(ago(2 * 60 * MIN), now), "il y a 2 h");
  assert.equal(formatRelativeFr(ago(4 * 24 * 60 * MIN).toISOString(), now), "il y a 4 j");
  assert.equal(formatRelativeFr("2026-09-02T12:00:00Z", now), "2 sept.");
  assert.equal(formatRelativeFr("2025-09-12T12:00:00Z", now), "12 sept. 2025");
  assert.equal(formatRelativeFr("not a date", now), "");
});

test("formatSlotLocal renders the instant in the provider timezone", () => {
  assert.deepEqual(formatSlotLocal("2026-09-16T08:00:00.000Z", "Africa/Kinshasa"), {
    date: "2026-09-16",
    time: "09:00",
    label: "mer. 16 sept. · 09:00",
  });
  assert.deepEqual(formatSlotLocal(new Date("2026-09-16T22:30:00Z"), "Africa/Lubumbashi"), {
    date: "2026-09-17",
    time: "00:30",
    label: "jeu. 17 sept. · 00:30",
  });
});

test("formatMoney appends the local currency symbol", () => {
  assert.equal(formatMoney(25000, "CDF"), "25 000 FC");
  assert.equal(formatMoney(1250000, "XAF"), "1 250 000 FCFA");
  assert.equal(formatMoney(40, "USD"), "40 $");
});
