import { NextResponse, type NextRequest } from "next/server";

import {
  isCampaignPublicMarketplacePath,
  isCampaignAuthRequest,
  resolvePublicWebMode,
} from "@/lib/campaign-routing";

const CAMPAIGN_ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "source",
  "medium",
  "campaign",
  "content",
] as const;

function isDevOnlyPath(pathname: string): boolean {
  return pathname === "/dev" || pathname.startsWith("/dev/");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (process.env.NODE_ENV === "production" && isDevOnlyPath(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  const publicMode = resolvePublicWebMode(process.env.KAYOU_PUBLIC_WEB_MODE);

  if (isCampaignAuthRequest(pathname, publicMode)) {
    const campaignUrl = new URL("/launch", request.url);
    for (const key of CAMPAIGN_ATTRIBUTION_KEYS) {
      const value = request.nextUrl.searchParams.get(key);
      if (value) campaignUrl.searchParams.set(key, value);
    }
    return NextResponse.redirect(campaignUrl);
  }

  if (publicMode === "campaign" && isCampaignPublicMarketplacePath(pathname)) {
    const campaignUrl = new URL("/launch", request.url);
    campaignUrl.search = request.nextUrl.search;
    return NextResponse.redirect(campaignUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
