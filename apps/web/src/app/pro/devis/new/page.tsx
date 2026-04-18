import type { Metadata } from "next";
import { QuoteComposeClient } from "./QuoteComposeClient";

export const metadata: Metadata = {
  title: "Nouveau devis · KAYOU",
  description:
    "Construisez un devis détaillé, voyez la commission KAYOU et votre payout en direct.",
};

export default function QuoteComposePage() {
  return <QuoteComposeClient />;
}
