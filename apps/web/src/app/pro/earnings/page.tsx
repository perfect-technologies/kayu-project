import type { Metadata } from "next";
import { EarningsClient } from "./EarningsClient";

export const metadata: Metadata = {
  title: "Mes gains · KAYOU",
  description:
    "Suivi hebdomadaire de tes revenus, solde disponible et demandes de retrait manuel.",
};

export default function EarningsPage() {
  return <EarningsClient />;
}
