import assert from "node:assert/strict";
import test from "node:test";
import {
  NO_MATCH,
  buildSearchIntentQuestions,
  categoryOfSubcategory,
  decideSearchIntent,
  readSearchIntent,
  searchIntentState,
  topAnswer,
  type IntentNode,
} from "./search-intent";

const taxonomy: IntentNode[] = [
  {
    slug: "batiment",
    name: "Bâtiment",
    children: [
      { slug: "plomberie", name: "Plomberie", children: [{ slug: "fuites", name: "Dépannage & fuites" }] },
      { slug: "electricite", name: "Électricité" },
    ],
  },
  { slug: "beaute", name: "Beauté", children: [{ slug: "coiffure", name: "Coiffure" }] },
  { slug: "autres", name: "Autres services" },
];

const parents = categoryOfSubcategory(taxonomy);
const thresholds = { name: 0.7, subcategory: 0.6, category: 0.6 };

const choiceOf = (probabilities: Record<string, number>) => {
  const [choice] = Object.entries(probabilities).sort((a, b) => b[1] - a[1])[0]!;
  return { type: "choice" as const, choice, confidence: 0, probabilities };
};
const noulOf = (noul: number) => ({ type: "noul" as const, noul });

test("flat questions offer every level-2 subcategory plus the no-match option, with level-3 names in the description", () => {
  const questions = buildSearchIntentQuestions(taxonomy, "flat-fr");
  const service = questions.service as { type: string; criteria: Record<string, string> };

  assert.equal(service.type, "choice");
  assert.deepEqual(Object.keys(service.criteria), ["plomberie", "electricite", "coiffure", NO_MATCH]);
  assert.equal(service.criteria.plomberie, "Bâtiment › Plomberie (Dépannage & fuites)");
  assert.equal(questions.nom!.type, "noul");
});

test("the English variant appends the gloss and keeps the French label", () => {
  const service = buildSearchIntentQuestions(taxonomy, "flat-en").service as { criteria: Record<string, string> };
  assert.match(service.criteria.plomberie!, /^Bâtiment › Plomberie \(Dépannage & fuites\)\. Plumbing/);
});

test("the fan-out variant asks one category question and one question per category with subcategories", () => {
  const questions = buildSearchIntentQuestions(taxonomy, "fanout-fr");
  assert.deepEqual(Object.keys(questions).sort(), ["categorie", "nom", "service_batiment", "service_beaute"]);
  assert.deepEqual(Object.keys((questions.categorie as { criteria: object }).criteria), ["batiment", "beaute", "autres", NO_MATCH]);
});

test("a taxonomy over 255 options is refused", () => {
  const wide: IntentNode[] = [{ slug: "c", name: "C", children: Array.from({ length: 255 }, (_, i) => ({ slug: `s${i}`, name: `S${i}` })) }];
  assert.throws(() => buildSearchIntentQuestions(wide, "flat-fr"), /at most 255/);
});

test("the state names the query field and trims it", () => {
  assert.deepEqual(searchIntentState("  fuite d'eau "), { recherche: "fuite d'eau" });
});

test("a flat reading sums subcategory probabilities per category in code", () => {
  const reading = readSearchIntent(
    { service: choiceOf({ plomberie: 0.45, electricite: 0.35, coiffure: 0.05, [NO_MATCH]: 0.15 }), nom: noulOf(0.1) },
    taxonomy,
    "flat-fr",
  );
  assert.deepEqual(reading.subcategories[0], { slug: "plomberie", probability: 0.45 });
  assert.equal(reading.categories[0]!.slug, "batiment");
  assert.ok(Math.abs(reading.categories[0]!.probability - 0.8) < 1e-9);
  assert.equal(reading.noMatchProbability, 0.15);
});

test("a fan-out reading scores each path as P(category) × P(service given category)", () => {
  const reading = readSearchIntent(
    {
      categorie: choiceOf({ batiment: 0.8, beaute: 0.1, autres: 0.05, [NO_MATCH]: 0.05 }),
      service_batiment: choiceOf({ plomberie: 0.9, electricite: 0.1 }),
      service_beaute: choiceOf({ coiffure: 1 }),
      nom: noulOf(0.05),
    },
    taxonomy,
    "fanout-fr",
  );
  assert.equal(reading.subcategories[0]!.slug, "plomberie");
  assert.ok(Math.abs(reading.subcategories[0]!.probability - 0.72) < 1e-9);
  assert.equal(reading.noMatchProbability, 0.05);
});

test("a missing answer is an error, not a silent no-filter", () => {
  assert.throws(() => readSearchIntent({ nom: noulOf(0) }, taxonomy, "flat-fr"), /no choice answer for "service"/);
});

test("policy: a likely name bypasses every filter", () => {
  const reading = { nameProbability: 0.9, noMatchProbability: 0, subcategories: [{ slug: "coiffure", probability: 0.95 }], categories: [] };
  assert.deepEqual(decideSearchIntent(reading, thresholds, parents), { level: "none", reason: "name" });
});

test("policy: a clear subcategory filters by it", () => {
  const reading = {
    nameProbability: 0.1,
    noMatchProbability: 0.05,
    subcategories: [{ slug: "plomberie", probability: 0.85 }],
    categories: [{ slug: "batiment", probability: 0.9 }],
  };
  assert.deepEqual(decideSearchIntent(reading, thresholds, parents), {
    level: "subcategory",
    slug: "plomberie",
    categorySlug: "batiment",
    probability: 0.85,
  });
});

test("policy: an unsure subcategory falls back to its category when the category is clear", () => {
  const reading = {
    nameProbability: 0.1,
    noMatchProbability: 0.1,
    subcategories: [
      { slug: "plomberie", probability: 0.45 },
      { slug: "electricite", probability: 0.4 },
    ],
    categories: [{ slug: "batiment", probability: 0.85 }],
  };
  assert.deepEqual(decideSearchIntent(reading, thresholds, parents), { level: "category", slug: "batiment", probability: 0.85 });
});

test("policy: no filter when nothing clears its threshold or no-match wins", () => {
  const unsure = { nameProbability: 0.1, noMatchProbability: 0.3, subcategories: [{ slug: "plomberie", probability: 0.35 }], categories: [{ slug: "batiment", probability: 0.4 }] };
  assert.deepEqual(decideSearchIntent(unsure, thresholds, parents), { level: "none", reason: "unsure" });

  const noMatch = { nameProbability: 0.1, noMatchProbability: 0.7, subcategories: [{ slug: "plomberie", probability: 0.65 }], categories: [{ slug: "batiment", probability: 0.65 }] };
  assert.deepEqual(decideSearchIntent(noMatch, thresholds, parents), { level: "none", reason: "unsure" });
  assert.equal(topAnswer(noMatch), NO_MATCH);
});
