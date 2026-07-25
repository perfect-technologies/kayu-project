import "server-only";

import { categoriesApi } from "@kayu/api";

import { createServerApiClient } from "@/lib/api";

export type CampaignSubcategory = {
  id: string;
  name: string;
  slug: string;
};

export type CampaignCategory = {
  id: string;
  name: string;
  slug: string;
  subcategories: CampaignSubcategory[];
};

type UnknownCategory = {
  id?: unknown;
  name?: unknown;
  slug?: unknown;
  subcategories?: unknown;
};

function toCampaignCategories(value: unknown): CampaignCategory[] {
  const rawCategories = Array.isArray(value)
    ? value
    : value &&
        typeof value === "object" &&
        Array.isArray((value as { categories?: unknown }).categories)
      ? (value as { categories: unknown[] }).categories
      : [];

  return rawCategories.flatMap((rawCategory) => {
    const category = rawCategory as UnknownCategory;
    if (
      typeof category.id !== "string" ||
      typeof category.name !== "string" ||
      typeof category.slug !== "string"
    ) {
      return [];
    }

    const subcategories = Array.isArray(category.subcategories)
      ? category.subcategories.flatMap((rawSubcategory) => {
          const subcategory = rawSubcategory as UnknownCategory;
          if (
            typeof subcategory.id !== "string" ||
            typeof subcategory.name !== "string" ||
            typeof subcategory.slug !== "string"
          ) {
            return [];
          }

          return [
            {
              id: subcategory.id,
              name: subcategory.name,
              slug: subcategory.slug,
            },
          ];
        })
      : [];

    return [
      {
        id: category.id,
        name: category.name,
        slug: category.slug,
        subcategories,
      },
    ];
  });
}

export async function loadCampaignCategories(): Promise<CampaignCategory[]> {
  try {
    const response = await categoriesApi(
      createServerApiClient(),
    ).getHierarchy();
    return toCampaignCategories(response);
  } catch {
    // Do not substitute seed slugs for production taxonomy IDs: the lead API
    // accepts only reviewed active IDs. The client renders a retryable state.
    return [];
  }
}

export const campaignPublicConfig = {
  privacyNoticeVersion:
    process.env.NEXT_PUBLIC_CAMPAIGN_PRIVACY_NOTICE_VERSION ??
    "campaign-2026-07-25",
  privacyContact:
    process.env.NEXT_PUBLIC_CAMPAIGN_PRIVACY_CONTACT ??
    "confidentialite@kayou.cd",
} as const;
