import { CampaignLanding } from "./launch/CampaignLanding";
import {
  campaignPublicConfig,
  loadCampaignCategories,
} from "./launch/campaign-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const categories = await loadCampaignCategories();

  return (
    <CampaignLanding
      categories={categories}
      privacyNoticeVersion={campaignPublicConfig.privacyNoticeVersion}
      privacyContact={campaignPublicConfig.privacyContact}
    />
  );
}
