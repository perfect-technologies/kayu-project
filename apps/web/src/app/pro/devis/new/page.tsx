import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { launchFlags } from "@/lib/launch-flags";
import { QuoteComposeClient } from "./QuoteComposeClient";

export const metadata: Metadata = {
  title: "Nouveau devis · KAYOU",
  description:
    "Construisez un devis détaillé et voyez la commission KAYOU en direct.",
};

export default function QuoteComposePage() {
  if (!launchFlags.enableQuoteMarketplace) {
    redirect("/pro");
  }

  return (
    <Suspense fallback={null}>
      <QuoteComposeClient />
    </Suspense>
  );
}
