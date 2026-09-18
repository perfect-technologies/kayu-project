import assert from "node:assert/strict";
import test from "node:test";
import { categoryOfSubcategory, type IntentNode, type SearchIntentReading } from "../../src/modules/jev/search-intent";
import {
  baselineReaches,
  calibration,
  computeMetrics,
  costPer10k,
  passBar,
  percentile,
  tuneThresholds,
  type EvalQuery,
  type EvalRun,
} from "./scoring";

const taxonomy: IntentNode[] = [
  {
    slug: "batiment",
    name: "Bâtiment & Construction",
    children: [
      { slug: "plomberie", name: "Plomberie", children: [{ slug: "fuites", name: "Dépannage & fuites" }] },
      { slug: "electricite", name: "Électricité" },
    ],
  },
  { slug: "beaute", name: "Beauté", children: [{ slug: "coiffure", name: "Coiffure" }] },
];
const parents = categoryOfSubcategory(taxonomy);

const query = (id: string, q: string, expect: string[], extra: Partial<EvalQuery> = {}): EvalQuery => ({
  id,
  q,
  expect,
  kind: expect.length > 0 ? "service" : "name",
  lang: "fr",
  split: "test",
  ...extra,
});

const reading = (sub: Record<string, number>, noMatch = 0, name = 0): SearchIntentReading => {
  const subcategories = Object.entries(sub)
    .map(([slug, probability]) => ({ slug, probability }))
    .sort((a, b) => b.probability - a.probability);
  const totals = new Map<string, number>();
  for (const { slug, probability } of subcategories) totals.set(parents.get(slug)!, (totals.get(parents.get(slug)!) ?? 0) + probability);
  const categories = [...totals].map(([slug, probability]) => ({ slug, probability })).sort((a, b) => b.probability - a.probability);
  return { nameProbability: name, noMatchProbability: noMatch, subcategories, categories };
};

const run = (id: string, value: SearchIntentReading | null, extra: Partial<EvalRun> = {}): EvalRun => ({
  id,
  latencyMs: 100,
  inputTokens: 1000,
  model: "jev-1.13.0",
  reading: value,
  error: value ? null : "boom",
  ...extra,
});

const thresholds = { name: 0.7, subcategory: 0.6, category: 0.6 };

test("coverage counts a right subcategory and a right parent category; a wrong filter is harm, no filter is not", () => {
  const queries = [
    query("a", "fuite", ["plomberie"]),
    query("b", "courant", ["electricite"]),
    query("c", "tresses", ["coiffure"]),
    query("d", "???", ["coiffure"]),
  ];
  const runs = new Map([
    ["a", run("a", reading({ plomberie: 0.9, electricite: 0.05 }))],
    ["b", run("b", reading({ plomberie: 0.4, electricite: 0.4 }))],
    ["c", run("c", reading({ plomberie: 0.8, coiffure: 0.1 }))],
    ["d", run("d", null)],
  ]);

  const metrics = computeMetrics(queries, runs, thresholds, parents);
  assert.deepEqual(metrics.coverage, { hits: 2, n: 4 });
  assert.deepEqual(metrics.wrongFilter, { hits: 1, n: 4 });
  assert.deepEqual(metrics.top1, { hits: 1, n: 4 });
  assert.equal(metrics.errors, 1);
});

test("any filter on a name or off-topic query is a false filter", () => {
  const queries = [query("n1", "Mama Nzuzi", []), query("n2", "Salon Élégance", [], { kind: "name" })];
  const runs = new Map([
    ["n1", run("n1", reading({ coiffure: 0.9 }, 0, 0.2))],
    ["n2", run("n2", reading({ coiffure: 0.9 }, 0, 0.95))],
  ]);
  assert.deepEqual(computeMetrics(queries, runs, thresholds, parents).falseFilter, { hits: 1, n: 2 });
});

test("tuning prefers coverage within the harm limits over more coverage outside them", () => {
  const queries = [
    ...Array.from({ length: 9 }, (_, i) => query(`ok${i}`, "fuite", ["plomberie"])),
    query("risky", "tresses", ["coiffure"]),
  ];
  const runs = new Map<string, EvalRun>(queries.map((q) => [q.id, run(q.id, reading({ plomberie: 0.95 }))]));
  runs.set("risky", run("risky", reading({ plomberie: 0.3, electricite: 0.25, coiffure: 0.2 })));

  const tuned = tuneThresholds(queries, runs, parents);
  assert.equal(tuned.withinLimits, true);
  assert.equal(tuned.metrics.coverage.hits, 9);
  assert.equal(tuned.metrics.wrongFilter.hits, 0);
  assert.ok(tuned.thresholds.subcategory > 0.3);
});

test("the baseline is a case-insensitive, accent-sensitive substring of a name on the expected path", () => {
  assert.equal(baselineReaches(query("a", "plomberie", ["plomberie"]), taxonomy), true);
  assert.equal(baselineReaches(query("b", "FUITES", ["plomberie"]), taxonomy), true);
  assert.equal(baselineReaches(query("c", "plombier", ["plomberie"]), taxonomy), false);
  assert.equal(baselineReaches(query("d", "electricite", ["electricite"]), taxonomy), false);
  assert.equal(baselineReaches(query("e", "coiffure", ["plomberie"]), taxonomy), false);
});

test("calibration buckets service queries by the top probability", () => {
  const queries = [query("a", "x", ["plomberie"]), query("b", "y", ["coiffure"]), query("c", "z", ["coiffure"])];
  const runs = new Map([
    ["a", run("a", reading({ plomberie: 0.95 }))],
    ["b", run("b", reading({ plomberie: 0.6 }))],
    ["c", run("c", reading({ coiffure: 1 }))],
  ]);
  const buckets = calibration(queries, runs);
  assert.deepEqual(buckets.map((b) => b.rate), [
    { hits: 0, n: 0 },
    { hits: 0, n: 1 },
    { hits: 0, n: 0 },
    { hits: 2, n: 2 },
  ]);
});

test("percentile, cost and the pass bar", () => {
  assert.equal(percentile([100, 200, 300, 400, 1000], 95), 1000);
  assert.equal(percentile([100, 200, 300, 400, 1000], 50), 300);
  assert.equal(costPer10k([run("a", reading({ plomberie: 1 }), { inputTokens: 2000 }), run("b", null)]), 0.84);

  const rows = passBar(
    {
      coverage: { hits: 90, n: 100 },
      coverageByLang: { fr: { hits: 50, n: 55 }, fr_plain: { hits: 18, n: 20 }, ln_mix: { hits: 14, n: 20 }, en: { hits: 5, n: 5 } },
      wrongFilter: { hits: 3, n: 100 },
      falseFilter: { hits: 1, n: 12 },
      top1: { hits: 80, n: 100 },
      top1ByLang: { fr: { hits: 0, n: 0 }, fr_plain: { hits: 0, n: 0 }, ln_mix: { hits: 0, n: 0 }, en: { hits: 0, n: 0 } },
      errors: 0,
    },
    { hits: 20, n: 100 },
    950,
  );
  assert.deepEqual(rows.map((row) => row.pass), [true, true, true, true, true, true, false]);
});
