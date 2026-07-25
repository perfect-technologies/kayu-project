import type { Metadata } from "next";

import { CampaignLanding } from "../CampaignLanding";
import {
  campaignPublicConfig,
  loadCampaignCategories,
} from "../campaign-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prestataires — KAYOU arrive à Kinshasa",
  description:
    "Faites connaître vos services dès le lancement de KAYOU à Kinshasa. Préinscription gratuite, sans création de compte.",
};

export default async function ProviderCampaignPage() {
  const categories = await loadCampaignCategories();

  return (
    <CampaignLanding
      categories={categories}
      initialRole="provider"
      privacyNoticeVersion={campaignPublicConfig.privacyNoticeVersion}
      privacyContact={campaignPublicConfig.privacyContact}
    />
  );
}
