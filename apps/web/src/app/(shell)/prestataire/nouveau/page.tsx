import type { Metadata } from "next";
import { ProtectedRoute } from "@/components/guards";
import { onboardingCopy } from "@/copy/onboarding";
import { WizardClient } from "./WizardClient";

export const metadata: Metadata = { title: onboardingCopy.meta.title, description: onboardingCopy.meta.description };

/** Signed in only (anonymous → /login); the client sends an existing provider to its editor. */
export default function Page() {
  return (
    <ProtectedRoute>
      <WizardClient />
    </ProtectedRoute>
  );
}
