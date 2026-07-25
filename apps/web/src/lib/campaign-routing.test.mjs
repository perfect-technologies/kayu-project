import assert from "node:assert/strict";
import test from "node:test";

import {
  campaignScrollBehavior,
  isCampaignPublicMarketplacePath,
  isCampaignShellPath,
  isCampaignAuthRequest,
  resolvePublicWebMode,
  shouldCreateAuthUser,
} from "./campaign-routing.ts";

test("campaign presentation redirects public marketplace routes", () => {
  for (const pathname of [
    "/services",
    "/services/plomberie",
    "/categories/plomberie",
    "/providers/provider-id",
    "/book/provider-id",
    "/review/provider-id",
  ]) {
    assert.equal(isCampaignPublicMarketplacePath(pathname), true, pathname);
  }
});

test("role selection disables smooth scrolling for reduced motion", () => {
  assert.equal(campaignScrollBehavior(true), "auto");
  assert.equal(campaignScrollBehavior(false), "smooth");
});

test("public mode fails closed unless marketplace is explicitly configured", () => {
  assert.equal(resolvePublicWebMode(undefined), "campaign");
  assert.equal(resolvePublicWebMode(""), "campaign");
  assert.equal(resolvePublicWebMode("CAMPAIGN"), "campaign");
  assert.equal(resolvePublicWebMode("invalid"), "campaign");
  assert.equal(resolvePublicWebMode("marketplace"), "marketplace");
});

test("campaign mode blocks the account-auth route and marketplace mode enables it", () => {
  assert.equal(isCampaignAuthRequest("/auth", "campaign"), true);
  assert.equal(isCampaignAuthRequest("/dashboard", "campaign"), false);
  assert.equal(isCampaignAuthRequest("/auth", "marketplace"), false);
});

test("Supabase user creation is enabled only for explicit marketplace signup", () => {
  assert.equal(shouldCreateAuthUser("signup", true), true);
  assert.equal(shouldCreateAuthUser("login", true), false);
  assert.equal(shouldCreateAuthUser("signup", false), false);
  assert.equal(shouldCreateAuthUser("login", false), false);
});

test("campaign routes select the minimal public shell", () => {
  assert.equal(isCampaignShellPath("/", "campaign"), true);
  assert.equal(isCampaignShellPath("/launch/providers", "campaign"), true);
  assert.equal(isCampaignShellPath("/launch/confidentialite", "marketplace"), true);
  assert.equal(isCampaignShellPath("/", "marketplace"), false);
  assert.equal(isCampaignShellPath("/auth", "campaign"), false);
});
test("campaign presentation does not claim to authorize protected or campaign routes", () => {
  for (const pathname of [
    "/",
    "/launch/providers",
    "/launch/clients",
    "/auth",
    "/dashboard",
    "/bookings",
    "/pro",
  ]) {
    assert.equal(isCampaignPublicMarketplacePath(pathname), false, pathname);
  }
});
