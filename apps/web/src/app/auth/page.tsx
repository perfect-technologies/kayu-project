import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { resolvePublicWebMode } from "@/lib/campaign-routing";
import { AuthFlow } from "./AuthFlow";

export const metadata: Metadata = {
  title: "Se connecter · KAYOU",
  description: "Connectez-vous à KAYOU par SMS.",
};

export default function AuthPage() {
  const publicMode = resolvePublicWebMode(process.env.KAYOU_PUBLIC_WEB_MODE);

  if (publicMode === "campaign") {
    redirect("/");
  }

  return <AuthFlow signupEnabled={publicMode === "marketplace"} />;
}
