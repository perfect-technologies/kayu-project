import { Suspense } from "react";
import type { Metadata } from "next";
import { ProviderOnboardingClient } from "./ProviderOnboardingClient";

export const metadata: Metadata = {
  title: "Devenir pro · KAYOU",
  description:
    "Complète ton profil en 6 étapes pour commencer à recevoir des missions.",
};

export default function ProviderOnboardingPage() {
  return (
    <Suspense fallback={null}>
      <ProviderOnboardingClient />
    </Suspense>
  );
}
