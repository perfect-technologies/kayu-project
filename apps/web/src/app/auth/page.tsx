import type { Metadata } from "next";
import { AuthFlow } from "./AuthFlow";

export const metadata: Metadata = {
  title: "Se connecter · KAYOU",
  description: "Connectez-vous à KAYOU par SMS.",
};

export default function AuthPage() {
  return <AuthFlow />;
}
