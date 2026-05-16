export type ProviderStrengthInput = {
  hasAvatar: boolean;
  portfolioProjectCount: number;
  hasDescription: boolean;
  verificationStatus: "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED";
  languagesCount: number;
  skillsCount: number;
  serviceZonesCount: number;
};

export type ProviderStrengthTier = "base" | "solide" | "remarquable";

export type ProviderStrengthItem = {
  key: "photo" | "portfolio" | "description" | "verification" | "depth";
  label: string;
  done: boolean;
  points: number; // max points this item can contribute
  earned: number; // points currently earned (0..points)
};

export type ProviderStrengthResult = {
  score: number; // 0..100
  tier: ProviderStrengthTier;
  items: ProviderStrengthItem[];
};

// Baseline awarded once the profile is published (identity, trade, zone, price
// are all required to publish — they are the essentials).
const BASELINE = 40;

function portfolioEarned(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 8;
  if (count === 2) return 14;
  return 20;
}

export function computeProviderStrength(
  input: ProviderStrengthInput,
): ProviderStrengthResult {
  const depthDone =
    input.languagesCount >= 2 ||
    input.skillsCount >= 3 ||
    input.serviceZonesCount >= 2;

  const items: ProviderStrengthItem[] = [
    {
      key: "photo",
      label: "Ajoute ta photo",
      done: input.hasAvatar,
      points: 15,
      earned: input.hasAvatar ? 15 : 0,
    },
    {
      key: "portfolio",
      label: "Construis ton portfolio",
      done: input.portfolioProjectCount >= 3,
      points: 20,
      earned: portfolioEarned(input.portfolioProjectCount),
    },
    {
      key: "description",
      label: "Soigne ta présentation",
      done: input.hasDescription,
      points: 10,
      earned: input.hasDescription ? 10 : 0,
    },
    {
      key: "verification",
      label: "Fais-toi vérifier",
      done: input.verificationStatus === "VERIFIED",
      points: 10,
      earned: input.verificationStatus === "VERIFIED" ? 10 : 0,
    },
    {
      key: "depth",
      label: "Complète tes infos",
      done: depthDone,
      points: 5,
      earned: depthDone ? 5 : 0,
    },
  ];

  const score = Math.min(
    100,
    BASELINE + items.reduce((sum, item) => sum + item.earned, 0),
  );

  const tier: ProviderStrengthTier =
    score >= 85 ? "remarquable" : score >= 55 ? "solide" : "base";

  return { score, tier, items };
}
