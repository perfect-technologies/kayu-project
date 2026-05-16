import assert from "node:assert/strict";
import test from "node:test";
import { computeProviderStrength } from "./provider-strength";

const base = {
  hasAvatar: false,
  portfolioProjectCount: 0,
  hasDescription: false,
  verificationStatus: "PENDING" as const,
  languagesCount: 1,
  skillsCount: 0,
  serviceZonesCount: 1,
};

test("a freshly published profile is tier 'base' at baseline 40", () => {
  const r = computeProviderStrength(base);
  assert.equal(r.score, 40);
  assert.equal(r.tier, "base");
  const photo = r.items.find((i) => i.key === "photo");
  assert.equal(photo?.done, false);
  assert.equal(photo?.points, 15);
});

test("photo + description + 1 portfolio project reaches 'solide'", () => {
  const r = computeProviderStrength({
    ...base,
    hasAvatar: true,
    hasDescription: true,
    portfolioProjectCount: 1,
  });
  assert.equal(r.score, 73);
  assert.equal(r.tier, "solide");
});

test("full enrichment reaches 100 and 'remarquable'", () => {
  const r = computeProviderStrength({
    hasAvatar: true,
    portfolioProjectCount: 3,
    hasDescription: true,
    verificationStatus: "VERIFIED",
    languagesCount: 2,
    skillsCount: 4,
    serviceZonesCount: 2,
  });
  assert.equal(r.score, 100);
  assert.equal(r.tier, "remarquable");
  assert.equal(r.items.every((i) => i.done), true);
});

test("portfolio points scale 0/8/14/20 by project count", () => {
  const pts = (n: number) =>
    computeProviderStrength({ ...base, portfolioProjectCount: n }).items.find(
      (i) => i.key === "portfolio",
    )?.earned;
  assert.equal(pts(0), 0);
  assert.equal(pts(1), 8);
  assert.equal(pts(2), 14);
  assert.equal(pts(3), 20);
  assert.equal(pts(9), 20);
});

test("depth counts when any of languages>=2, skills>=3, zones>=2", () => {
  assert.equal(
    computeProviderStrength({ ...base, languagesCount: 2 }).items.find((i) => i.key === "depth")?.done,
    true,
  );
  assert.equal(
    computeProviderStrength({ ...base, skillsCount: 3 }).items.find((i) => i.key === "depth")?.done,
    true,
  );
  assert.equal(
    computeProviderStrength({ ...base, serviceZonesCount: 2 }).items.find((i) => i.key === "depth")?.done,
    true,
  );
  assert.equal(
    computeProviderStrength(base).items.find((i) => i.key === "depth")?.done,
    false,
  );
});
