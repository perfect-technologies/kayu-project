import { NextResponse, type NextRequest } from "next/server";

import { isCampaignPublicMarketplacePath } from "@/lib/campaign-routing";

export function proxy(request: NextRequest) {
  const publicMode = process.env.KAYOU_PUBLIC_WEB_MODE ?? "campaign";

  if (
    publicMode === "campaign" &&
    isCampaignPublicMarketplacePath(request.nextUrl.pathname)
  ) {
    const campaignUrl = new URL("/", request.url);
    campaignUrl.search = request.nextUrl.search;
    return NextResponse.redirect(campaignUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/services/:path*",
    "/categories/:path*",
    "/providers/:path*",
    "/book/:path*",
    "/review/:path*",
  ],
};
