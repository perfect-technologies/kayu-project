import type { Metadata } from "next";
import { ProviderDashboardClient } from "./ProviderDashboardClient";

export const metadata: Metadata = {
  title: "Mon espace pro · KAYOU",
  description:
    "Ton tableau de bord : planning du jour, nouvelles demandes, revenus et réponses.",
};

export default function ProviderDashboardPage() {
  return <ProviderDashboardClient />;
}
