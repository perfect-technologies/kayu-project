import type { Metadata } from "next";
import { categoriesApi, settingsApi, statsApi } from "@kayu/api";
import { SITE_SETTING_DEFAULTS, type CategoryTreeNode, type PublicStatsResponse, type SiteSettings } from "@kayu/schemas";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { PremiumTeaser } from "@/components/home/PremiumTeaser";
import { StatsBar } from "@/components/home/StatsBar";
import { homeCopy } from "@/copy/home";
import { createServerApiClient } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: { absolute: homeCopy.meta.title } };

async function settle<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export default async function HomePage() {
  const client = createServerApiClient();
  const [stats, tree, settings] = await Promise.all([
    settle<PublicStatsResponse | null>(statsApi(client).getGlobal(), null),
    settle<{ items: CategoryTreeNode[] }>(categoriesApi(client).getTree(), { items: [] }),
    settle<SiteSettings>(settingsApi(client).getPublic(), SITE_SETTING_DEFAULTS),
  ]);
  const categories = tree.items.filter((node) => node.level === 1);

  return (
    <>
      <Hero settings={settings} />
      <StatsBar stats={stats} />
      <CategoryGrid categories={categories} />
      <HowItWorks settings={settings} />
      <PremiumTeaser settings={settings} />
    </>
  );
}
