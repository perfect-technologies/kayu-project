import type { Metadata } from "next";
import { ProVerificationClient } from "./ProVerificationClient";

export const metadata: Metadata = {
  title: "Vérification · KAYOU",
  description:
    "Vérifie ton identité pour obtenir le badge « De confiance » et accéder aux missions premium.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProVerificationPage({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  const debug = sp.debug === "1";
  return <ProVerificationClient debug={debug} />;
}
