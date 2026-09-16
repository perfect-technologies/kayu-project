import type { PrismaClient, ReferenceType } from "@prisma/client";
import { taxonomy } from "./seed-categories";
import { slugify } from "./seed-places";

type SeedPrismaClient = Pick<PrismaClient, "category" | "referenceItem">;

const LIST_SOURCE = "KAYOU : liste de choix";
const SKILL_SOURCE = "K-YOU : taxonomie des services";

// Aliases also carry K-YOU's label where KAYOU renamed a choice.
const lists: Array<{
  type: ReferenceType;
  slugPrefix: string;
  items: Array<{ label: string; aliases?: string[] }>;
}> = [
  {
    type: "LANGUAGE",
    slugPrefix: "language",
    items: [
      { label: "Français", aliases: ["French"] },
      { label: "Lingala" },
      { label: "Swahili", aliases: ["Kiswahili"] },
      { label: "Kikongo" },
      { label: "Tshiluba", aliases: ["Ciluba"] },
      { label: "Anglais", aliases: ["English"] },
    ],
  },
  {
    type: "INTERVENTION_MODE",
    slugPrefix: "mode",
    items: [
      { label: "À domicile" },
      { label: "En atelier", aliases: ["Chez le prestataire"] },
      { label: "À distance" },
      { label: "Sur chantier" },
    ],
  },
  {
    type: "CURRENCY",
    slugPrefix: "currency",
    items: [
      { label: "CDF", aliases: ["Franc congolais", "FC"] },
      { label: "USD", aliases: ["Dollar américain", "$"] },
      { label: "XAF", aliases: ["Franc CFA", "FCFA"] },
    ],
  },
  {
    type: "PRICE_UNIT",
    slugPrefix: "price-unit",
    items: [
      { label: "Par heure" },
      { label: "Par jour" },
      { label: "Par prestation", aliases: ["Par intervention"] },
      { label: "Par m²", aliases: ["Par mètre carré"] },
      { label: "Forfait" },
    ],
  },
];

export function referenceSlug(slugPrefix: string, label: string): string {
  return `${slugPrefix}-${slugify(label.replace("²", "2"))}`;
}

export function skillSlug(subcategorySlug: string): string {
  return `skill-${subcategorySlug}`;
}

export async function seedReferences(prisma: SeedPrismaClient) {
  console.log("Seeding reference lists and skills...");

  for (const list of lists) {
    await prisma.referenceItem.createMany({
      data: list.items.map((item, index) => ({
        type: list.type,
        label: item.label,
        slug: referenceSlug(list.slugPrefix, item.label),
        aliases: item.aliases ?? [],
        order: index + 1,
        source: LIST_SOURCE,
      })),
    });
  }

  const categoryIdBySlug = new Map(
    (await prisma.category.findMany({ select: { id: true, slug: true } })).map(
      (category) => [category.slug, category.id],
    ),
  );

  for (const category of taxonomy) {
    const categoryId = categoryIdBySlug.get(category.slug);
    if (!categoryId) throw new Error(`Seed categories before skills: ${category.slug}`);

    const skills = (category.subs ?? []).flatMap((sub) => [sub, ...(sub.subs ?? [])]);
    if (skills.length === 0) continue;

    await prisma.referenceItem.createMany({
      data: skills.map((skill, index) => ({
        type: "SKILL" as const,
        label: skill.name,
        slug: skillSlug(skill.slug),
        categoryId,
        order: index + 1,
        source: SKILL_SOURCE,
      })),
    });
  }

  console.log(`Seeded ${await prisma.referenceItem.count()} reference items.`);
}
