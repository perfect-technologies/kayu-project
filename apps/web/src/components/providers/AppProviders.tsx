"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import { isCampaignShellPath } from "@/lib/campaign-routing";

const MarketplaceProviders = dynamic(() => import("./MarketplaceProviders"));

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isCampaignShellPath(pathname)) {
    return children;
  }

  return <MarketplaceProviders>{children}</MarketplaceProviders>;
}
