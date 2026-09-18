import { choice, noul, type ChoiceResponse, type NoulResponse, type Questions } from "@typesafe-ai/sdk";
import { SUBCATEGORY_GLOSSES } from "./search-intent.glosses";

// Thresholds are tuned against one version (docs/ai-jev/01-search-intent.md); an alias could move under them.
export const SEARCH_INTENT_MODEL = "jev-1.13.0";
export const NO_MATCH = "aucune";
export const SEARCH_INTENT_VARIANTS = ["flat-fr", "flat-en", "fanout-fr"] as const;
const MAX_CHOICE_OPTIONS = 255;

export type SearchIntentVariant = (typeof SEARCH_INTENT_VARIANTS)[number];

export type IntentNode = { slug: string; name: string; children?: IntentNode[] };

export type SearchIntentState = { recherche: string };

export type SearchIntentThresholds = { name: number; subcategory: number; category: number };

export type Scored = { slug: string; probability: number };

export type SearchIntentReading = {
  nameProbability: number;
  noMatchProbability: number;
  subcategories: Scored[];
  categories: Scored[];
};

export type SearchIntentDecision =
  | { level: "subcategory"; slug: string; categorySlug: string; probability: number }
  | { level: "category"; slug: string; probability: number }
  | { level: "none"; reason: "name" | "unsure" };

type Answers = Record<string, ChoiceResponse | NoulResponse | { type: string }>;

const COPY = {
  fr: {
    service:
      "Le texte `recherche` est ce qu'un client a tapé dans la barre de recherche d'une plateforme de services à Kinshasa et Brazzaville. Il peut être en français, en lingala ou mélanger les deux, sans accents ou mal orthographié. Quel service le client cherche-t-il ?",
    noMatch: "Aucun service de la liste : un nom de personne ou d'entreprise, un texte qui ne demande aucun service, ou un besoin qu'aucun service de la liste ne couvre",
    name: "Le texte `recherche` est-il le nom d'une personne, d'une entreprise ou d'un prestataire, plutôt que la description d'un besoin ?",
    nameTrue: "Un nom propre de personne, d'entreprise, de salon, de garage ou de boutique",
    nameFalse: "La description d'un besoin, d'un métier, d'une panne ou d'un service, ou un texte sans rapport",
    category:
      "Le texte `recherche` est ce qu'un client a tapé dans la barre de recherche d'une plateforme de services à Kinshasa et Brazzaville. Il peut être en français, en lingala ou mélanger les deux, sans accents ou mal orthographié. Dans quelle catégorie de services se trouve ce que le client cherche ?",
    within: (category: string) =>
      `Le texte \`recherche\` vient de la barre de recherche d'une plateforme de services. En supposant que le client cherche un service de la catégorie « ${category} », lequel de ces services cherche-t-il ?`,
  },
  en: {
    service:
      "The text `recherche` is what a client typed into the search bar of a services marketplace in Kinshasa and Brazzaville. It may be French, Lingala or a mix of both, without accents or misspelled. Which service is the client looking for?",
    noMatch: "No service in the list: the name of a person or business, text that asks for no service, or a need no service in the list covers",
    name: "Is the text `recherche` the name of a person, a business or a service provider, rather than the description of a need?",
    nameTrue: "A proper name of a person, business, salon, garage or shop",
    nameFalse: "The description of a need, a trade, a breakdown or a service, or unrelated text",
  },
} as const;

export function searchIntentState(query: string): SearchIntentState {
  return { recherche: query.trim() };
}

export function categoryOfSubcategory(taxonomy: IntentNode[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const category of taxonomy) for (const sub of category.children ?? []) map.set(sub.slug, category.slug);
  return map;
}

function describe(category: IntentNode, sub: IntentNode, gloss?: string): string {
  const leaves = (sub.children ?? []).map((leaf) => leaf.name);
  const label = `${category.name} › ${sub.name}${leaves.length > 0 ? ` (${leaves.join(", ")})` : ""}`;
  return gloss ? `${label}. ${gloss}` : label;
}

function assertOptionCount(criteria: Record<string, unknown>, question: string) {
  const count = Object.keys(criteria).length;
  if (count > MAX_CHOICE_OPTIONS) throw new Error(`${question}: ${count} options, Jev accepts at most ${MAX_CHOICE_OPTIONS}`);
}

export function buildSearchIntentQuestions(taxonomy: IntentNode[], variant: SearchIntentVariant): Questions {
  if (variant === "fanout-fr") return buildFanout(taxonomy);

  const language = variant === "flat-en" ? "en" : "fr";
  const copy = COPY[language];
  const criteria: Record<string, string> = {};
  for (const category of taxonomy) {
    for (const sub of category.children ?? []) {
      criteria[sub.slug] = describe(category, sub, language === "en" ? SUBCATEGORY_GLOSSES[sub.slug] : undefined);
    }
  }
  criteria[NO_MATCH] = copy.noMatch;
  assertOptionCount(criteria, "service");

  return {
    service: choice(copy.service, criteria),
    nom: noul(copy.name, { true: copy.nameTrue, false: copy.nameFalse }),
  };
}

function buildFanout(taxonomy: IntentNode[]): Questions {
  const copy = COPY.fr;
  const categories: Record<string, string> = {};
  const questions: Questions = {};

  for (const category of taxonomy) {
    const subs = category.children ?? [];
    categories[category.slug] = subs.length > 0 ? `${category.name} (${subs.map((sub) => sub.name).join(", ")})` : category.name;
    if (subs.length === 0) continue;

    const criteria: Record<string, string> = {};
    for (const sub of subs) criteria[sub.slug] = describe(category, sub);
    assertOptionCount(criteria, `service_${category.slug}`);
    questions[`service_${category.slug}`] = choice(copy.within(category.name), criteria);
  }
  categories[NO_MATCH] = copy.noMatch;
  assertOptionCount(categories, "categorie");

  return {
    categorie: choice(copy.category, categories),
    ...questions,
    nom: noul(copy.name, { true: copy.nameTrue, false: copy.nameFalse }),
  };
}

function choiceAnswer(answers: Answers, id: string): ChoiceResponse {
  const answer = answers[id];
  if (!answer || answer.type !== "choice") throw new Error(`Jev returned no choice answer for "${id}"`);
  return answer as ChoiceResponse;
}

function noulAnswer(answers: Answers, id: string): NoulResponse {
  const answer = answers[id];
  if (!answer || answer.type !== "noul") throw new Error(`Jev returned no noul answer for "${id}"`);
  return answer as NoulResponse;
}

const byProbability = (a: Scored, b: Scored) => b.probability - a.probability;

// Every variant reduces to the same reading, so the policy and the metrics never branch on the variant.
export function readSearchIntent(answers: Answers, taxonomy: IntentNode[], variant: SearchIntentVariant): SearchIntentReading {
  const nameProbability = noulAnswer(answers, "nom").noul;
  const parents = categoryOfSubcategory(taxonomy);

  if (variant === "fanout-fr") {
    const categorie = choiceAnswer(answers, "categorie");
    const subcategories: Scored[] = [];
    for (const category of taxonomy) {
      if (!category.children?.length) continue;
      const categoryProbability = categorie.probabilities[category.slug] ?? 0;
      const within = choiceAnswer(answers, `service_${category.slug}`);
      for (const [slug, probability] of Object.entries(within.probabilities)) {
        subcategories.push({ slug, probability: categoryProbability * probability });
      }
    }
    const categories = taxonomy.map((category) => ({ slug: category.slug, probability: categorie.probabilities[category.slug] ?? 0 }));
    return {
      nameProbability,
      noMatchProbability: categorie.probabilities[NO_MATCH] ?? 0,
      subcategories: subcategories.sort(byProbability),
      categories: categories.sort(byProbability),
    };
  }

  const service = choiceAnswer(answers, "service");
  const subcategories: Scored[] = [];
  const totals = new Map<string, number>();
  for (const [slug, probability] of Object.entries(service.probabilities)) {
    const parent = parents.get(slug);
    if (!parent) continue;
    subcategories.push({ slug, probability });
    totals.set(parent, (totals.get(parent) ?? 0) + probability);
  }
  return {
    nameProbability,
    noMatchProbability: service.probabilities[NO_MATCH] ?? 0,
    subcategories: subcategories.sort(byProbability),
    categories: [...totals].map(([slug, probability]) => ({ slug, probability })).sort(byProbability),
  };
}

export function decideSearchIntent(
  reading: SearchIntentReading,
  thresholds: SearchIntentThresholds,
  parents: Map<string, string>,
): SearchIntentDecision {
  if (reading.nameProbability >= thresholds.name) return { level: "none", reason: "name" };

  const sub = reading.subcategories[0];
  if (sub && sub.probability >= thresholds.subcategory && sub.probability > reading.noMatchProbability) {
    return { level: "subcategory", slug: sub.slug, categorySlug: parents.get(sub.slug)!, probability: sub.probability };
  }

  const category = reading.categories[0];
  if (category && category.probability >= thresholds.category && category.probability > reading.noMatchProbability) {
    return { level: "category", slug: category.slug, probability: category.probability };
  }

  return { level: "none", reason: "unsure" };
}

/** The single best answer, ignoring thresholds: a subcategory slug or `aucune`. */
export function topAnswer(reading: SearchIntentReading): string {
  const sub = reading.subcategories[0];
  return sub && sub.probability > reading.noMatchProbability ? sub.slug : NO_MATCH;
}
