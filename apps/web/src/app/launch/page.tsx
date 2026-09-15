import type { Metadata } from "next";

import { CampaignLanding } from "./CampaignLanding";
import { campaignPublicConfig, loadCampaignCategories } from "./campaign-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "KAYOU arrive bientôt à Kinshasa",
  description:
    "Préinscrivez-vous gratuitement au lancement de KAYOU à Kinshasa : proposez vos services ou soyez averti parmi les premiers, sans créer de compte.",
  openGraph: {
    title: "KAYOU arrive bientôt à Kinshasa",
    description:
      "Préinscrivez-vous gratuitement pour faire partie des premiers prestataires KAYOU ou des premiers à chercher un prestataire de confiance à Kinshasa.",
  },
  twitter: {
    card: "summary",
    title: "KAYOU arrive bientôt à Kinshasa",
    description:
      "Préinscrivez-vous gratuitement pour faire partie des premiers à Kinshasa.",
  },
};

export default async function LaunchCampaignPage() {
  const categories = await loadCampaignCategories();

  return (
    <CampaignLanding
      categories={categories}
      privacyNoticeVersion={campaignPublicConfig.privacyNoticeVersion}
      privacyContact={campaignPublicConfig.privacyContact}
    />
  );
}
