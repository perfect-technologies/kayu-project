import type { Metadata } from "next";
import { EarningsClient } from "./EarningsClient";

export const metadata: Metadata = {
  title: "Mes gains · KAYOU",
  description:
    "Suivi hebdomadaire de tes revenus, solde disponible et paiements Mobile Money.",
};

export default function EarningsPage() {
  return <EarningsClient />;
}
