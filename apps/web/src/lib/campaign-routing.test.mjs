import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
    "/rechercher",
    "/prestataire/provider-id",
    "/prestataire/nouveau",
  ]) {
    assert.equal(isCampaignPublicMarketplacePath(pathname), true, pathname);
  }
});

test("role selection disables smooth scrolling for reduced motion", () => {
  assert.equal(campaignScrollBehavior(true), "auto");
  assert.equal(campaignScrollBehavior(false), "smooth");
});

test("global CSS cannot re-enable smooth scrolling under reduced motion", async () => {
  const css = await readFile("apps/web/src/app/globals.css", "utf8");
  assert.match(
    css,
    /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?html\s*\{[\s\S]*?scroll-behavior:\s*auto\s*!important/,
  );
});

test("campaign loading and interactive transitions respect reduced motion", async () => {
  const [css, landing, form, privacy] = await Promise.all([
    readFile("apps/web/src/app/globals.css", "utf8"),
    readFile("apps/web/src/app/launch/CampaignLanding.tsx", "utf8"),
    readFile("apps/web/src/app/launch/CampaignForm.tsx", "utf8"),
    readFile("apps/web/src/app/launch/confidentialite/page.tsx", "utf8"),
  ]);

  assert.match(landing, /className="k-campaign /);
  assert.match(privacy, /className="k-campaign /);
  assert.match(form, /className="k-campaign-spinner [^"]*animate-spin"/);
  assert.match(
    css,
    /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.k-campaign \.k-campaign-spinner\s*\{[\s\S]*?animation:\s*none\s*!important/,
  );
  assert.match(
    css,
    /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.k-campaign :is\(button, a, input, select, textarea, summary, \[role="button"\]\)[\s\S]*?transition:\s*none\s*!important/,
  );
});

test("public mode is the open marketplace unless campaign is explicitly configured", () => {
  assert.equal(resolvePublicWebMode(undefined), "marketplace");
  assert.equal(resolvePublicWebMode(""), "marketplace");
  assert.equal(resolvePublicWebMode("CAMPAIGN"), "marketplace");
  assert.equal(resolvePublicWebMode("invalid"), "marketplace");
  assert.equal(resolvePublicWebMode("marketplace"), "marketplace");
  assert.equal(resolvePublicWebMode("campaign"), "campaign");
});

test("campaign mode blocks the account-auth route and marketplace mode enables it", () => {
  assert.equal(isCampaignAuthRequest("/login", "campaign"), true);
  assert.equal(isCampaignAuthRequest("/register", "campaign"), true);
  assert.equal(isCampaignAuthRequest("/mon-espace", "campaign"), false);
  assert.equal(isCampaignAuthRequest("/login", "marketplace"), false);
});

test("Supabase user creation is enabled only for explicit marketplace signup", () => {
  assert.equal(shouldCreateAuthUser("signup", true), true);
  assert.equal(shouldCreateAuthUser("login", true), false);
  assert.equal(shouldCreateAuthUser("signup", false), false);
  assert.equal(shouldCreateAuthUser("login", false), false);
});

test("campaign routes select the minimal public shell", () => {
  assert.equal(isCampaignShellPath("/launch"), true);
  assert.equal(isCampaignShellPath("/launch/providers"), true);
  assert.equal(isCampaignShellPath("/launch/confidentialite"), true);
  assert.equal(isCampaignShellPath("/"), false);
  assert.equal(isCampaignShellPath("/login"), false);
  assert.equal(isCampaignShellPath("/launchpad"), false);
});
test("campaign presentation does not claim to authorize protected or campaign routes", () => {
  for (const pathname of [
    "/",
    "/launch",
    "/launch/providers",
    "/launch/clients",
    "/login",
    "/mes-reservations",
    "/mon-espace",
    "/compte",
  ]) {
    assert.equal(isCampaignPublicMarketplacePath(pathname), false, pathname);
  }
});
