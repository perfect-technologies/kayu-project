import assert from "node:assert/strict";
import test from "node:test";

import { isCampaignPublicMarketplacePath } from "./campaign-routing.ts";

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
