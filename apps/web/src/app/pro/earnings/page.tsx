import type { Metadata } from "next";
import { EarningsClient } from "./EarningsClient";

export const metadata: Metadata = {
  title: "Mes gains · KAYOU",
  description:
    "Suivi hebdomadaire des missions payees en especes et des confirmations en attente.",
};

export default function EarningsPage() {
  return <EarningsClient />;
}
