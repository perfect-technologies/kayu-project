import type { Metadata } from "next";

import { CampaignLanding } from "../CampaignLanding";
import {
  campaignPublicConfig,
  loadCampaignCategories,
} from "../campaign-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Besoin d’un service — KAYOU arrive à Kinshasa",
  description:
    "Préinscrivez-vous gratuitement pour être parmi les premiers à chercher un prestataire de confiance avec KAYOU à Kinshasa. Aucun compte n’est créé.",
};

export default async function ClientCampaignPage() {
  const categories = await loadCampaignCategories();

  return (
    <CampaignLanding
      categories={categories}
      initialRole="client"
      privacyNoticeVersion={campaignPublicConfig.privacyNoticeVersion}
      privacyContact={campaignPublicConfig.privacyContact}
    />
  );
}
