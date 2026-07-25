"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import {
  isCampaignShellPath,
  type PublicWebMode,
} from "@/lib/campaign-routing";

const MarketplaceProviders = dynamic(() => import("./MarketplaceProviders"));

export function AppProviders({
  children,
  publicMode,
}: {
  children: React.ReactNode;
  publicMode: PublicWebMode;
}) {
  const pathname = usePathname();

  if (isCampaignShellPath(pathname, publicMode)) {
    return children;
  }

  return <MarketplaceProviders>{children}</MarketplaceProviders>;
}
